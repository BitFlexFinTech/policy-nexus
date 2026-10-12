#!/usr/bin/env python3
"""Upload a project's documents into a clearly-labelled SUBFOLDER on Google Drive.

WHY THIS EXISTS
---------------
The documents are written to the project folder on this computer. Putting them on
Google Drive is a separate step, and Nzwisiso had no uploader at all. This one
script does the whole job for any project:

  1. authenticate as the OWNER'S OWN Google account (gcloud refreshes it
     silently — no browser, no link, no 7-day expiry), because a service account
     has no storage quota of its own and cannot create new files;
  2. find-or-create ONE clearly-labelled subfolder inside the project's Drive
     folder (never a duplicate — the id is pinned so a second run reuses it);
  3. upload each named document into that subfolder, replacing any same-named
     file there so a re-run never stacks up copies;
  4. list the subfolder back, so "it is on Drive" is PROVED, not asserted.

USAGE
-----
  python3 scripts/drive-upload.py \
      --parent <PROJECT_DRIVE_FOLDER_ID> \
      --folder "Technical, Cost & Appraisal — Oct 2026" \
      --conf-dir ~/.config/nzwisiso \
      <file1> <file2> ...
"""
import argparse
import json
import mimetypes
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

SCOPES = ["https://www.googleapis.com/auth/drive"]
API = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"


def gcloud_token():
    """Permanent source: gcloud refreshes this silently, no browser needed.

    No google-auth library is required for this path, which is the default.
    """
    out = subprocess.run(
        ["gcloud", "auth", "print-access-token"],
        capture_output=True, text=True, timeout=90)
    if out.returncode != 0:
        raise RuntimeError((out.stderr or "").strip()[:200])
    tok = out.stdout.strip()
    if not tok:
        raise RuntimeError("gcloud returned an empty token")
    return tok


def owner_token(conf_dir):
    """The owner's own account, from a stored refresh token (silent), if present."""
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials as UserCredentials
    oauth_file = os.path.join(conf_dir, "drive-oauth.json")
    creds = UserCredentials.from_authorized_user_file(oauth_file, SCOPES)
    if not creds.valid:
        creds.refresh(Request())
    return creds.token


