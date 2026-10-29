// Read-only checks of the development Firebase project, run in GitHub Actions with the short-lived
// OIDC credentials of the deploy identity (never a key):
//   node gcp-check.mjs preflight   which deploy permissions the identity has (and lacks, by design)
//   node gcp-check.mjs verify      deployed functions, runtime identity, secret binding, Storage bucket, rules, indexes
// Needs GCP_ACCESS_TOKEN (from `gcloud auth print-access-token`). Prints and publishes a report with
// ids, states and hashes only; secret values are never requested.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publish } from './report.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const backendDir = join(here, '..');
const config = JSON.parse(readFileSync(join(backendDir, 'deploy-config.json'), 'utf8'));
const project = process.env.PROJECT_ID || config.projectId;
const region = config.region;
const token = process.env.GCP_ACCESS_TOKEN;
if (!token) throw new Error('GCP_ACCESS_TOKEN is required');

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, error: res.ok ? null : json?.error?.message?.slice(0, 300) ?? `HTTP ${res.status}` };
}

async function testPermissions(url, permissions) {
  const r = await api('POST', url, { permissions });
  const granted = new Set(r.json?.permissions ?? []);
  return { httpStatus: r.status, error: r.error, granted: permissions.filter((p) => granted.has(p)), missing: permissions.filter((p) => !granted.has(p)) };
}

/**
 * The app's Storage bucket (deploy-config.json storageBucket): linked to Firebase, whether Firebase also
 * keeps a "default bucket" record for it (this project has none; deploys name the bucket), and its
 * location when the deploy identity may read it (it may not by design; the owner's setup run reports it).
 */
async function storageInfo() {
  const bucket = config.storageBucket;
  const linked = await api('GET', `https://firebasestorage.googleapis.com/v1beta/projects/${project}/buckets/${encodeURIComponent(bucket)}`);
  const dflt = await api('GET', `https://firebasestorage.googleapis.com/v1alpha/projects/${project}/defaultBucket`);
  const meta = await api('GET', `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}?fields=location,storageClass`);
  const location = meta.json?.location ?? null;
  return {
    bucket,
    linkedToFirebase: linked.status === 200,
    linkHttpStatus: linked.status,
    linkError: linked.error,
    defaultBucketRecord: dflt.status === 200 ? dflt.json?.bucket?.name?.split('/buckets/')[1] ?? null : `none (HTTP ${dflt.status})`,
    location: location ?? `${config.storageLocation} (from deploy-config / the owner's setup run; bucket metadata HTTP ${meta.status} for the deploy identity)`,
    locationMatches: location === null || location.toUpperCase() === (config.storageLocation ?? '').toUpperCase(),
  };
}

