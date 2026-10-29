#!/usr/bin/env bash
# One-time access setup for Purrbi's DEVELOPMENT Firebase project. The project Owner runs it once in
# Google Cloud Shell (https://shell.cloud.google.com, already signed in):
#
#     git clone https://github.com/a009v795-sudo/purrbi && bash purrbi/backend/tools/gcp/setup-dev-access.sh
#
# Safe to re-run: everything is checked before it is created, and IAM grants are idempotent.
# It never creates a service-account key and never reads or prints a secret value.
#
# What it sets up (development project only):
#   1. The Google Cloud APIs the backend uses.
#   2. The Cloud Firestore (default) database in nam5 (US), if none exists yet.
#   3. purrbi-functions — the identity the Cloud Functions run as. It can use Firestore, the
#      project's Storage bucket, Eventarc delivery and the OPENAI_API_KEY secret, nothing else.
#   4. purrbi-deployer — the identity GitHub Actions deploys as. No Owner/Editor; it can deploy
#      functions that run as purrbi-functions, publish security rules and indexes, and read
#      metadata. It cannot read the secret's value or change IAM.
#   5. GitHub OIDC sign-in (Workload Identity Federation): only manually started runs of the
#      "deploy-backend" workflow on the main branch of the Purrbi repository can act as
#      purrbi-deployer. No key file exists anywhere.
#   6. Bindings that Firebase's deploy tool expects for event-driven functions on Google-managed
#      identities (default compute account, Pub/Sub agent, Cloud Build's identity if it lacks one).
#   7. A cleanup policy so function container images older than 1 day are deleted automatically.
# It only adds: no IAM binding, resource or file in the project is removed or replaced, and it
# does not change billing. It does not touch any other project (every command names this one).
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-purrbi-49c21}"
REGION="${REGION:-us-central1}"
FIRESTORE_LOCATION="${FIRESTORE_LOCATION:-nam5}"         # the existing (default) database (US multi-region)
STORAGE_BUCKET="${STORAGE_BUCKET:-purrbi-49c21.firebasestorage.app}"   # the app's Firebase Storage bucket
GITHUB_REPO="${GITHUB_REPO:-a009v795-sudo/purrbi}"
GITHUB_REPO_ID="${GITHUB_REPO_ID:-1437698791}"     # numeric ids survive repository renames
GITHUB_OWNER_ID="${GITHUB_OWNER_ID:-325066336}"
SECRET_NAME="${SECRET_NAME:-OPENAI_API_KEY}"
POOL_ID="github"
PROVIDER_ID="purrbi-github"
RUNTIME_SA_ID="purrbi-functions"
DEPLOYER_SA_ID="purrbi-deployer"
DEPLOY_ROLE_ID="purrbiDeployMetadata"

step() { printf '\n== %s\n' "$*"; }
ok() { printf '   ok: %s\n' "$*"; }
note() { printf '   note: %s\n' "$*"; }
fail() { printf '\nSTOPPED: %s\n' "$*" >&2; exit 1; }
quiet() { "$@" >/dev/null 2>&1; }
# A service account or role created a moment ago can take a minute to become visible to IAM
# ("... does not exist"). Retry only that error; anything else stops the script.
with_retry() {
  local attempt out
  for attempt in 1 2 3 4 5 6; do
    if out="$("$@" 2>&1)"; then return 0; fi
    if [ "$attempt" -lt 6 ] && grep -qiE "does not exist|not found" <<<"$out"; then
      note "a just-created identity is not visible to IAM yet; retrying in $((attempt * 10))s"
      sleep $((attempt * 10))
    else
      printf '%s\n' "$out" >&2
      return 1
    fi
  done
}

step "Project"
ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1)"
[ -n "$ACCOUNT" ] || fail "Not signed in. Open Cloud Shell from the Google Cloud console and try again."
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)' 2>/dev/null)" ||
  fail "Project $PROJECT_ID is not visible to $ACCOUNT."
ok "$PROJECT_ID (number $PROJECT_NUMBER), signed in as $ACCOUNT"