def service_account_token(conf_dir):
    """The project's own service account, if a key file is present."""
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    sa_file = os.path.join(conf_dir, "drive-service-account.json")
    creds = service_account.Credentials.from_service_account_file(sa_file, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token


def token(conf_dir):
    """gcloud first (permanent, silent) -> owner token file -> service account."""
    last = None
    for which, fn in (("gcloud", lambda: gcloud_token()),
                      ("owner", lambda: owner_token(conf_dir)),
                      ("service-account", lambda: service_account_token(conf_dir))):
        try:
            tok = fn()
            print(f"authenticated via {which}")
            return tok
        except Exception as exc:  # noqa: BLE001 - report and try the next route
            last = f"{which}: {exc}"
    raise RuntimeError("no Google credential worked — " + str(last))


def call(url, tok, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={"Authorization": "Bearer " + tok,
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, {"raw": e.read().decode(errors="replace")[:500]}


def find_folder(tok, name, parent):
    esc = name.replace("\\", "\\\\").replace("'", "\\'")
    q = ("mimeType='application/vnd.google-apps.folder' and name='%s' and "
         "'%s' in parents and trashed=false" % (esc, parent))
    st, res = call(API + "/files?q=" + urllib.parse.quote(q) + "&fields=files(id,name)", tok)
    if st != 200:
        return None
    files = res.get("files", [])
    return files[0]["id"] if files else False


def create_folder(tok, name, parent):
    return call(API + "/files", tok, method="POST",
                body={"name": name, "mimeType": "application/vnd.google-apps.folder",
                      "parents": [parent]})


def ensure_folder(tok, name, parent, conf_dir):
    """Return the id of THE subfolder for `name`, creating it once.

    A pinned id file means a second run reuses the same folder, so the Drive
    folder can never fill with duplicates.
    """
    os.makedirs(conf_dir, exist_ok=True)
    pin = os.path.join(conf_dir, "drive-subfolder-" + _slug(name) + ".json")
    if os.path.exists(pin):
        with open(pin) as fh:
            pinned = json.load(fh).get("id")
        st, res = call(API + "/files/" + pinned + "?fields=id,name,trashed", tok)
        if st == 200 and not res.get("trashed"):
            print(f"subfolder reused (pinned): {res.get('name')}  id={pinned}")
            return pinned
    found = find_folder(tok, name, parent)
    if found:
        print(f"subfolder found: {name}  id={found}")
        _pin(pin, found, name)
        return found
    st, res = create_folder(tok, name, parent)
    if st == 200:
        print(f"subfolder created: {name}  id={res['id']}")
        _pin(pin, res["id"], name)
        return res["id"]
    raise RuntimeError(f"could not create the subfolder: {st} {res}")


def _pin(path, folder_id, name):
    with open(path, "w") as fh:
        json.dump({"id": folder_id, "name": name}, fh, indent=2)
    os.chmod(path, 0o600)


def _slug(name):
    return "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-")


def find_files(tok, folder_id, name):
    esc = name.replace("\\", "\\\\").replace("'", "\\'")
    q = "'%s' in parents and name = '%s' and trashed=false" % (folder_id, esc)
    st, res = call(API + "/files?q=" + urllib.parse.quote(q) + "&fields=files(id,name)&pageSize=100", tok)
    if st != 200:
        return None
    return [f["id"] for f in res.get("files", [])]


def delete_file(tok, file_id):
    st, _ = call(API + "/files/" + file_id, tok, method="DELETE")
    return st


def upload_file(tok, local_path, folder_id, name=None, replace=True):
    """Upload one file, replacing any same-named file already in the folder."""
    name = name or os.path.basename(local_path)
    if replace:
        existing = find_files(tok, folder_id, name)
        if existing is None:
            return 500, {"raw": "could not check for an existing file of this name"}
        for fid in existing:
            delete_file(tok, fid)
    ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
    meta = {"name": name, "parents": [folder_id]}
    boundary = "nzwisiso-boundary-7f3a"
    with open(local_path, "rb") as fh:
        payload = fh.read()
    parts = [("--" + boundary + "\r\n").encode(),
             b"Content-Type: application/json; charset=UTF-8\r\n\r\n",
             json.dumps(meta).encode() + b"\r\n",
             ("--" + boundary + "\r\n").encode(),
             ("Content-Type: " + ctype + "\r\n\r\n").encode(),
             payload + b"\r\n",
             ("--" + boundary + "--").encode()]
    body = b"".join(parts)
    req = urllib.request.Request(
        UPLOAD + "?uploadType=multipart&fields=id,name,webViewLink,size",
        data=body, method="POST",
        headers={"Authorization": "Bearer " + tok,
                 "Content-Type": "multipart/related; boundary=" + boundary})
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {"raw": e.read().decode(errors="replace")[:500]}


def list_folder(tok, folder_id):
    q = "'%s' in parents and trashed=false" % folder_id
    st, res = call(API + "/files?q=" + urllib.parse.quote(q)
                   + "&fields=files(id,name,mimeType,size)&pageSize=200", tok)
    return st, res.get("files", [])


def main():
    ap = argparse.ArgumentParser(description="Upload documents into a labelled Drive subfolder.")
    ap.add_argument("--parent", required=True, help="the project's Drive folder id")
    ap.add_argument("--folder", required=True, help="the subfolder's name")
    ap.add_argument("--conf-dir", default=os.path.expanduser("~/.config/nzwisiso"))
    ap.add_argument("files", nargs="+")
    args = ap.parse_args()

    tok = token(args.conf_dir)
    sub = ensure_folder(tok, args.folder, args.parent, args.conf_dir)

    uploaded, failed = [], []
    for path in args.files:
        if not os.path.exists(path):
            failed.append((os.path.basename(path), "local file missing"))
            print(f"FAIL  {os.path.basename(path)} — local file missing")
            continue
        st, res = upload_file(tok, path, sub)
        if st == 200:
            uploaded.append((res["name"], res.get("size"), res.get("webViewLink")))
            print(f"UP    {res['name']}  {res.get('size')} bytes")
        else:
            failed.append((os.path.basename(path), str(res)[:160]))
            print(f"FAIL  {os.path.basename(path)} — {str(res)[:160]}")

    print("\n--- what the subfolder NOW holds (read back from Drive) ---")
    st, files = list_folder(tok, sub)
    for f in files:
        print(f"  {f['name']}  ({f.get('size','?')} bytes)")
    print(f"\nsubfolder id: {sub}")
    print(f"uploaded: {len(uploaded)}   failed: {len(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())


