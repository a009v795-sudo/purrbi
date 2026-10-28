#!/usr/bin/env bash
# Re-export the FlutterFlow project into app/, build it for web and capture phone screenshots.
# Needs FF_API_KEY in the environment and Flutter on PATH (or FLUTTER_BIN).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLUTTER="${FLUTTER_BIN:-flutter}"
export FLUTTERFLOW_API_TOKEN="${FLUTTERFLOW_API_TOKEN:-${FF_API_KEY:?FF_API_KEY not set}}"
rm -rf "$ROOT/app" && mkdir -p "$ROOT/app"
flutterflow export-code --project purrbi-v2development-38b75z --dest "$ROOT/app" --no-parent-folder --include-assets | tail -1
cd "$ROOT/app"
"$FLUTTER" pub get >/dev/null
"$FLUTTER" build web --release --no-tree-shake-icons --no-web-resources-cdn | tail -1
if [ "${SKIP_SCREENS:-0}" != "1" ]; then node "$ROOT/tools/web-screens.cjs" "$ROOT/docs/screens"; fi