async function preflight() {
  const report = { kind: 'preflight', project, at: new Date().toISOString(), identity: config.deployerServiceAccount, checks: {} };
  report.checks.project = await testPermissions(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:testIamPermissions`, [
    'cloudfunctions.functions.create', 'cloudfunctions.functions.update', 'cloudfunctions.functions.delete', 'cloudfunctions.functions.get',
    'cloudfunctions.functions.list', 'cloudfunctions.functions.sourceCodeSet', 'cloudfunctions.operations.get',
    'firebaserules.rulesets.create', 'firebaserules.rulesets.get', 'firebaserules.releases.create', 'firebaserules.releases.update',
    'firebaserules.releases.get', 'firebaserules.releases.list',
    'datastore.indexes.create', 'datastore.indexes.list', 'datastore.indexes.delete', 'datastore.databases.getMetadata',
    'serviceusage.services.get', 'serviceusage.services.list', 'serviceusage.services.use',
    'firebase.projects.get', 'firebasestorage.defaultBucket.get', 'resourcemanager.projects.get',
    // expected to be MISSING (least privilege): changing IAM, enabling APIs, reading data
    'resourcemanager.projects.setIamPolicy', 'serviceusage.services.enable', 'datastore.entities.get', 'storage.objects.get',
  ]);
  const sa = (email) => `https://iam.googleapis.com/v1/projects/${project}/serviceAccounts/${email}:testIamPermissions`;
  report.checks.actAsRuntime = await testPermissions(sa(config.runtimeServiceAccount), ['iam.serviceAccounts.actAs']);
  for (const secret of config.secrets) {
    report.checks[`secret:${secret}`] = await testPermissions(`https://secretmanager.googleapis.com/v1/projects/${project}/secrets/${secret}:testIamPermissions`, [
      'secretmanager.secrets.get', 'secretmanager.secrets.getIamPolicy', 'secretmanager.versions.get', 'secretmanager.versions.access',
    ]);
  }
  report.checks.artifactRepository = await testPermissions(
    `https://artifactregistry.googleapis.com/v1/projects/${project}/locations/${region}/repositories/gcf-artifacts:testIamPermissions`,
    ['artifactregistry.repositories.get'],
  );
  report.storage = await storageInfo();
  const expectMissing = new Set(['resourcemanager.projects.setIamPolicy', 'serviceusage.services.enable', 'datastore.entities.get', 'storage.objects.get', 'secretmanager.versions.access']);
  const unexpected = [];
  const needed = [];
  for (const [name, c] of Object.entries(report.checks)) {
    for (const p of c.granted) if (expectMissing.has(p)) unexpected.push(`${name}: ${p}`);
    for (const p of c.missing) if (!expectMissing.has(p)) needed.push(`${name}: ${p}`);
  }
  const storageIssues = [];
  if (!report.storage.linkedToFirebase) storageIssues.push(`bucket ${config.storageBucket} is not linked to Firebase (HTTP ${report.storage.linkHttpStatus})`);
  if (!report.storage.locationMatches) storageIssues.push(`bucket location ${report.storage.location}, expected ${config.storageLocation}`);
  report.summary = { missingForDeploy: needed, broaderThanIntended: unexpected, storage: storageIssues };
  return report;
}

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const norm = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();

async function rulesCheck(releaseName, file) {
  const local = readFileSync(join(backendDir, file), 'utf8');
  const rel = await api('GET', `https://firebaserules.googleapis.com/v1/projects/${project}/releases/${releaseName}`);
  if (!rel.json?.rulesetName) return { release: releaseName, deployed: false, error: rel.error, localSha: sha(norm(local)) };
  const rs = await api('GET', `https://firebaserules.googleapis.com/v1/${rel.json.rulesetName}`);
  const deployed = (rs.json?.source?.files ?? []).map((f) => f.content).join('\n');
  return {
    release: releaseName,
    deployed: true,
    ruleset: rel.json.rulesetName.split('/').pop(),
    updatedAt: rel.json.updateTime,
    localSha: sha(norm(local)),
    deployedSha: sha(norm(deployed)),
    matchesRepository: norm(deployed) === norm(local),
  };
}

async function verify() {
  const report = { kind: 'verify', project, at: new Date().toISOString(), problems: [] };
  const problem = (p) => report.problems.push(p);

  const dbr = await api('GET', `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)`);
  report.firestore = { locationId: dbr.json?.locationId, type: dbr.json?.type, error: dbr.error };

  const fr = await api('GET', `https://cloudfunctions.googleapis.com/v2/projects/${project}/locations/${region}/functions?pageSize=200`);
  const fns = fr.json?.functions ?? [];
  report.functions = [];
  for (const [id, want] of Object.entries(config.functions)) {
    const f = fns.find((x) => x.name.endsWith(`/functions/${id}`));
    if (!f) {
      problem(`function ${id} is not deployed`);
      report.functions.push({ id, deployed: false });
      continue;
    }
    const secrets = (f.serviceConfig?.secretEnvironmentVariables ?? []).map((s) => `${s.secret}@${s.version}`);
    const row = {
      id,
      deployed: true,
      state: f.state,
      generation: f.environment,
      runtime: f.buildConfig?.runtime,
      serviceAccount: f.serviceConfig?.serviceAccountEmail,
      triggerServiceAccount: f.eventTrigger?.serviceAccountEmail ?? null,
      eventType: f.eventTrigger?.eventType,
      triggerRegion: f.eventTrigger?.triggerRegion ?? null,
      secrets,
      storageBucket: f.serviceConfig?.environmentVariables?.STORAGE_BUCKET ?? null,
      updateTime: f.updateTime,
    };
    report.functions.push(row);
    if (f.state !== 'ACTIVE') problem(`function ${id} state ${f.state}`);
    if (row.storageBucket !== config.storageBucket) problem(`function ${id} STORAGE_BUCKET is ${row.storageBucket ?? 'unset'}, expected ${config.storageBucket}`);
    if (row.serviceAccount !== config.runtimeServiceAccount) problem(`function ${id} runs as ${row.serviceAccount}, expected ${config.runtimeServiceAccount}`);
    if (row.triggerServiceAccount && row.triggerServiceAccount !== config.runtimeServiceAccount) problem(`function ${id} trigger identity ${row.triggerServiceAccount}`);
    const names = secrets.map((s) => s.split('@')[0]).sort();
    if (JSON.stringify(names) !== JSON.stringify([...want.secrets].sort())) problem(`function ${id} secrets ${names.join(',') || 'none'}, expected ${want.secrets.join(',') || 'none'}`);
  }
  report.otherFunctions = fns.map((f) => f.name.split('/').pop()).filter((n) => !(n in config.functions));
  if (fr.error) problem(`could not list functions: ${fr.error}`);

  report.secrets = [];
  for (const secret of config.secrets) {
    const pol = await api('GET', `https://secretmanager.googleapis.com/v1/projects/${project}/secrets/${secret}:getIamPolicy`);
    const accessors = (pol.json?.bindings ?? []).filter((b) => b.role === 'roles/secretmanager.secretAccessor').flatMap((b) => b.members);
    const versions = await api('GET', `https://secretmanager.googleapis.com/v1/projects/${project}/secrets/${secret}/versions?filter=state:ENABLED`);
    const row = { secret, enabledVersions: (versions.json?.versions ?? []).length, accessors, error: pol.error };
    report.secrets.push(row);
    if (!accessors.includes(`serviceAccount:${config.runtimeServiceAccount}`)) problem(`${config.runtimeServiceAccount} cannot access secret ${secret}`);
    const others = accessors.filter((m) => m !== `serviceAccount:${config.runtimeServiceAccount}`);
    if (others.length) report.secretsNote = `Other identities can also read ${secret}: ${others.join(', ')}`;
    if (!row.enabledVersions) problem(`secret ${secret} has no enabled version`);
  }

  report.storage = await storageInfo();
  if (!report.storage.linkedToFirebase) problem(`Storage bucket ${config.storageBucket} is not linked to Firebase (HTTP ${report.storage.linkHttpStatus})`);
  if (!report.storage.locationMatches) problem(`Storage bucket location is ${report.storage.location}, expected ${config.storageLocation}`);

  const bucketRel = await api('GET', `https://firebaserules.googleapis.com/v1/projects/${project}/releases?pageSize=50`);
  const storageReleases = (bucketRel.json?.releases ?? []).map((r) => r.name.split('/releases/')[1]).filter((n) => n?.startsWith('firebase.storage/'));
  report.storageRuleReleases = storageReleases;
  const storageRelease = storageReleases.find((n) => n === `firebase.storage/${config.storageBucket}`);
  report.rules = [await rulesCheck('cloud.firestore', 'firestore.rules')];
  if (storageRelease) report.rules.push(await rulesCheck(storageRelease, 'storage.rules'));
  else problem(`no Storage rules release for ${config.storageBucket} (found: ${storageReleases.join(', ') || 'none'})`);
  for (const r of report.rules) if (!r.matchesRepository) problem(`deployed ${r.release} rules differ from the repository`);

  const want = JSON.parse(readFileSync(join(backendDir, 'firestore.indexes.json'), 'utf8')).indexes ?? [];
  const ir = await api('GET', `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/collectionGroups/-/indexes`);
  const have = (ir.json?.indexes ?? []).map((i) => ({
    collectionGroup: i.name.split('/collectionGroups/')[1]?.split('/')[0],
    fields: (i.fields ?? []).filter((f) => f.fieldPath !== '__name__').map((f) => `${f.fieldPath}:${f.order ?? f.arrayConfig}`),
    state: i.state,
  }));
  report.indexes = want.map((w) => {
    const fields = w.fields.map((f) => `${f.fieldPath}:${f.order ?? f.arrayConfig}`);
    const match = have.find((h) => h.collectionGroup === w.collectionGroup && JSON.stringify(h.fields) === JSON.stringify(fields));
    if (!match) problem(`index ${w.collectionGroup}(${fields.join(', ')}) missing`);
    return { collectionGroup: w.collectionGroup, fields, state: match?.state ?? 'MISSING' };
  });
  report.ok = report.problems.length === 0;
  return report;
}

const mode = process.argv[2];
const report = mode === 'preflight' ? await preflight() : mode === 'verify' ? await verify() : null;
if (!report) {
  console.error('usage: node gcp-check.mjs preflight|verify');
  process.exit(2);
}
console.log(JSON.stringify(report, null, 2));
if (process.env.REPORT_PATH) writeFileSync(process.env.REPORT_PATH, JSON.stringify(report, null, 2));
publish(mode === 'preflight' ? 'Deploy identity permissions' : 'Deployed backend verification', report);
if (mode === 'verify' && !report.ok) process.exit(1);
