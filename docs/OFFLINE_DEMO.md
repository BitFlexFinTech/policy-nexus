# Running the demonstration with no network — one page

This sheet makes the pitch deck's promise true on the day it is made:

> *"If the network is unavailable: the demonstration does not need it. The platform makes no network
> request, so it runs from the local build exactly as it does online."*

Nothing here needs the internet. The site is a set of ordinary files that a laptop can serve to itself.

---

## The one-line version

Copy the built site folder (`dist/`) onto the demonstration laptop, start a small web server **on that
laptop** to serve that folder, and open the local address in a browser. Everything stays on the machine.

---

## What you need

- **The built site** — the `dist/` folder. It already exists in this project; it is produced by
  `npm run build`.
- **A way to serve a folder on a local address** — two options in Step 3; neither uses the internet.

---

## Step 1 — build it once (on a computer that has this project)

```bash
npm install
npm run build
```

This writes the `dist/` folder. That folder **is the whole site**: the page, one JavaScript file, one
style file, the two self-hosted fonts and the Coat of Arms. Nothing else is required to run it.

## Step 2 — copy it to the demonstration laptop

Copy the entire `dist/` folder onto the laptop (a USB stick or a shared folder is fine). For the site
itself, that folder is all you need.

## Step 3 — serve it on the laptop (choose ONE)

A web browser will not run the site straight from a file (an address beginning `file://`), so a small
**local server** — a program that hands the files to the browser over a local address — is used instead.
No internet is involved: the server and the browser are on the same machine.

**Option A — Python 3 (nothing to install on macOS or Linux).**
Open a terminal **inside the `dist` folder** and run:

```bash
cd dist
python3 -m http.server 8080
```

Then open **http://localhost:8080/** in the browser.

**Option B — the project's own preview (only if the whole project, including `node_modules`, is on the
laptop).** From the project root run:

```bash
npm run preview
```

Then open the address it prints (usually **http://localhost:4173/**).

## Step 4 — prove it is offline (do this once, in front of the room or before)

1. Turn the laptop's Wi-Fi **off** (or unplug the network cable).
2. Reload the page. It loads exactly as before.
3. Run the whole journey: choose a department → paste or upload a policy → **Run Simulation** → read the
   assessment → export.

## What to expect

The site behaves identically with the network off. It makes **no network request at all** — no external
AI service is called, no third-party script is loaded, no font is fetched from the internet (the fonts
ship inside the site), and no document text leaves the machine. That is what makes it sovereign in
operation.

## One small thing to know

The site is a **single-page app** (one page that changes what it shows as you move around). Open it at its
**root address** and move around inside it. With Option A (a plain file server), pressing refresh while on
a deeper address such as `/app/policies` may show a "404 — not found" page; simply return to the root
address. Option B (`npm run preview`) handles this automatically.

## Before-the-meeting checklist

- [ ] `dist/` copied to the demonstration laptop.
- [ ] Local server started; the root address opens the site.
- [ ] Wi-Fi turned **off**; the page still loads.
- [ ] One full journey run end to end (department → policy → run → assessment → export).
- [ ] The live date shown on screen is the correct day.

---

*Related: the platform's own rule that it makes no runtime network request is enforced by
`src/test/network.test.ts` and `scripts/validate.mjs`; this sheet is the human procedure that puts the
built site on a laptop with the network off.*