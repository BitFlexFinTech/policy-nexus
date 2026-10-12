#!/usr/bin/env python3
"""Build the Minister-facing documents from their markdown, and check them.

WHY THIS EXISTS
---------------
The markdown files in `Minister Submission/` are the single source of truth for what the
Ministry is sent. The Word files and the pitch deck are GENERATED from them, so the two can
never drift: a figure amended in the markdown reaches the Word file only by regenerating it,
and this script fails if a generated file no longer matches its markdown.

Five things are checked, and every one of them can fail:

  1. NO `$` IS LEFT UNESCAPED. Pandoc reads `$...$` as arithmetic, so the line
     `appraised at US$20 million and signed at US$10 million` reached the Word file the
     Ministry receives as `appraised at US20million**andsignedat**US10 million` — the
     currency symbol eaten and the bold markers printed as literal text. Writing it
     `US\\$20 million` is the fix; this check is what stops it coming back.

  2. NO CLAUSE NUMBER APPEARS TWICE. The proposal carried two clauses numbered 4.9 and
     two numbered 4.10.

  3. THE EXECUTIVE JUSTIFICATION SUMMARY IS GENUINELY ONE PRINTED PAGE — measured by
     converting the Word file to a PDF and counting the pages, never assumed.

  4. EVERY DECK SLIDE CARRIES A TITLE. Pandoc puts a table and other text on one slide only
     when the text comes first; with the table first it silently splits the section into a
     second slide that has no title at all.

  5. NO `:::` REACHES A SLIDE. The deck's speaker notes are written as `::: notes` blocks.
     With a reader that does not understand them, pandoc prints the marker itself onto the
     slide instead of into the notes — which is how a deck can look right and be wrong.

USAGE
-----
  python3 scripts/build-minister-docs.py            # build every document
  python3 scripts/build-minister-docs.py --check    # build to a temp folder and compare
  python3 scripts/build-minister-docs.py --only <stem>
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBMISSION = ROOT / "Minister Submission"

# The Word documents this script owns. `one_page` marks the document that must fit a single
# printed page, which is why it alone is built against a tightened reference document.
DOCUMENTS = (
    ("Oreida_Proposal_Minister_of_ICT", False),
    ("Oreida_Executive_Justification_Summary_Minister_of_ICT", True),
    ("Oreida_Service_Agreement_Minister_of_ICT", False),
)

# The pitch deck is a PowerPoint file, and it needs a different reader from the Word files:
# its speaker notes are `::: notes` blocks (a fenced div, which only pandoc's own `markdown`
# understands) and it uses typographic quotes, which `markdown` also produces. Both facts were
# read off the committed deck — regenerating with the Word files' reader printed the `:::`
# markers onto the slides and straightened every quote.
DECK = ("Oreida_Pitch_Deck_Minister_of_ICT", "markdown")

# A clause number at the start of a line, e.g. "4.9 " in "4.9 **The simulation ...**".
CLAUSE = re.compile(r"^(\d+\.\d+)\s", re.M)
# A dollar sign that is not already escaped.
UNESCAPED_DOLLAR = re.compile(r"(?<!\\)\$")
# The Summary must still carry every element item 18 of the plan names.
SUMMARY_MUST_CONTAIN = (
    "Digitalize Zimbabwe",
    "Vision 2030",
    "NDS2 (2026\u20132030)",
    "National AI Strategy",
    "Nzwisiso AI\u2122 Policy Simulation Assistant",
    "ZEPARI Research Assistant\u2122",
    "ZEPARI",
    "2,800,000",
    "72,000",
    "ICR00005623",
    "Electronic Government Procurement",
    "Modelled",
    "Named-source statement",
)

SOFFICE_CANDIDATES = (
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    shutil.which("soffice"),
    "/usr/bin/soffice",
)


def fail(message):
    """Print a failure and stop. Never continue past a failed check."""
    print(f"FAIL  {message}")
    sys.exit(1)


def ok(message):
    print(f"PASS  {message}")


def soffice():
    for candidate in SOFFICE_CANDIDATES:
        if candidate and os.path.exists(candidate):
            return candidate
    # Fail loudly: a page count that could not be measured must never read as a pass.
    fail(
        "LibreOffice (soffice) was not found, so the Executive Justification Summary's "
        "one-page requirement could not be measured. Install LibreOffice, or the "
        "one-page claim is unverified."
    )


def visible_text(docx_path):
    """The text a reader sees in a .docx, one line per Word paragraph."""
    with zipfile.ZipFile(docx_path) as archive:
        xml = archive.read("word/document.xml").decode("utf8")
    return re.sub(r"<[^>]+>", "", re.sub(r"</w:p>", "\n", xml))


def pptx_slides(path):
    """Each slide of a .pptx as (title_text, body_text, speaker_notes).

    The title TEXT is returned, not just whether a title exists: a comparison that only
    asked "is there a title?" could not see a slide whose title had been reworded, which is
    exactly the drift this script exists to catch.
    """
    from pptx import Presentation

    out = []
    for slide in Presentation(str(path)).slides:
        title = "\n".join(
            shape.text_frame.text
            for shape in slide.shapes
            if shape.has_text_frame and shape.name.startswith("Title")
        )
        body = "\n".join(
            shape.text_frame.text
            for shape in slide.shapes
            if shape.has_text_frame and not shape.name.startswith("Title")
        )
        notes = slide.notes_slide.notes_text_frame.text if slide.has_notes_slide else ""
        out.append((title.strip(), body, notes))
    return out


def page_count(docx_path, workdir):
    """Printed pages in a .docx, measured by converting it to PDF and counting."""
    subprocess.run(
        [
            soffice(),
            "--headless",
            f"-env:UserInstallation=file://{workdir}/profile",
            "--convert-to",
            "pdf",
            "--outdir",
            str(workdir),
            str(docx_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    pdf = workdir / (docx_path.stem + ".pdf")
    if not pdf.exists():
        fail(f"could not convert {docx_path.name} to a PDF, so its page count is unknown")
    import pypdf

    with open(pdf, "rb") as handle:
        return len(pypdf.PdfReader(handle).pages)


# ---------------------------------------------------------------------------
# The one-page layout
# ---------------------------------------------------------------------------
# The Executive Justification Summary must fit ONE printed page, so it is built against a
# reference document whose page margins and text sizes are tightened — the same technique,
# and the same measurements, as GovComms' own one-page summary. The other two documents
# keep pandoc's default look, which is the look they already had; nothing about them is
# restyled.
def tightened_reference(path):
    """Write a pandoc reference document tightened to fit one A4 page."""
    from docx import Document
    from docx.shared import Cm, Pt

    with open(path, "wb") as handle:
        subprocess.run(
            ["pandoc", "--print-default-data-file", "reference.docx"],
            check=True,
            stdout=handle,
        )
    doc = Document(str(path))
    for section in doc.sections:
        section.top_margin = Cm(1.3)
        section.bottom_margin = Cm(1.2)
        section.left_margin = Cm(1.5)
        section.right_margin = Cm(1.5)

    def set_style(name, size=None, before=None, after=None):
        try:
            style = doc.styles[name]
        except KeyError:
            return
        if size is not None:
            style.font.size = Pt(size)
        fmt = style.paragraph_format
        if before is not None:
            fmt.space_before = Pt(before)
        if after is not None:
            fmt.space_after = Pt(after)

    set_style("Normal", size=8.5)
    set_style("Body Text", before=0, after=3)
    set_style("First Paragraph", before=0, after=3)
    set_style("Compact", before=0.5, after=0.5)
    set_style("Heading 1", size=16, before=0, after=4)
    set_style("Heading 2", size=10, before=6, after=2)
    set_style("Heading 3", size=9, before=4, after=2)
    set_style("Table", size=7.5)
    doc.save(str(path))


def build_one(stem, one_page, outdir, reference):
    """Generate one Word document from its markdown, using the same reader everywhere."""
    markdown = SUBMISSION / f"{stem}.md"
    target = outdir / f"{stem}.docx"
    command = ["pandoc", "-f", "gfm"]
    if one_page:
        command.append(f"--reference-doc={reference}")
    command += [str(markdown), "-o", str(target)]
    subprocess.run(command, check=True)
    return target



# ---------------------------------------------------------------------------
# The checks
# ---------------------------------------------------------------------------
def check_dollars(stem):
    """Every `$` must be escaped, or pandoc turns the figures into arithmetic."""
    markdown = (SUBMISSION / f"{stem}.md").read_text(encoding="utf8")
    hits = UNESCAPED_DOLLAR.findall(markdown)
    if hits:
        lines = [
            f"    line {number}: {line.strip()[:120]}"
            for number, line in enumerate(markdown.split("\n"), start=1)
            if UNESCAPED_DOLLAR.search(line)
        ]
        fail(
            f"{stem}.md has {len(hits)} unescaped `$`. Pandoc reads `$...$` as "
            f"arithmetic and eats the currency symbol.\n" + "\n".join(lines)
        )
    ok(f"{stem}.md — every `$` is escaped, so no figure can be eaten as arithmetic")


def check_no_registered_mark(stem, extra_text=""):
    """Nothing may carry the registered mark — the registration has not issued.

    `src/config/brand.ts` says this in its own comment: the symbol is "™" today, because "®"
    would assert a registration that does not exist, which is a false legal statement. The
    same rule has to hold in the documents the Ministry is sent, and this is the check that
    holds it. Found here while correcting a false claim in the project's own record that the
    pitch deck's file contained a "®" — measured: no part of it did, and none does now.
    """
    text = (SUBMISSION / f"{stem}.md").read_text(encoding="utf8") + extra_text
    if "\u00ae" in text:
        fail(
            f"{stem} carries a registered mark (\u00ae). The registration has not issued, so "
            f"the symbol asserts something untrue."
        )
    ok(f"{stem} — no registered mark, as `src/config/brand.ts` requires")


def check_clause_numbers(stem):
    """No clause number may appear twice in one document."""
    markdown = (SUBMISSION / f"{stem}.md").read_text(encoding="utf8")
    seen = {}
    for number in CLAUSE.findall(markdown):
        seen[number] = seen.get(number, 0) + 1
    duplicates = sorted(number for number, count in seen.items() if count > 1)
    if duplicates:
        fail(f"{stem}.md numbers these clauses twice: {', '.join(duplicates)}")
    ok(f"{stem}.md — {len(seen)} clause numbers, none repeated")


def check_summary_content(stem):
    """The Summary must still carry every element the plan requires of it."""
    markdown = (SUBMISSION / f"{stem}.md").read_text(encoding="utf8")
    missing = [marker for marker in SUMMARY_MUST_CONTAIN if marker not in markdown]
    if missing:
        fail(f"{stem}.md no longer states: {', '.join(missing)}")
    ok(f"{stem}.md — carries all {len(SUMMARY_MUST_CONTAIN)} required elements")


def check_dollars_survived(stem, generated):
    """Every `$` in the markdown must reach the Word file — this catches the maths defect."""
    markdown = (SUBMISSION / f"{stem}.md").read_text(encoding="utf8")
    wanted = markdown.count("\\$")
    got = visible_text(generated).count("$")
    if wanted != got:
        fail(
            f"{stem}.docx carries {got} `$` where {stem}.md has {wanted} — a figure "
            f"has been eaten as arithmetic"
        )
    ok(f"{stem}.docx — all {got} `$` survived into the Word file")


def check_one_page(stem, generated, workdir):
    """The Summary must genuinely be one printed page."""
    pages = page_count(generated, workdir)
    if pages != 1:
        fail(f"{stem}.docx prints on {pages} pages — it must be one page")
    ok(f"{stem}.docx — measured at 1 printed page")


def check_generated_matches_source(stem, generated):
    """The committed Word file must say exactly what its markdown says."""
    committed = SUBMISSION / f"{stem}.docx"
    if not committed.exists():
        fail(f"{stem}.docx is missing — the markdown has not been turned into a Word file")
    if visible_text(committed) != visible_text(generated):
        fail(
            f"{stem}.docx no longer matches {stem}.md — regenerate it with "
            f"`python3 scripts/build-minister-docs.py`"
        )
    ok(f"{stem}.docx — says exactly what {stem}.md says")


# ---------------------------------------------------------------------------
# The deck
# ---------------------------------------------------------------------------
def build_deck(stem, reader, outdir):
    """Generate the pitch deck from its markdown."""
    target = outdir / f"{stem}.pptx"
    subprocess.run(
        ["pandoc", "-f", reader, str(SUBMISSION / f"{stem}.md"), "-o", str(target)],
        check=True,
    )
    return target


def check_every_slide_has_a_title(stem, generated):
    """No slide may go out without a title — pandoc splits a table section silently."""
    slides = pptx_slides(generated)
    untitled = [number for number, (title, _, _) in enumerate(slides, start=1) if not title]
    if untitled:
        fail(
            f"{stem}.pptx has {len(untitled)} slide(s) with no title: {untitled}. Pandoc "
            f"puts a table and other text on one slide only when the TEXT comes first."
        )
    ok(f"{stem}.pptx — {len(slides)} slides, every one carrying a title")


def check_no_fenced_div_reached_a_slide(stem, generated):
    """The `::: notes` markers must become speaker notes, never slide text."""
    slides = pptx_slides(generated)
    leaked = [
        number
        for number, (_, body, _) in enumerate(slides, start=1)
        if ":::" in body
    ]
    if leaked:
        fail(
            f"{stem}.pptx prints the `:::` marker onto slide(s) {leaked} — the reader used "
            f"does not understand fenced divs, so the speaker notes went onto the slide"
        )
    noted = sum(1 for _, _, notes in slides if notes.strip())
    ok(f"{stem}.pptx — no `:::` marker on any slide; {noted} slides carry speaker notes")


def check_dollars_survived_deck(stem, generated):
    """Every `$` in the markdown must reach the deck — this catches the maths defect."""
    markdown = (SUBMISSION / f"{stem}.md").read_text(encoding="utf8")
    wanted = markdown.count("\\$")
    got = sum(
        part.count("$")
        for title, body, notes in pptx_slides(generated)
        for part in (title, body, notes)
    )
    if wanted != got:
        fail(
            f"{stem}.pptx carries {got} `$` where {stem}.md has {wanted} — a figure has "
            f"been eaten as arithmetic"
        )
    ok(f"{stem}.pptx — all {got} `$` survived into the deck")


def check_deck_matches_source(stem, generated):
    """The committed deck must say exactly what its markdown says."""
    committed = SUBMISSION / f"{stem}.pptx"
    if not committed.exists():
        fail(f"{stem}.pptx is missing — the markdown has not been turned into a deck")
    if pptx_slides(committed) != pptx_slides(generated):
        fail(
            f"{stem}.pptx no longer matches {stem}.md — regenerate it with "
            f"`python3 scripts/build-minister-docs.py`"
        )
    ok(f"{stem}.pptx — says exactly what {stem}.md says")



def main():
    parser = argparse.ArgumentParser(description="Build and check the Minister-facing documents.")
    parser.add_argument("--check", action="store_true",
                        help="build to a temp folder and compare, without writing anything")
    parser.add_argument("--only", help="one document stem, instead of all of them")
    args = parser.parse_args()

    if shutil.which("pandoc") is None:
        fail("pandoc was not found, so no document could be generated")

    wanted = [d for d in DOCUMENTS if args.only in (None, d[0])]
    deck = DECK if args.only in (None, DECK[0]) else None
    if not wanted and deck is None:
        fail(f"no document named {args.only!r}")

    # Checks that read the markdown only — they run before anything is generated.
    for stem, _ in wanted:
        check_dollars(stem)
        check_clause_numbers(stem)
        check_no_registered_mark(stem)
    for stem, one_page in wanted:
        if one_page:
            check_summary_content(stem)
    if deck is not None:
        check_dollars(deck[0])
        check_no_registered_mark(deck[0])

    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        reference = workdir / "reference-one-page.docx"
        if any(one_page for _, one_page in wanted):
            tightened_reference(reference)

        for stem, one_page in wanted:
            generated = build_one(stem, one_page, workdir, reference)
            check_dollars_survived(stem, generated)
            if one_page:
                check_one_page(stem, generated, workdir)
            if args.check:
                check_generated_matches_source(stem, generated)
            else:
                shutil.copyfile(generated, SUBMISSION / f"{stem}.docx")
                print(f"BUILT Minister Submission/{stem}.docx")

        if deck is not None:
            stem, reader = deck
            generated = build_deck(stem, reader, workdir)
            check_dollars_survived_deck(stem, generated)
            check_every_slide_has_a_title(stem, generated)
            check_no_fenced_div_reached_a_slide(stem, generated)
            check_no_registered_mark(
                stem, "\n".join(part for slide in pptx_slides(generated) for part in slide)
            )
            if args.check:
                check_deck_matches_source(stem, generated)
            else:
                shutil.copyfile(generated, SUBMISSION / f"{stem}.pptx")
                print(f"BUILT Minister Submission/{stem}.pptx")

    print("MINISTER_DOCS: PASS — every document built and checked")


if __name__ == "__main__":
    main()

