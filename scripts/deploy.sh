#!/usr/bin/env bash
#
# PUBLISH THE BUILT SITE to the demo host over FTPS. (Plain English: this copies the built
# website up to the web server where the demo lives.)
#
# TWO THINGS THAT MUST NOT CHANGE — both have already gone wrong once:
#
#   1. THE TARGET IS `/`. Inside the FTP account, `/` IS the web root: the folder the website is
#      served from. NEVER use the FTP_REMOTE_ROOT value in `.env` as the target — that is a path on
#      the server's OWN DISK (here: /home/bitfempm/nzwisiso.bitflex.app) and, used as an FTP target,
#      it resolves INSIDE the FTP root and quietly creates a second copy of the whole site at
#      `home/bitfempm/...` inside the web root, while the real site stays exactly as it was. That
#      happened on 2026-10-07 and wasted a full upload.
#   2. NO `--delete`. The web root also holds files this build does not produce — the SSL validation
#      token under `.well-known/` and the `cgi-bin/` folder. `--delete` would remove them.
#
# After it finishes, PROVE the publish with:  npm run sync:check

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env file — it holds the FTP host, user and password. Nothing was uploaded." >&2
  exit 1
fi

if [ ! -d dist ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
  echo "dist/ is missing or empty — run 'npm run build' first. Nothing was uploaded." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [ -z "${FTP_HOST:-}" ] || [ -z "${FTP_USER:-}" ] || [ -z "${FTP_PASS:-}" ]; then
  echo "FTP_HOST, FTP_USER and FTP_PASS must all be set in .env. Nothing was uploaded." >&2
  exit 1
fi

echo "Publishing $(pwd)/dist to the web root of ${FTP_HOST} (target '/', no --delete)..."

LFTP_PASSWORD="$FTP_PASS" lftp --env-password -u "$FTP_USER" "ftp://$FTP_HOST" \
  -e "set ftp:ssl-force yes; set ftp:ssl-protect-data yes; set ssl:verify-certificate no; \
      mirror -R --only-newer --verbose '$(pwd)/dist' /; quit"

echo "Upload finished. Now run:  npm run sync:check"
