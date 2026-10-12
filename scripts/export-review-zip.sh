#!/usr/bin/env bash
# Export the one review zip for this project.
#
# WHY THIS EXISTS
# ---------------
# The review zip is built by hand otherwise, and a hand-built `zip -r .` swept in
# `.corpus-cache/` — the 216 MB of downloaded PDFs used to build the document library —
# and produced a 220 MB archive where 10 MB was wanted. This script carries the correct
# exclusion list, so that cannot happen again.
#
# It also keeps to the owner's rule: ONE zip, always the same name, inside the project,
# overwritten in place — never a numbered copy, never a second file.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# The project's own name, from package.json — never hardcoded here.
NAME="$(node -e 'process.stdout.write(require("./package.json").name)')"
OUT_DIR="$ROOT/Review Zip"
ZIP="$OUT_DIR/$NAME-review.zip"

mkdir -p "$OUT_DIR"

# Build at a temporary path first, so a run that fails halfway cannot leave a broken zip
# in place of a good one.
TMP="$OUT_DIR/.$NAME-review.tmp.zip"
rm -f "$TMP" "$ZIP"

# Delete any older numbered zips left by the previous rule, so the folder holds ONE zip.
rm -f "$OUT_DIR/$NAME-review-"[0-9]*.zip

zip -rq "$TMP" . \
  -x 'node_modules/*' \
  -x '.git/*' \
  -x 'dist/*' \
  -x 'dist-e2e/*' \
  -x 'dist-ssr/*' \
  -x 'playwright-report/*' \
  -x 'test-results/*' \
  -x '.corpus-cache/*' \
  -x '.env*' \
  -x 'Review Zip/*' \
  -x '*.zip' \
  -x '*.tsbuildinfo' \
  -x '.DS_Store'

# Prove no secret is inside before the zip replaces the good one.
if unzip -Z1 "$TMP" | grep -E '^\.env' | grep -v '^\.env\.example$'; then
  rm -f "$TMP"
  echo "REFUSED: a .env file was inside the archive, so it was not published." >&2
  exit 1
fi

mv "$TMP" "$ZIP"
echo "Wrote $ZIP"
ls -la "$OUT_DIR"