RUNTIME_SA="${RUNTIME_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_SA="${DEPLOYER_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
grant_project() { # member role
  with_retry gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$1" --role="$2" --condition=None --quiet
  ok "$2 → ${1#*:}"
}

step "APIs"
APIS=(
  cloudfunctions.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com run.googleapis.com
  eventarc.googleapis.com pubsub.googleapis.com storage.googleapis.com firestore.googleapis.com
  firebaserules.googleapis.com firebasestorage.googleapis.com firebase.googleapis.com
  secretmanager.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com
  cloudresourcemanager.googleapis.com serviceusage.googleapis.com logging.googleapis.com
  identitytoolkit.googleapis.com
)
if ! gcloud services enable "${APIS[@]}" --project "$PROJECT_ID" --quiet; then
  fail "Some APIs could not be enabled. Most often the project is not on the Blaze plan yet: Firebase console → Usage and billing → Details & settings → Modify plan."
fi
ok "${#APIS[@]} APIs enabled"
for svc in pubsub.googleapis.com eventarc.googleapis.com; do
  quiet gcloud beta services identity create --service="$svc" --project "$PROJECT_ID" --quiet || true
done
ok "service identities for Pub/Sub and Eventarc exist"

step "Cloud Firestore"
DB_LOCATION="$(gcloud firestore databases describe --database='(default)' --project "$PROJECT_ID" --format='value(locationId)' 2>/dev/null || true)"
if [ -z "$DB_LOCATION" ]; then
  gcloud firestore databases create --database='(default)' --location="$FIRESTORE_LOCATION" --type=firestore-native --project "$PROJECT_ID" --quiet >/dev/null
  ok "created (default) in $FIRESTORE_LOCATION"
elif [ "$DB_LOCATION" != "$FIRESTORE_LOCATION" ]; then
  note "(default) already exists in $DB_LOCATION (not $FIRESTORE_LOCATION). That is fine if it is in the US; triggers will follow its location."
else
  ok "(default) exists in $DB_LOCATION"
fi

step "Runtime identity: $RUNTIME_SA"
quiet gcloud iam service-accounts describe "$RUNTIME_SA" --project "$PROJECT_ID" ||
  gcloud iam service-accounts create "$RUNTIME_SA_ID" --project "$PROJECT_ID" \
    --display-name="Purrbi Cloud Functions runtime" \
    --description="Runs Purrbi's Cloud Functions. Firestore, Storage bucket objects, Eventarc delivery and the OpenAI secret only." --quiet >/dev/null
ok "service account exists"
for role in roles/datastore.user roles/eventarc.eventReceiver roles/run.invoker roles/logging.logWriter; do
  grant_project "serviceAccount:$RUNTIME_SA" "$role"
done

BUCKET=""
BUCKET_LOCATION="$(gcloud storage buckets describe "gs://$STORAGE_BUCKET" --project "$PROJECT_ID" --format='value(location)' 2>/dev/null || true)"
if [ -n "$BUCKET_LOCATION" ]; then
  BUCKET="$STORAGE_BUCKET"
  with_retry gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$RUNTIME_SA" --role=roles/storage.objectUser --quiet
  ok "roles/storage.objectUser on gs://$BUCKET only (location $BUCKET_LOCATION)"
else
  note "Storage bucket gs://$STORAGE_BUCKET was not found. Create it (Firebase console → Storage → Get started), then run this script again."
fi

SECRET_OK=false
if quiet gcloud secrets describe "$SECRET_NAME" --project "$PROJECT_ID"; then
  SECRET_OK=true
  VERSIONS="$(gcloud secrets versions list "$SECRET_NAME" --project "$PROJECT_ID" --filter='state=ENABLED' --format='value(name)' | wc -l | tr -d ' ')"
  [ "$VERSIONS" -gt 0 ] || note "Secret $SECRET_NAME has no enabled version; add the key as a new version in Secret Manager."
  with_retry gcloud secrets add-iam-policy-binding "$SECRET_NAME" --project "$PROJECT_ID" --member="serviceAccount:$RUNTIME_SA" --role=roles/secretmanager.secretAccessor --quiet
  ok "roles/secretmanager.secretAccessor on secret $SECRET_NAME only ($VERSIONS enabled version(s); value not read)"
else
  note "Secret $SECRET_NAME was not found in Secret Manager. Tell Claude the exact secret NAME (never the value), or create a secret with that name."
  gcloud secrets list --project "$PROJECT_ID" --format='value(name)' 2>/dev/null | sed 's/^/   existing secret name: /' || true
fi

step "Deploy identity: $DEPLOYER_SA"
quiet gcloud iam service-accounts describe "$DEPLOYER_SA" --project "$PROJECT_ID" ||
  gcloud iam service-accounts create "$DEPLOYER_SA_ID" --project "$PROJECT_ID" \
    --display-name="Purrbi GitHub deployer (development)" \
    --description="Used only by the deploy-backend GitHub workflow through OIDC. No keys." --quiet >/dev/null
ok "service account exists (no keys)"

# Read-only metadata the deploy tool looks up (project, default bucket, database location).
DEPLOY_PERMS="firebase.projects.get,firebasestorage.defaultBucket.get,firebasestorage.buckets.get,firebasestorage.buckets.list,resourcemanager.projects.get,datastore.databases.getMetadata,datastore.databases.list"
ROLE_READY=false
if quiet gcloud iam roles describe "$DEPLOY_ROLE_ID" --project "$PROJECT_ID"; then
  gcloud iam roles update "$DEPLOY_ROLE_ID" --project "$PROJECT_ID" --permissions="$DEPLOY_PERMS" --quiet >/dev/null && ROLE_READY=true
else
  gcloud iam roles create "$DEPLOY_ROLE_ID" --project "$PROJECT_ID" --title="Purrbi deploy metadata (read-only)" \
    --description="Read-only project, bucket and database metadata used by firebase deploy." --permissions="$DEPLOY_PERMS" --stage=GA --quiet >/dev/null && ROLE_READY=true
fi
if $ROLE_READY; then
  grant_project "serviceAccount:$DEPLOYER_SA" "projects/$PROJECT_ID/roles/$DEPLOY_ROLE_ID"
else
  note "The read-only custom role could not be created here; using the predefined read-only Firebase Viewer role instead."
  grant_project "serviceAccount:$DEPLOYER_SA" roles/firebase.viewer
fi
for role in roles/cloudfunctions.developer roles/firebaserules.admin roles/datastore.indexAdmin roles/serviceusage.serviceUsageConsumer; do
  grant_project "serviceAccount:$DEPLOYER_SA" "$role"
done
with_retry gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --project "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SA" --role=roles/iam.serviceAccountUser --quiet
ok "roles/iam.serviceAccountUser on $RUNTIME_SA only (deploys functions that run as it)"
if $SECRET_OK; then
  with_retry gcloud secrets add-iam-policy-binding "$SECRET_NAME" --project "$PROJECT_ID" --member="serviceAccount:$DEPLOYER_SA" --role=roles/secretmanager.viewer --quiet
  ok "roles/secretmanager.viewer on secret $SECRET_NAME (metadata only, cannot read the value)"
fi

step "Bindings the Firebase deploy tool expects on a first deploy"
# firebase-tools checks these on the first deploy of event-driven functions and would try to add
# them itself, which needs project IAM rights the deployer deliberately does not have.
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
if quiet gcloud iam service-accounts describe "$COMPUTE_SA" --project "$PROJECT_ID"; then
  grant_project "serviceAccount:$COMPUTE_SA" roles/run.invoker
  grant_project "serviceAccount:$COMPUTE_SA" roles/eventarc.eventReceiver
else
  note "Default compute service account not present; nothing to add."
fi
grant_project "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com" roles/iam.serviceAccountTokenCreator

BUILD_SA="$(gcloud builds get-default-service-account --project "$PROJECT_ID" --format='value(serviceAccountEmail)' 2>/dev/null | sed 's#.*/##' || true)"
if [ -n "$BUILD_SA" ] && quiet gcloud iam service-accounts describe "$BUILD_SA" --project "$PROJECT_ID"; then
  BUILD_ROLES="$(gcloud projects get-iam-policy "$PROJECT_ID" --flatten=bindings --filter="bindings.members:serviceAccount:$BUILD_SA" --format='value(bindings.role)' 2>/dev/null | tr '\n' ' ')"
  # Function builds need the builder role (or Editor/Owner, which new projects often no longer grant).
  if grep -qE 'roles/(cloudbuild\.builds\.builder|editor|owner)( |$)' <<<"$BUILD_ROLES"; then
    ok "build identity $BUILD_SA can already build ($BUILD_ROLES)"
  else
    grant_project "serviceAccount:$BUILD_SA" roles/cloudbuild.builds.builder
  fi
else
  note "Could not read Cloud Build's default identity; the first deploy will report any build permission problem."
fi

step "Function images: repository and cleanup policy"
if ! quiet gcloud artifacts repositories describe gcf-artifacts --location="$REGION" --project "$PROJECT_ID"; then
  gcloud artifacts repositories create gcf-artifacts --repository-format=docker --location="$REGION" --project "$PROJECT_ID" \
    --description="Cloud Functions container images (Purrbi)" --quiet >/dev/null
fi
EXISTING_POLICIES="$(gcloud artifacts repositories describe gcf-artifacts --location="$REGION" --project "$PROJECT_ID" --format='value(cleanupPolicies)' 2>/dev/null || true)"
if grep -q "firebase-functions-cleanup" <<<"$EXISTING_POLICIES"; then
  ok "gcf-artifacts in $REGION already deletes function images older than 1 day"
elif [ -z "$EXISTING_POLICIES" ]; then
  POLICY_FILE="$(mktemp)"
  cat >"$POLICY_FILE" <<'JSON'
[{"name": "firebase-functions-cleanup", "action": {"type": "Delete"}, "condition": {"tagState": "any", "olderThan": "1d"}}]
JSON
  gcloud artifacts repositories set-cleanup-policies gcf-artifacts --location="$REGION" --project "$PROJECT_ID" --policy="$POLICY_FILE" --no-dry-run --quiet >/dev/null
  rm -f "$POLICY_FILE"
  ok "gcf-artifacts in $REGION deletes function images older than 1 day"
else
  note "gcf-artifacts already has cleanup policies; left unchanged."
fi
with_retry gcloud artifacts repositories add-iam-policy-binding gcf-artifacts --location="$REGION" --project "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SA" --role=roles/artifactregistry.reader --quiet
ok "deployer can read the image repository and its cleanup policy"

step "GitHub OIDC (Workload Identity Federation)"
quiet gcloud iam workload-identity-pools describe "$POOL_ID" --location=global --project "$PROJECT_ID" ||
  gcloud iam workload-identity-pools create "$POOL_ID" --location=global --project "$PROJECT_ID" \
    --display-name="GitHub Actions" --description="OIDC sign-in for the Purrbi repository" --quiet >/dev/null
ok "pool $POOL_ID"
CONDITION="assertion.repository_id == '${GITHUB_REPO_ID}' && assertion.repository_owner_id == '${GITHUB_OWNER_ID}' && assertion.ref == 'refs/heads/main' && assertion.event_name == 'workflow_dispatch'"
MAPPING="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref,attribute.workflow=assertion.workflow,attribute.event_name=assertion.event_name,attribute.actor=assertion.actor"
if quiet gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" --workload-identity-pool="$POOL_ID" --location=global --project "$PROJECT_ID"; then
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER_ID" --workload-identity-pool="$POOL_ID" --location=global --project "$PROJECT_ID" \
    --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION" --quiet >/dev/null
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" --workload-identity-pool="$POOL_ID" --location=global --project "$PROJECT_ID" \
    --display-name="Purrbi repository" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION" --quiet >/dev/null
fi
ok "provider $PROVIDER_ID: only $GITHUB_REPO, branch main, manually started runs"
PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.workflow/deploy-backend"
with_retry gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" --project "$PROJECT_ID" \
  --member="$PRINCIPAL" --role=roles/iam.workloadIdentityUser --quiet
ok "only the deploy-backend workflow can act as $DEPLOYER_SA_ID"

step "Done"
cat <<EOF
   Values for the GitHub workflow (identifiers, not secrets):
     WIF provider:      projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}
     Deploy identity:   ${DEPLOYER_SA}
     Runtime identity:  ${RUNTIME_SA}
     Storage bucket:    ${BUCKET:-not found} ${BUCKET_LOCATION}
     Firestore:         ${DB_LOCATION:-$FIRESTORE_LOCATION}
     OpenAI secret:     ${SECRET_NAME} $($SECRET_OK && echo "(found)" || echo "(NOT FOUND)")
EOF
