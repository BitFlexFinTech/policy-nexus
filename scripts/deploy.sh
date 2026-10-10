#!/usr/bin/env bash
#
# PUBLISH THE BUILT SITE to the demo host over FTPS. (Plain English: this copies the built
# website up to the web server where the demo lives.)
#
# TWO RULES THAT MUST NOT CHANGE — both have already gone wrong once:
#
#   1. THE TARGET IS `/`. Inside the FTP account, `/` IS the web root: the folder the website is
#      served from. NEVER use the FTP_REMOTE_ROOT value in `.env` as the target — that is a path on
#      the server's OWN DISK (here: /home/bitfempm/nzwisiso.bitflex.app) and, used as an FTP target,
#      it resolves INSIDE the FTP root and quietly creates a second copy of the whole site at
#      `home/bitfempm/...` inside the web root, while the real site stays exactly as it was. That
#      happened on 2026-10-07 and wasted a full upload.
#   2. WE NEVER DELETE ANYTHING WE DID NOT PUT THERE. The web root also holds files this build does
#      not produce — the SSL validation token under `.well-known/` and the `cgi-bin/` folder — so a
#      blanket delete is forbidden. The only deletion this script does is the "stale bundles" step
#      at the end, and that can only ever remove `assets/index-<hash>.js` / `.css` files that the
#      site's own `index.html` no longer names.
#
# WHY THIS USES `curl` AND NOT `lftp` (changed 2026-10-10). The previous version mirrored with
# `lftp`, and on this host that hung: it would sit asleep with only the control connection open and
# never finish. Two other faults cost a whole session on 2026-10-10:
#   * THE HOST TRUNCATES A FAST UPLOAD. A 73 KB file landed on the server as 16 KB, and a 24 KB PNG
#     as 8 KB, with no error. Slowing the transfer right down (`--limit-rate`, default 2 kB/s) makes
#     the same files arrive whole. `DEPLOY_RATE` overrides the speed if a faster one is ever safe.
#   * NOTHING WAS EVER DELETED, SO THE ACCOUNT FILLED UP. `mirror --only-newer` never removes, so
#     every past build's `assets/index-….js` stayed forever; after ~84 of them the account had no
#     room left and the server began refusing writes with FTP error 451. The prune step at the end
#     keeps that from happening again.
# Each file is proved after it lands (same size, and the same fingerprint for small files), and a
# part-written file is finished off with `curl -C -` (resume) rather than started again.
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

RATE="${DEPLOY_RATE:-2k}"

# Connect by the address rather than the name: the name resolves, but resolution proved flaky under
# load on 2026-10-10, and the IP sidesteps that. The login (user@domain) still identifies the account,
# so which of the two we dial makes no difference to what gets published.
HOST_IP="$(dig +short "$FTP_HOST" 2>/dev/null | head -1 || true)"
BASE="ftp://${HOST_IP:-$FTP_HOST}"
C=(curl -sS -k --ssl-reqd --ftp-pasv --limit-rate "$RATE" -u "$FTP_USER:$FTP_PASS")

remote_size() {
  "${C[@]}" -m 60 -I "$BASE/$1" 2>/dev/null | tr -d '\r' \
    | awk 'tolower($1)=="content-length:"{print $2}' | tail -1
}

echo "Publishing $(pwd)/dist to the web root of ${FTP_HOST} (target '/', no --delete)…"

FAILED=0
# Upload every built file that is not already there in full. Small files are checked by fingerprint
# (a rebuilt index.html can have the same size but different content); large ones by size.
while IFS= read -r rel; do
  want=$(wc -c < "dist/$rel" | tr -d ' ')
  if [ "$want" -lt 65536 ]; then
    local_sha=$(shasum -a 256 "dist/$rel" | awk '{print $1}')
  else
    local_sha=""
  fi
  done_it=0
  for t in 1 2 3 4 5; do
    if [ -n "$local_sha" ]; then
      have=$(remote_size "$rel")
      if [ "$have" = "$want" ]; then
        tmp=$(mktemp); "${C[@]}" -m 120 -o "$tmp" "$BASE/$rel" >/dev/null 2>&1 || true
        [ "$(shasum -a 256 "$tmp" | awk '{print $1}')" = "$local_sha" ] && { rm -f "$tmp"; done_it=1; break; }
        rm -f "$tmp"
      fi
    else
      [ "$(remote_size "$rel")" = "$want" ] && { done_it=1; break; }
    fi
    RESUME=()
    [ "$t" -gt 1 ] && RESUME=(-C -)
    echo "  uploading $rel ($want B)…"
    "${C[@]}" -m 2400 "${RESUME[@]}" -T "dist/$rel" "$BASE/$rel" >/dev/null 2>&1 || true
    sleep 3
  done
  [ "$done_it" = 1 ] || { echo "  !! FAILED to publish $rel"; FAILED=1; }
done < <(cd dist && find . -type f | sed 's|^\./||' | sort)

# Keep the account from silently filling up: remove old bundle files that the site's own index.html
# no longer names. These are files WE put there in an earlier deploy, and nothing references them.
echo "Checking for old bundle files to remove…"
# The names come out of `grep -o` ALREADY prefixed with "assets/" (e.g. "assets/index-AbC.js"), so
# they go into the keep list exactly as they are. Adding another "assets/" in front is a mistake that
# was actually made on 2026-10-10: the list came out as "assets/assets/…", nothing matched, and this
# step deleted the live bundles — the site broke until they were put back. Do not "tidy" this line.
refs=$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.(js|css)' dist/index.html | wc -l | tr -d ' ')
keep=" "
while IFS= read -r n; do keep="${keep}$n "; done < <(grep -oE 'assets/index-[A-Za-z0-9_-]+\.(js|css)' dist/index.html)
if [ "$refs" -eq 0 ]; then
  # Safety catch: if we cannot read which files the site needs, delete NOTHING.
  echo "  (prune skipped: no bundle name could be read from dist/index.html — deleting nothing)"
else
  listing=""
  for a in 1 2 3 4 5; do
    listing=$("${C[@]}" -m 90 "$BASE/assets/" 2>/dev/null || true)
    [ -n "$listing" ] && break
    sleep 3
  done
  removed=0
  while IFS= read -r name; do
    [ -z "$name" ] && continue
    case "$keep" in *" assets/$name "*) continue ;; esac
    "${C[@]}" -m 60 "$BASE/" -Q "DELE assets/$name" >/dev/null 2>&1 || true
    removed=$((removed + 1))
  done < <(printf '%s\n' "$listing" | grep -oE 'index-[A-Za-z0-9_-]+\.(js|css)$')
  echo "  removed $removed old bundle file(s)"
fi

if [ "$FAILED" = 1 ]; then
  echo "Some files did not publish — run 'npm run deploy' again (it resumes)." >&2
  exit 1
fi

echo "Upload finished. Now run:  npm run sync:check"
