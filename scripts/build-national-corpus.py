#!/usr/bin/env python3
"""
BUILD THE NATIONAL CROSS-CUTTING DOCUMENT LIBRARY (Batch B1).

WHAT THIS IS FOR, IN PLAIN WORDS.
The platform must never invent a document or a figure. So the real published documents that apply to
every one of the sixteen departments — the National Budget, the National Development Strategy, the
Auditor-General's report and ZIMSTAT's core releases — are downloaded from the body that publishes
them, their text is read out of the PDF, and the TEXT (never the PDF itself) is written to one data
file that ships with our own website: `public/national-corpus.json`.

WHY THE TEXT AND NOT THE PDF. A PDF is a picture of a page; it is large, it cannot be searched, and
it is not ours to re-publish wholesale. The text is what a screen can quote and cite, and it is far
smaller. This is the same pattern already proven on ZEPARI's corpus (`public/zepari-corpus.json`).

HOW TO RUN IT (from the project root):

    python3 scripts/build-national-corpus.py

It needs PyMuPDF (`python3 -c "import fitz"` must work) and an internet connection. It keeps the
downloaded PDFs in `.corpus-cache/` (gitignored) so a re-run does not download them twice, and it
writes `public/national-corpus.json` when it is done.

HONESTY RULES BUILT IN.
- Every entry carries its title, the body that published it, its date and the address of the
  published file, so any quotation can be checked by anyone.
- A document whose PDF has no text layer (a picture-only scan) is recorded by name with
  `"read": false` and an empty text — never faked, never dropped silently.
- A link that fails is printed in the run report and the build stops, so it is named rather than
  quietly missing. Re-running after fixing the address continues from the cache.
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".corpus-cache"
OUT = ROOT / "public" / "national-corpus.json"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122 Safari/537.36"
)

# ---------------------------------------------------------------------------------------------------
# THE DOCUMENTS. Every address below was opened by hand while this list was written, and the title,
# the publishing body and the date are the ones the source itself states. `section` groups them for
# the screen; it is not a claim about the document.
#
# The National Development Strategy PROGRESS REPORTS are NOT here: veritaszim publishes the
# strategies themselves (NDS1 and NDS2) but no standalone progress report, and the Ministry of
# Finance's own site did not answer when this was written. That is recorded honestly in
# PROJECT_STATUS.md rather than filled with a substitute document.
#
# TWO LINKS THAT FAILED, NAMED RATHER THAN DROPPED (first run, 2026-10-10):
#  - `.../NationalAccounts/2025/2024_GDP_Presentation_Q4_03_2025.pdf` → 404. Replaced by ZIMSTAT's
#    Q3 2025 GDP estimates, which answers.
#  - `.../2023/02/2020_ICT_AccessByHouseholds_and_UseByIndividuals_Survey_Report.pdf` → 404.
#    Replaced by ZIMSTAT's ICT Index for Q1 2025, which answers.
# ---------------------------------------------------------------------------------------------------
SOURCES = [
    {
        "id": "nat-001",
        "section": "National Budget",
        "title": "The 2024 National Budget Statement — \"Consolidating Economic Transformation\"",
        "publisher": "Ministry of Finance, Economic Development and Investment Promotion",
        "date": "30 November 2023",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/The%202024%20Budget%20Statement.pdf",
    },
    {
        "id": "nat-002",
        "section": "National Budget",
        "title": "The 2024 National Budget Speech",
        "publisher": "Ministry of Finance, Economic Development and Investment Promotion",
        "date": "30 November 2023",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/The%202024%20National%20Budget%20Speech%20Final%20web.pdf",
    },
    {
        "id": "nat-003",
        "section": "National Development Strategy",
        "title": "National Development Strategy 1 (NDS1) 2021-2025",
        "publisher": "Government of Zimbabwe",
        "date": "November 2020",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/NDS.pdf",
    },
    {
        "id": "nat-004",
        "section": "National Development Strategy",
        "title": "National Development Strategy 2 (NDS2) 2026-2030",
        "publisher": "Government of Zimbabwe",
        "date": "2025",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/National%20Development%20Strategy%202%20%28NDS2%29%202026-2030.pdf",
    },
    {
        "id": "nat-005",
        "section": "Auditor-General",
        "title": "Report of the Auditor-General for the Year Ended 2024 on Appropriation Accounts, Finance and Revenue Statements and Fund Accounts",
        "publisher": "Office of the Auditor-General",
        "date": "2025",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/Report%20of%20the%20Auditor-General%20for%20the%20Year%20Ended%202024%20on%20Appropriation%20Accounts%2CFinance%20and%20Revenue%20Statements%20and%20Fund%20Accounts.pdf",
    },
    {
        "id": "nat-006",
        "section": "Auditor-General",
        "title": "Report of the Auditor-General for the Financial Year Ended December 31, 2021 on Appropriation Accounts, Finance and Revenue Statements and Fund Accounts",
        "publisher": "Office of the Auditor-General",
        "date": "2022",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/REPORT%20of%20the%20Auditor-General%20for%20the%20FINANCIAL%20YEAR%20ENDED%20DECEMBER%2031%2C%202021%20on%20APPROPRIATION%20ACCOUNTS%2C%20FINANCE%20AND%20REVENUE%20STATEMENTS%20AND%20FUND%20ACCOUNTS.pdf",
    },
    {
        "id": "nat-007",
        "section": "Auditor-General",
        "title": "Auditor-General's Report 2020 for Appropriation Accounts, Finance Accounts, Revenue Statements and Fund Accounts",
        "publisher": "Office of the Auditor-General",
        "date": "2021",
        "url": "https://www.veritaszim.net/sites/veritas_d/files/AG%20REPORT%202020%20FOR%20APPROPRIATION%20ACCOUNTS%20FINANCE%20ACCOUNTS%20REVENUE%20STATEMENTS%20AND%20FUND%20ACCOUNT%20.pdf",
    },
    {
        "id": "nat-008",
        "section": "ZIMSTAT",
        "title": "2022 Population and Housing Census Report",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "2023",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/Census/2022_PHC_Report_27012023_Final.pdf",
    },
    {
        "id": "nat-009",
        "section": "ZIMSTAT",
        "title": "2022 Population Projection Report",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "2023",
        "url": "https://www.zimstat.co.zw/wp-content/uploads//Census/2022_POPULATION_PROJECTION_REPORT.pdf",
    },
    {
        "id": "nat-010",
        "section": "ZIMSTAT",
        "title": "Consumer Price Index (CPI) — December 2025",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "December 2025",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/Macro/Prices/CPI/2025/CPI_ZWG_12_2025.pdf",
    },
    {
        "id": "nat-011",
        "section": "ZIMSTAT",
        "title": "Presentation of Quarterly Gross Domestic Product (GDP) Estimates — Quarter 3 of 2025",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "24 December 2025",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/Macro/NationalAccounts/2025/Publish_Final_Q3_2025_GDP_Estimates_24_12_2025.pdf",
    },
    {
        "id": "nat-012",
        "section": "ZIMSTAT",
        "title": "Poverty, Income, Consumption and Expenditure Survey (PICES) 2017 — Final Report",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "2019",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/Macro/Poverty_Statistics/PICES_2017_Final_Report_28_January_2019.pdf",
    },
    {
        "id": "nat-013",
        "section": "ZIMSTAT",
        "title": "External Trade Statistics — March 2026",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "2026",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/Macro/Trade/2026/03/EXTERNAL_TRADE_03_2026.pdf",
    },
    {
        "id": "nat-014",
        "section": "ZIMSTAT",
        "title": "Labour Force Report 2019",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "2020",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/Macro/Labor-force/Labour-Force-Report-2019.pdf",
    },
    {
        "id": "nat-015",
        "section": "ZIMSTAT",
        "title": "ICT Index — First Quarter 2025",
        "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)",
        "date": "2025",
        "url": "https://www.zimstat.co.zw/wp-content/uploads/production/ICT/2025/Q1_ICT_INDEX_2025.pdf",
    },
]


def download(url: str, target: Path) -> None:
    """Fetch one PDF to `target`, reusing a complete copy already in the cache."""
    if target.exists() and target.stat().st_size > 1024:
        return
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                body = response.read()
            if len(body) < 1024:
                raise RuntimeError(f"only {len(body)} bytes came back — not a document")
            target.write_bytes(body)
            return
        except (urllib.error.URLError, RuntimeError, TimeoutError, OSError) as error:
            last_error = error
            time.sleep(2 + attempt * 3)
    raise RuntimeError(f"could not download {url}: {last_error}")


def read_text(path: Path) -> tuple[bool, int, str]:
    """Read a PDF's text. Returns (could it be read, page count, the text)."""
    import fitz  # PyMuPDF — imported here so a missing install reports clearly.

    document = fitz.open(path)
    try:
        text = "".join(page.get_text() for page in document)
        pages = document.page_count
    finally:
        document.close()
    cleaned = "\n".join(line.rstrip() for line in text.splitlines()).strip()
    # A picture-only scan yields almost nothing; below this it is honestly "not read".
    return (len(cleaned) >= 200, pages, cleaned)


