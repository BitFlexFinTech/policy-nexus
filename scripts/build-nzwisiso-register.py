#!/usr/bin/env python3
"""Build the Nzwisiso Research and Source Register (XLSX).

WHY THIS EXISTS
---------------
The proposal's source notes were a paragraph inside the proposal. A finance
ministry reads a register, not a paragraph, and GovComms already ships one in
this house form. This script generates the same register from ONE list of
sources, so the documents and this `.xlsx` cannot disagree: every figure a
document cites is listed here with the body that publishes it and the period,
and the Status column separates what was read directly from what is inferred
or still to be confirmed.

It mirrors `6. GovComms/PPP Submission/_build/build_register.py`.
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)

GREEN = "0A5C3A"
SURFACE = "EEF3EC"
thin = Side(style="thin", color="DCDFDA")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

HEADERS = ["Ref", "Category", "Source title", "Publisher / author",
           "Publication / update date", "URL or location", "Date accessed",
           "Relevant finding", "How it supports the proposal",
           "Status (verified / inferred / unconfirmed)"]
WIDTHS = [6, 22, 40, 26, 26, 44, 12, 60, 44, 30]

# Ref, Category, Title, Publisher, Date, Location, Accessed, Finding, Supports, Status
SOURCES = [
    ("1", "National cost evidence",
     "Zimbabwe: Public Financial Management Enhancement Project (P152932) — Implementation Completion Report No. ICR00005623",
     "World Bank", "4 February 2022", "World Bank document ICR00005623", "2026-10-12",
     "Annual maintenance Zimbabwe pays for one financial system is \"approximately US$3 million per year\"; the project was appraised at US$20 million and signed at US$10 million",
     "The anchor of the cost-comparison chapter: Zimbabwe's own published spend on one national system",
     "Verified — read directly this session"),
    ("2", "Policy-making evidence",
     "ZEPARI documented finding on policy-making procedure",
     "ZEPARI (Zimbabwe Economic Policy Analysis and Research Institute)", "Held corpus",
     "public/national-corpus.json", "2026-10-12",
     "Policies fail because \"there is no standardised procedure to policy making\"",
     "The strategic case: the precise gap the platform closes",
     "Verified — quoted from the held corpus"),
    ("3", "National budget",
     "National Budget Statement 2019", "Government of Zimbabwe", "2019",
     "Held research corpus (public/zepari-corpus.json)", "2026-10-12",
     "A US$1.7 million mining-cadastre figure",
     "National comparator for a delivered digital capability",
     "Verified — quoted word for word in the held corpus"),
    ("4", "Public-audit evidence",
     "Auditor-General's Annual Report — advance-payment bond finding",
     "Auditor-General of Zimbabwe", "Annual report", "public/national-corpus.json", "2026-10-12",
     "A Ministry paid an advance on a vehicle contract where the advance-payment bond from the Export Credit Guarantee Corporation of Zimbabwe had expired and the money could not be recovered",
     "Why the US$500,000 mobilisation advance is bonded: an unbonded advance is an audit finding",
     "Verified — read from the held corpus"),
    ("5", "National strategy",
     "National AI Strategy 2026–2030", "Government of Zimbabwe", "2026",
     "Cited in the proposal's alignment section", "2026-10-12",
     "Defines a Stakeholder Management and Communications function and Government AI direction",
     "Strategic alignment for an AI-assisted policy capability",
     "Verified — cited in the proposal"),
    ("6", "National strategy",
     "National Development Strategy 2 (NDS2), 2026–2030", "Government of Zimbabwe", "2026",
     "Cited in the proposal's alignment section", "2026-10-12",
     "Sets upper-middle-income status as the national goal and requires strengthened citizen engagement",
     "National commitment the proposal delivers against",
     "Verified — cited in the proposal"),
    ("7", "National programme",
     "Digitalize Zimbabwe", "Ministry of ICT, Postal and Courier Services", "April 2024",
     "Cited in the proposal", "2026-10-12",
     "The Ministry's named initiative connecting citizens to government",
     "The pilot programme the platform is offered under",
     "Verified — cited in the proposal"),
    ("8", "National vision",
     "Vision 2030", "Office of the President and Cabinet", "2020",
     "Cited in the proposal", "2026-10-12",
     "Upper-middle-income status by 2030 as the national goal",
     "Strategic alignment",
     "Verified — cited in the proposal"),
    ("9", "International comparator",
     "Electronic Government Procurement — Implementation Types: Options for Africa",
     "World Bank", "2022", "World Bank publication", "2026-10-12",
     "Country-by-country e-procurement platform costs across Africa",
     "The 10-year country comparison in the cost chapter",
     "Inferred — read from the record of 2026-10-12; not re-opened this session"),
    ("10", "International comparator",
     "\"Kenya — Selling to the Government\"", "United States Commercial Service (export.gov)",
     "13 August 2019", "export.gov", "2026-10-12",
     "Kenya allocated about US$76 million to fix IFMIS",
     "International comparator for a national platform",
     "Inferred — from the record of 2026-10-12"),
    ("11", "Independent company record",
     "Companies House record — SURFACE COLLECTIVE LIMITED (08625479)",
     "Companies House, GOV.UK", "Appointment 26 July 2013 — resigned 1 January 2016",
     "find-and-update.company-information.service.gov.uk", "2026-10-12",
     "Tadii TENDAYI, Director, company dissolved",
     "Independent public record in the Technical Capability Statement",
     "Verified — official record"),
    ("12", "Independent journalism",
     "\"How Tadii Tendayi is using blockchain and crypto to support vulnerable communities in Zimbabwe\"",
     "Techpoint Africa", "6 June 2025", "techpoint.africa", "2026-10-12",
     "Profile of the technical lead's work",
     "Independent corroboration in the capability statement",
     "Verified — found this session"),
    ("13", "Independent journalism",
     "\"How Tadii Tendayi is building an inclusive blockchain for Zimbabwe\"",
     "Emerging Tech Africa", "23 June 2022", "emergingtech.africa", "2026-10-12",
     "Profile of the technical lead's work",
     "Independent corroboration in the capability statement",
     "Verified — found this session"),
    ("14", "Industry maintenance bands",
     "IT maintenance-cost bands widely attributed to Gartner",
     "Gartner (attribution to be confirmed)", "Various", "Industry literature", "2026-10-12",
     "Maintenance as a share of IT budget (commonly cited bands)",
     "Context for running costs",
     "Unconfirmed — the precise publication must be confirmed before it is printed"),
    ("15", "National funding routes",
     "Z$185.3 billion ICT allocation and High-Performance Computing Phase II facility",
     "Said to be National Budget Statement 2018", "2018", "Claimed from the budget statement", "2026-10-12",
     "Could not be located in the held corpus this session",
     "NOT printed anywhere — held out until re-sourced",
     "Unconfirmed — searched the held corpus and not found"),
]

UNCERTAINTIES = [
    ("The funding source in the Government's own budget",
     "The Government identifies which budget line and which years fund the one-off and the monthly charge."),
    ("ZEPARI's formal endorsement",
     "ZEPARI agrees to partner on the evidence base and methods; the proposal asks for it and holds none today."),
    ("The Ministry's endorsement as a Digitalize Zimbabwe pilot",
     "The Ministry agrees to endorse the pilot; the proposal holds no endorsement today."),
    ("Data-protection obligations and the responsible authority",
     "Confirmed with the Government before any personal data is processed in production."),
    ("Use of the national Coat of Arms on project documentation",
     "Confirm whether authorisation is required and obtain it; none is used in this draft."),
    ("The exact Gartner publications behind the maintenance bands",
     "Confirm the precise publication before either band is printed."),
    ("The Z$185.3 billion ICT allocation and the High-Performance Computing Phase II facility",
     "Re-source from the budget statement itself, or leave out."),
]


def build():
    wb = Workbook()
    ws = wb.active
    ws.title = "Source Register"

    ws.merge_cells("A1:J1")
    c = ws["A1"]
    c.value = "Nzwisiso AI Policy Platform — Research and Source Register"
    c.font = Font(name="Calibri", size=15, bold=True, color=GREEN)
    c.alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 24

    ws.merge_cells("A2:J2")
    c = ws["A2"]
    c.value = ("Submitted by Oreida Pvt Ltd with the public-private partnership proposal for the "
               "Government of Zimbabwe. Every source below names the body that publishes it and its "
               "period. Status distinguishes what was read directly from what is inferred or still "
               "to be confirmed. A figure with no source is not permitted anywhere in the documents.")
    c.font = Font(name="Calibri", size=9.5, color="5A6B60")
    c.alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[2].height = 30

    ws.merge_cells("A3:J3")
    c = ws["A3"]
    c.value = ("Key: Verified = established directly from the source cited.   "
               "Inferred = supported by the record but not re-opened at first hand.   "
               "Unconfirmed = could not be established and is held out until it is.")
    c.font = Font(name="Calibri", size=9, italic=True, color="7A4A12")
    ws.row_dimensions[3].height = 18

    hr = 5
    for i, h in enumerate(HEADERS, start=1):
        cell = ws.cell(row=hr, column=i, value=h)
        cell.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=GREEN)
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = BORDER
    ws.row_dimensions[hr].height = 30

    for w, col in zip(WIDTHS, "ABCDEFGHIJ"):
        ws.column_dimensions[col].width = w

    r = hr + 1
    for row in SOURCES:
        for i, v in enumerate(row, start=1):
            cell = ws.cell(row=r, column=i, value=v)
            cell.font = Font(name="Calibri", size=9)
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = BORDER
            if r % 2 == 0:
                cell.fill = PatternFill("solid", fgColor=SURFACE)
        r += 1
    ws.freeze_panes = "A6"
    ws.sheet_view.showGridLines = False

    ws2 = wb.create_sheet("Recorded Uncertainties")
    ws2.merge_cells("A1:C1")
    c = ws2["A1"]
    c.value = "Recorded uncertainties and matters requiring confirmation"
    c.font = Font(name="Calibri", size=14, bold=True, color=GREEN)
    ws2.row_dimensions[1].height = 22
    for i, h in enumerate(["#", "Uncertainty", "What would resolve it"], start=1):
        cell = ws2.cell(row=3, column=i, value=h)
        cell.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=GREEN)
        cell.border = BORDER
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    rr = 4
    for i, (a, b) in enumerate(UNCERTAINTIES, start=1):
        ws2.cell(row=rr, column=1, value=i).font = Font(name="Calibri", size=9, bold=True)
        ws2.cell(row=rr, column=2, value=a).font = Font(name="Calibri", size=9.5, bold=True)
        ws2.cell(row=rr, column=3, value=b).font = Font(name="Calibri", size=9)
        for col in (1, 2, 3):
            cc = ws2.cell(row=rr, column=col)
            cc.alignment = Alignment(vertical="top", wrap_text=True)
            cc.border = BORDER
            if rr % 2 == 0:
                cc.fill = PatternFill("solid", fgColor=SURFACE)
        rr += 1
    ws2.column_dimensions["A"].width = 5
    ws2.column_dimensions["B"].width = 46
    ws2.column_dimensions["C"].width = 76
    ws2.freeze_panes = "A4"
    ws2.sheet_view.showGridLines = False

    path = os.path.join(OUT, "Minister Submission",
                        "Oreida_Research_and_Source_Register.xlsx")
    wb.save(path)
    return path


if __name__ == "__main__":
    p = build()
    print("BUILT", p)
    from openpyxl import load_workbook
    wb = load_workbook(p)
    print("sheets:", wb.sheetnames)
    print("source rows:", wb["Source Register"].max_row - 5)
    print("uncertainty rows:", wb["Recorded Uncertainties"].max_row - 3)