def main() -> int:
    CACHE.mkdir(exist_ok=True)
    documents = []
    failures = []
    not_read = []

    for source in SOURCES:
        path = CACHE / f"{source['id']}.pdf"
        print(f"[{source['id']}] {source['title'][:70]}…", flush=True)
        try:
            download(source["url"], path)
        except RuntimeError as error:
            failures.append(f"{source['id']} — {source['title']} ({error})")
            print(f"    FAILED: {error}", flush=True)
            continue

        try:
            read, pages, text = read_text(path)
        except Exception as error:  # a corrupt or unreadable file must be named, not hidden
            failures.append(f"{source['id']} — {source['title']} (could not be opened: {error})")
            print(f"    UNREADABLE: {error}", flush=True)
            continue

        if not read:
            not_read.append(f"{source['id']} — {source['title']}")
        print(f"    pages {pages}, characters {len(text)}, read={read}", flush=True)

        documents.append(
            {
                "id": source["id"],
                "section": source["section"],
                "title": source["title"],
                "publisher": source["publisher"],
                "date": source["date"],
                "url": source["url"],
                "pages": pages,
                "read": read,
                "characters": len(text),
                "text": text,
            }
        )

    if failures:
        print("\nTHE FOLLOWING LINKS FAILED AND MUST BE NAMED, NOT REPLACED:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        print("\nNothing was written. Fix the addresses above and run again.", file=sys.stderr)
        return 1

    payload = {
        "source": "The published national cross-cutting documents — the National Budget, the "
        "National Development Strategy, the Auditor-General's reports and ZIMSTAT's core releases",
        "retrieved": time.strftime("%Y-%m-%d"),
        "documents": documents,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    readable = sum(1 for document in documents if document["read"])
    print(
        f"\nWROTE {OUT.relative_to(ROOT)} — {len(documents)} documents, "
        f"{readable} readable, {OUT.stat().st_size:,} bytes"
    )
    if not_read:
        print("RECORDED AS NOT READ (picture-only scans, named rather than faked):")
        for entry in not_read:
            print(f"  - {entry}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
