#!/usr/bin/env python3
"""
BUILD THE DEPARTMENT DOCUMENT LIBRARIES (Batch B2 — departments 1 to 8).

WHAT THIS IS FOR, IN PLAIN WORDS.
The platform must never invent a document or a figure. So each department's real published
documents — its governing law, its sector policy, the parliamentary committee's reports on it and
the audits of it — are downloaded from the body that publishes them, their text is read out of the
PDF, and the TEXT (never the PDF itself) is written to one data file per department that ships with
our own website: `public/department-corpus/<departmentId>.json`.

WHY THE TEXT AND NOT THE PDF. A PDF is a picture of a page; it is large, it cannot be searched, and
it is not ours to re-publish wholesale. The text is what a screen can quote and cite, and it is far
smaller. This is the same pattern already proven on ZEPARI's corpus (`public/zepari-corpus.json`)
and the national cross-cutting set (`public/national-corpus.json`).

HOW TO RUN IT (from the project root):

    python3 scripts/build-department-corpora.py                 # every department in SOURCES
    python3 scripts/build-department-corpora.py --only opc,ict  # a subset, while the set grows

It needs PyMuPDF (`python3 -c "import fitz"` must work) and an internet connection. It keeps the
downloaded PDFs in `.corpus-cache/dept/` (gitignored) so a re-run does not download them twice, and
it writes each `public/department-corpus/<departmentId>.json` when it is done.

HONESTY RULES BUILT IN.
- Every entry carries its title, the body that published it, its date and the address of the
  published file, so any quotation can be checked by anyone.
- A document whose PDF has no text layer (a picture-only scan) is recorded by name with
  `"read": false` and an empty text — never faked, never dropped silently.
- A link that fails is printed in the run report and the build stops, so it is named rather than
  quietly missing. Re-running after fixing the address continues from the cache.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".corpus-cache" / "dept"
OUT_DIR = ROOT / "public" / "department-corpus"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122 Safari/537.36"
)

V = "https://www.veritaszim.net/sites/veritas_d/files/"

# ---------------------------------------------------------------------------------------------------
# THE DOCUMENTS, DEPARTMENT BY DEPARTMENT. Every address below was opened and read while this list
# was written; the title, the publishing body and the date are the ones the source itself states.
# `section` groups them for the screen; it is not a claim about the document.
#
# WHERE THESE COME FROM, AND WHAT COULD NOT BE USED. The ministry sites themselves refused direct
# downloads (an HTTP 403) or publish no readable PDF, so each department's set is drawn from the
# bodies that DO publish, openly and reliably: veritaszim (the governing Acts, the sector policies,
# the parliamentary committees' reports and the Auditor-General's reports). This is recorded in
# PROJECT_STATUS.md rather than filled with a substitute.
# ---------------------------------------------------------------------------------------------------
SOURCES = {
    "opc": [
        {"id": "opc-001", "section": "Governing law", "title": "Constitution of Zimbabwe, 2013 (Amendment No. 20)",
         "publisher": "Government of Zimbabwe", "date": "2013",
         "url": V + "Constitution%20of%20Zimbabwe%20Amendment%20%28No.%2020%29.pdf"},
        {"id": "opc-002", "section": "Governing law", "title": "Constitution of Zimbabwe Amendment (No. 2) Act, 2021",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "Constitution%20of%20Zimbabwe%20Amendment%20%28No.%202%29.pdf"},
        {"id": "opc-003", "section": "State of the Nation Address", "title": "State of the Nation Address by the President, 2024",
         "publisher": "Office of the President and Cabinet", "date": "2 October 2024",
         "url": V + "OPC%20SONA%20SPEECH%202024.pdf"},
        {"id": "opc-004", "section": "State of the Nation Address", "title": "State of the Nation Address by the President, 2023",
         "publisher": "Office of the President and Cabinet", "date": "3 October 2023",
         "url": V + "SONA%20SPEECH%202023.pdf"},
        {"id": "opc-005", "section": "Cabinet briefing", "title": "Eleventh Post-Cabinet Press Briefing, 2025",
         "publisher": "Zimbabwe Cabinet", "date": "29 April 2025",
         "url": V + "ELEVENTH%20POST%20CABINET.pdf"},
        {"id": "opc-006", "section": "Cabinet briefing", "title": "Twelfth Post-Cabinet Press Briefing, 2025",
         "publisher": "Zimbabwe Cabinet", "date": "6 May 2025",
         "url": V + "TWELFTH%20POST%20CABINET%20BRIEF%202025%20-%206%20MAY%202025.pdf"},
        {"id": "opc-007", "section": "State of the Nation Address", "title": "President's 44th Independence Day Speech, 2024",
         "publisher": "Office of the President and Cabinet", "date": "18 April 2024",
         "url": V + "44TH%20INDEPENDENCE%20SPEECH%202024.pdf"},
        {"id": "opc-008", "section": "State of the Nation Address", "title": "State of the Nation Address, October 2021",
         "publisher": "Office of the President and Cabinet", "date": "7 October 2021",
         "url": V + "2021%20SONA%20OCTOBER.pdf"},
    ],
    "ict": [
        {"id": "ict-001", "section": "Sector policy", "title": "Zimbabwe National Policy for Information and Communications Technology (ICT), 2016",
         "publisher": "Ministry of Information Communication Technology, Postal and Courier Services", "date": "2016",
         "url": V + "Zimbabwe%20National%20Policy%20for%20ICT%202016.pdf"},
        {"id": "ict-002", "section": "Governing law", "title": "Cyber and Data Protection Act [Chapter 12:07] (No. 5 of 2021)",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "Cyber%20%26%20Data%20Protection%20Act%20Cap1207%20No%205%20of%202021%20gaz%202022-03-11.pdf"},
        {"id": "ict-003", "section": "Committee report", "title": "Report of the Portfolio Committee on ICT, Postal and Courier Services on Mobile and Internet Connectivity in Zimbabwe (S.C. 9, 2024)",
         "publisher": "Parliament of Zimbabwe", "date": "2024",
         "url": V + "ICT%20Report%20on%20mobile%20and%20internet%20connectivity%20in%20Zimbabwe..pdf"},
        {"id": "ict-004", "section": "Committee report", "title": "Report of the Portfolio Committee on ICT, Postal and Courier Services: Benchmarking Visit to Rwanda (S.C. 6, 2021)",
         "publisher": "Parliament of Zimbabwe", "date": "October 2021",
         "url": V + "ICT%20PC%20Rwanda%20REPORT%20FINAL.pdf"},
        {"id": "ict-005", "section": "Committee report", "title": "First Report of the Portfolio Committee on ICT, Postal and Courier Services on the State of the Mobile Sector in Zimbabwe (S.C. 11, 2014)",
         "publisher": "Parliament of Zimbabwe", "date": "2014",
         "url": V + "Portfolio%20Committee%20on%20ICT%20Postal%20and%20Courier%20Services%20on%20the%20State%20of%20the%20Mobile%20Sector%20in%20Zimbabwe%20-%20SC%2011-2014.pdf"},
        {"id": "ict-006", "section": "Regulator guideline", "title": "Cyber and Data Protection Implementation Guideline on Data Breach Notification and Handling (CDPG 3 of 2024)",
         "publisher": "Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ)", "date": "2024",
         "url": V + "03%20Data%20Breach%20Notification%20an%20handling.pdf"},
        {"id": "ict-007", "section": "Regulator guideline", "title": "Data Protection Authority Implementation Guidelines on the Cyber and Data Protection Act [Chapter 12:07]",
         "publisher": "Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ)", "date": "2024",
         "url": V + "Cyber%20and%20Data%20Protection%20Act%20Implementation%20Guidlines.pdf"},
        {"id": "ict-008", "section": "Regulator guideline", "title": "Draft Consultation Paper on the Draft Amendment Bill to the Postal and Telecommunications Act [Chapter 12:05]",
         "publisher": "Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ)", "date": "March 2018",
         "url": V + "Consultative%20Document%20on%20the%20Draft%20Bill%20March%202018.%20FINAL%20VERSION%20%20dd%2015....pdf"},
    ],
    "fin": [
        {"id": "fin-001", "section": "Governing law", "title": "Public Debt Management Act [Chapter 22:21] (Act 4 of 2015)",
         "publisher": "Government of Zimbabwe", "date": "2015",
         "url": V + "Public%20Debt%20Management%20Act%2C%20Act%204-2015.pdf"},
        {"id": "fin-002", "section": "Governing law", "title": "Finance Act, 2025 (Act No. 7 of 2025)",
         "publisher": "Government of Zimbabwe", "date": "2025",
         "url": V + "Finance%20Act%2C%20Act%20No.%207%20of%202025.pdf"},
        {"id": "fin-003", "section": "Annual report", "title": "Annual Report of the Financial Intelligence Unit, 2024",
         "publisher": "Financial Intelligence Unit, Reserve Bank of Zimbabwe", "date": "2024",
         "url": V + "Annual%20Report%20of%20Financial%20Intelligence%20Unit%202024_1.pdf"},
        {"id": "fin-004", "section": "Governing law", "title": "Public Procurement and Disposal of Public Assets Act [Chapter 22:23]",
         "publisher": "Government of Zimbabwe", "date": "2017",
         "url": V + "Public%20Procurement%20Act%20r.pdf"},
        {"id": "fin-005", "section": "Public finance statement", "title": "Statement of Public Debt, 25 November 2021",
         "publisher": "Ministry of Finance, Economic Development and Investment Promotion", "date": "25 November 2021",
         "url": V + "Statement%20of%20Public%20Debt-%2025%20November%202021.pdf"},
        {"id": "fin-006", "section": "Monetary policy", "title": "2025 Monetary Policy Statement",
         "publisher": "Reserve Bank of Zimbabwe", "date": "6 February 2025",
         "url": V + "MPS%20February%2006%202025.pdf"},
        {"id": "fin-007", "section": "Governing law", "title": "Money Laundering and Proceeds of Crime Amendment Act",
         "publisher": "Government of Zimbabwe", "date": "2019",
         "url": V + "Money%20Laundering%20and%20Proceeds%20of%20Crime%20Amendment%20Act.pdf"},
        {"id": "fin-008", "section": "National strategy", "title": "Interim Poverty Reduction Strategy Paper (I-PRSP) 2016–2018",
         "publisher": "Government of Zimbabwe", "date": "2016",
         "url": V + "Interim%20Poverty%20Reduction%20Strategy%20Paper%20%28I-PRSP%29%202016%20-%202018.pdf"},
    ],
    "agri": [
        {"id": "agri-001", "section": "Committee report", "title": "Report of the Lands, Agriculture Committee on the State of Food Security in the Country",
         "publisher": "Parliament of Zimbabwe", "date": "2024",
         "url": V + "Lands%2C%20Agric%20Committee-Report%20on%20Food%20Security.pdf"},
        {"id": "agri-002", "section": "Public accounts", "title": "Third Report of the Public Accounts Committee on the Special Maize Programme / Command Agriculture (S.C. 24, 2021)",
         "publisher": "Parliament of Zimbabwe", "date": "August 2021",
         "url": V + "PAC%20Report%20-%20Command%20Agriculture%20Special%20Maize%20Programme%20SC%2024%202021.pdf"},
        {"id": "agri-003", "section": "Public accounts", "title": "Second Report of the Public Accounts Committee on Vote 8, Ministry of Lands, Agriculture, Water, Fisheries and Rural Resettlement for the years ended 2017 and 2018",
         "publisher": "Parliament of Zimbabwe", "date": "April 2021",
         "url": V + "Min.%20of%20Lands%2C%20Agriculture%20separate.pdf"},
        {"id": "agri-004", "section": "Public accounts", "title": "Report of the Public Accounts Committee on the Audited Financial Statements for the Agricultural and Rural Development Authority, 2023",
         "publisher": "Parliament of Zimbabwe", "date": "2024",
         "url": V + "PAC%20REPORT%20ON%20AUDITED%20FINANCIAL%20STATEMENTS%20FOR%20ARD.pdf"},
        {"id": "agri-005", "section": "Committee report", "title": "First Report of the Thematic Committee on Peace and Security on the Preparedness of the Grain Marketing Board for the 2016/2017 Grain Deliveries (S.C. 15, 2017)",
         "publisher": "Parliament of Zimbabwe", "date": "July 2017",
         "url": V + "Peace%20and%20Security%201st%20Report%20on%20Preparedness%20of%20the%20%28GMB%29%20to%20Handle%20the%202016-17%20Grain%20Deliveries%20and%20the%20Success%20of%20the%20Command%20Agriculture%20Programme.pdf"},
        {"id": "agri-006", "section": "Committee report", "title": "First Report of the Portfolio Committee on Lands, Agriculture, Water, Fisheries and Rural Development on the Case of US$28.2 million distributed by the Reserve Bank to Grain Millers",
         "publisher": "Parliament of Zimbabwe", "date": "2021",
         "url": V + "GRAIN%20MILLERS%20REPORTElusive%20US%2428.2m.pdf"},
        {"id": "agri-007", "section": "Governing law", "title": "Agricultural Marketing Authority (Grain, Oil Seeds and Products) (Amendment) Regulations, 2021 (No. 1)",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "SI%202021-274%20Agricultural%20Marketing%20Authority%20%28Grain%2C%20Oil%20Seeds%20and%20Products%29%20%28Amendment%29%20Regulations%2C%202021%28No.%201%29.pdf"},
        {"id": "agri-008", "section": "Governing law", "title": "Tobacco Industry and Marketing (Prohibition of Side Marketing) Regulations, 2022",
         "publisher": "Government of Zimbabwe", "date": "2022",
         "url": V + "SI%202022-077%20Tobacco%20Industry%20and%20Marketing%20%28Prohibition%20of%20Side%20Marketing%29%20Regulations%2C%202022_0.pdf"},
    ],
    "health": [
        {"id": "health-001", "section": "Governing law", "title": "Public Health Act [Chapter 15:17]",
         "publisher": "Government of Zimbabwe", "date": "2018",
         "url": V + "Public%20Health%20Act%20%5BCHAPTER%2015-17%5Dr.pdf"},
        {"id": "health-002", "section": "Governing law", "title": "Health Service Act [Chapter 15:16] as at 1 June 2021",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "Health%20Service%20Act%20%5BCap%2015-16%5D%20as%20amended%201%20June%202021.pdf"},
        {"id": "health-003", "section": "Statistics", "title": "Zimbabwe Demographic and Health Survey 2023–24",
         "publisher": "Zimbabwe National Statistics Agency (ZIMSTAT)", "date": "2024",
         "url": V + "Zim%20Demographi%26%20Health%20Survey%202023-4.pdf"},
        {"id": "health-004", "section": "Committee report", "title": "Report of the Portfolio Committee on Health and Child Care on Prevention and Management of Non-Communicable Diseases including Cancer",
         "publisher": "Parliament of Zimbabwe", "date": "2024",
         "url": V + "Report%20on%20Prevention%20and%20Management%20of%20NCDs%20including%20Cancer.pdf"},
        {"id": "health-005", "section": "Committee report", "title": "First Report of the Portfolio Committee on Health and Child Care on the Evidence Gathered during the Public Hearings on the Health Services Amendment Bill [H.B. 8, 2021]",
         "publisher": "Parliament of Zimbabwe", "date": "2021",
         "url": V + "FIRST%20REPORT%20OF%20THE%20PORTFOLIO%20COMMITTEE%20ON%20HEALTH%20AND%20CHILD%20CARE%20ON%20THE%20EVIDENCE%20GATHERED%20DURING%20THE%20PUBLIC%20HEARINGS%20ON%20THE%20HEALTH%20SERVICES%20AMENDMENT%20BILL%20%5BH.B%208%2C%202021%5D.pdf"},
        {"id": "health-006", "section": "Committee report", "title": "Report of the Portfolio Committee on Health and Child Care on the Roles and Responsibilities of Village Health Workers",
         "publisher": "Parliament of Zimbabwe", "date": "2017",
         "url": V + "Portfolio%20Committee%20on%20Health%20%26%20Child%20Care%20on%20the%20Roles%20%26%20Responsibilities%20of%20the%20Village%20Health%20Workers..pdf"},
        {"id": "health-007", "section": "Committee report", "title": "Special Report of the Portfolio Committee on Health on Putting Tuberculosis on the Political Agenda (S.C. 3, 2015)",
         "publisher": "Parliament of Zimbabwe", "date": "2015",
         "url": V + "SC%202015-03%20-%20Special%20Report%20of%20the%20Portfolio%20Committee%20on%20Health%20on%20Putting%20Tuberculosis%20on%20the%20Political%20Agenda.pdf"},
        {"id": "health-008", "section": "Treaty", "title": "African Union Treaty for the Establishment of the African Medicines Agency",
         "publisher": "African Union", "date": "2019",
         "url": V + "36892-sl-TREATY_FOR_THE_ESTABLISHMENT_OF_THE_AFRICAN_MEDICINES_AGENCY.pdf"},
    ],
    "edu": [
        {"id": "edu-001", "section": "Governing law", "title": "Education Amendment Act, 2019 (Act 15 of 2019)",
         "publisher": "Government of Zimbabwe", "date": "2019",
         "url": V + "EDUCATION%20AMENDMENT%20ACT%2C%202019%20%5B%20Act%2015-2019%5D_0.pdf"},
        {"id": "edu-002", "section": "Audit report", "title": "Auditor-General's Report on Registration, Supervision and Monitoring of Schools and Independent Colleges",
         "publisher": "Auditor-General, Republic of Zimbabwe", "date": "2020",
         "url": V + "REGISTRATION%2C%20SUPERVISION%20AND%20MONITORING%20OF%20SCHOOLS%20%281%29.pdf"},
        {"id": "edu-003", "section": "Committee report", "title": "Report on the Verification Visit to Schools 2022",
         "publisher": "Parliament of Zimbabwe", "date": "2022",
         "url": V + "REPORT%20ON%20THE%20VERIFICATION%20VISIT%20TO%20SCHOOLS%202022.pdf"},
        {"id": "edu-004", "section": "Committee report", "title": "First Report of the Portfolio Committee on Primary and Secondary Education on the Inclusive Education Policy (IEP) and Better Schools Programme Zimbabwe (BSPZ) Petitions",
         "publisher": "Parliament of Zimbabwe", "date": "May 2022",
         "url": V + "FIRST%20REPORT%20OF%20THE%20PORTFOLIO%20COMMITTEE%20ON%20PRIMARY%20AND%20SECONDARY%20EDUCATION%20ON%20THE%20INCLUSIVE%20EDUCATION%20POLICY%20%28IEP%29%20AND%20BETTER%20SCHOOLS%20PROGRAMME-%20ZIMBABWE%20%28BSPZ%29%20PETITIONS.pdf"},
        {"id": "edu-005", "section": "Committee report", "title": "Report of the Portfolio Committee on Primary and Secondary Education on Benchmarking Visits to Kenya, Zambia and Ghana on Education Financing",
         "publisher": "Parliament of Zimbabwe", "date": "May 2022",
         "url": V + "PC%20on%20PSEducation%20-%20Report%20on%20Benchmarking%20Visits%20to%20Kenya%2C%20Zambia%20%26%20Ghana%20on%20Education%20Financing.pdf"},
        {"id": "edu-006", "section": "Committee report", "title": "Report on the Learning and Exchange Visit on the Finnish Early Childhood Education and Care Model",
         "publisher": "Parliament of Zimbabwe", "date": "2023",
         "url": V + "Report%20on%20Early%20Childhood%20Education%20-%20Finland%20%26%20Sweden.pdf"},
        {"id": "edu-007", "section": "Committee report", "title": "Report of the Portfolio Committee on Primary and Secondary Education on Schools Opening in Light of the COVID-19 Pandemic",
         "publisher": "Parliament of Zimbabwe", "date": "2020",
         "url": V + "PPC%20Pri%20and%20Sec%20Edu%20-%20Schools%20Opening%20Report.pdf"},
        {"id": "edu-008", "section": "Governing law", "title": "Education, Innovation, Research and Development Centre Act, 2021 (No. 3 of 2021)",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "Centre%20for%20Education%2C%20Innovation%2C%20Research%20and%20Development%20Act%20No.%203%20of%202021.pdf"},
    ],
    "hedu": [
        {"id": "hedu-001", "section": "Governing law", "title": "Manpower Planning and Development Amendment Act, 2020",
         "publisher": "Government of Zimbabwe", "date": "2020",
         "url": V + "Manpower%20Planning%20and%20Development%20Amendment%20Act.pdf"},
        {"id": "hedu-002", "section": "Governing law", "title": "Marondera University of Agricultural Sciences and Technology Act [Chapter 25:29]",
         "publisher": "Government of Zimbabwe", "date": "2015",
         "url": V + "Marondera%20University%20of%20Agricultural%20Sciences%20%26%20Technological%20Act%20%5BCap%2025-29%5D.pdf"},
        {"id": "hedu-003", "section": "Governing law", "title": "Pan-African Minerals University of Science and Technology Act [Chapter 25:33]",
         "publisher": "Government of Zimbabwe", "date": "2016",
         "url": V + "Pan-African%20Minerals%20University%20of%20Science%20and%20Technology%20Act%20%5BCap%2025-33%5D.pdf"},
        {"id": "hedu-004", "section": "Committee report", "title": "Portfolio Committee Report on Sexual Harassment in Higher and Tertiary Education Institutions",
         "publisher": "Parliament of Zimbabwe", "date": "2022",
         "url": V + "Sexual%20Harassment%20Report%20-%20Committee%20on%20Higher%20%26%20Tertiary%20Education%20%26%20Women%20Affairs.pdf"},
        {"id": "hedu-005", "section": "Committee report", "title": "Portfolio Committee on Higher and Tertiary Education, Science and Technological Development Report on Biotechnology (S.C. 1, 2016)",
         "publisher": "Parliament of Zimbabwe", "date": "2016",
         "url": V + "Portfolio%20Committee%20on%20Higher%20and%20Tertiary%20Education%2C%20Science%20and%20Technological%20Development%27s%20Report%20on%20Biotechnology%20%28SC%201%2C%202016%29.pdf"},
        {"id": "hedu-006", "section": "Governing law", "title": "Manpower Planning and Development (Information Communication Technology Industry) Regulations, 2024 (S.I. 141 of 2024)",
         "publisher": "Government of Zimbabwe", "date": "2024",
         "url": V + "SI%202024-141%20Manpower%20Planning%20and%20Development%20%28Information%20Communication%20Technology%20Industry%29%20Regulations%2C%202024.pdf"},
        {"id": "hedu-007", "section": "Governing law", "title": "Manpower Planning and Development (Chemical Industry) Regulations, 2023 (S.I. 139 of 2023)",
         "publisher": "Government of Zimbabwe", "date": "2023",
         "url": V + "SI%202023-139%20Manpower%20Planning%20and%20Development%20%28Chemical%20Industry%29%20Regulations%2C%202023.pdf"},
        {"id": "hedu-008", "section": "Bill", "title": "Manpower Planning and Development Amendment Bill, 2020 (H.B. 2, 2020)",
         "publisher": "Government of Zimbabwe", "date": "2020",
         "url": V + "Manpower%20Planning%20and%20Development%20Amendment%20Bill%202020.pdf"},
    ],
    "mines": [
        {"id": "mines-001", "section": "Governing law", "title": "Mines and Minerals Act [Chapter 21:05] (updated to 1 August 2021)",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "Mines%20and%20Minerals%20Act%20Cap%2021-05%20updated%20to%201%20August%202021.pdf"},
        {"id": "mines-002", "section": "Audit report", "title": "Report of the Auditor-General on the Management of Occupational Health and Safety in Mining Operations (VFM 2019:05)",
         "publisher": "Auditor-General, Republic of Zimbabwe", "date": "2019",
         "url": V + "Auditor-General%20Report%20on%20the%20Management%20of%20Occupational%20Health%20and%20Safety%20in%20Mining%20Operations%20by%20the%20Ministry%20of%20Mines%20and%20Mining%20Development.pdf"},
        {"id": "mines-003", "section": "Committee report", "title": "Report of the Portfolio Committee on Mines and Mining Development on a Self-Assessment of the Diamond Sector in Zimbabwe (S.C. 12, 2022)",
         "publisher": "Parliament of Zimbabwe", "date": "April 2022",
         "url": V + "REPORT%20OF%20THE%20PORTFOLIO%20COMMITTEE%20ON%20MINES%20AND%20MINING%20DEVELOPMENT%20ON%20A%20SELF-ASSESSMENT%20OF%20THE%20DIAMOND%20SECTOR%20IN%20ZIMBABWE%20FOURTH%20SESSION%20-%20NINTH%20PARLIAMENT%20APRIL%202022.pdf"},
        {"id": "mines-004", "section": "Committee report", "title": "First Report of the Portfolio Committee on Mines and Energy on the Consolidation of the Diamond Mining Companies (S.C. 9, 2017)",
         "publisher": "Parliament of Zimbabwe", "date": "2017",
         "url": V + "Portfolio%20Committee%20on%20Mines%20and%20Energy%20Report%20on%20the%20Consolidation%20of%20the%20Diamond%20Mining%20Companies%20-%20SC%209-2017.pdf"},
        {"id": "mines-005", "section": "Policy paper", "title": "Lithium Mining and National Economic Development in Zimbabwe: Prospects for Resource-based National Development",
         "publisher": "Green and Transition Minerals Collection (author: Grasian Mkodzongi)", "date": "July 2024",
         "url": V + "Lithium%20Mining%20and%20National%20Economic%20Development%20in%20Zimbabwe.pdf"},
        {"id": "mines-006", "section": "Bill", "title": "Mines and Minerals Bill, 2025 (H.B. 1, 2025)",
         "publisher": "Government of Zimbabwe", "date": "2025",
         "url": V + "Mines%20%26%20Minerals%20Bill_0.pdf"},
        {"id": "mines-007", "section": "Governing law", "title": "Base Minerals Export Control (Lithium Bearing Ores and Unbeneficiated Lithium) Order, 2022 (S.I. 213 of 2022)",
         "publisher": "Government of Zimbabwe", "date": "2022",
         "url": V + "SI%202022-213%20Base%20Minerals%20Export%20Control%20%28Lithium%20Bearing%20Ores%20and%20Unbeneficiated%20Lithium%29%20Order%2C%202022.pdf"},
        {"id": "mines-008", "section": "Governing law", "title": "Mines and Minerals (Prohibition Order of Exportations of Unprocessed Granite) Notice, 2022 (S.I. 127 of 2022)",
         "publisher": "Government of Zimbabwe", "date": "2022",
         "url": V + "SI%202022-127%20Mines%20and%20Minerals%20%28Prohibition%20Order%20of%20Exportations%20of%20Unprocessed%20Granite%29%20Notice%2C%202022.pdf"},
    ],
    "energy": [
        {"id": "energy-001", "section": "Governing law", "title": "Electricity Act [Chapter 13:19]",
         "publisher": "Government of Zimbabwe", "date": "Published copy 2022-09",
         "url": V + "ELECTRICITY%20ACT%20CHAPTER%2013-19.pdf"},
        {"id": "energy-002", "section": "Governing law", "title": "Electricity Amendment Act, Act No. 7 of 2023",
         "publisher": "Government of Zimbabwe", "date": "2023",
         "url": V + "ELECTRICITY%20AMENDMENT%20ACT%2C%20Act%20No.%207%20of%202023%20.pdf"},
        {"id": "energy-003", "section": "Regulations", "title": "Electricity (Provision of Backbone Infrastructure) Regulations, 2026 (S.I. 128 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-128%20Electricity%20%28Provision%20of%20Backbone%20Infrastructure%29%20Regulations%2C%202026.pdf"},
        {"id": "energy-004", "section": "Regulations", "title": "Electricity (Own Consumption Undertakings Licensing Capacity) Regulations, 2026 (S.I. 126 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-126%20Electricity%20%28Own%20Consumption%20Undertakings%20Licensing%20Capacity%29%20Regulations%2C%202026.pdf"},
        {"id": "energy-005", "section": "Regulations", "title": "Electricity (Minimum Energy Performance Standards for Appliances and Labelling) Regulations, 2026 (S.I. 119 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-119%20Electricity%20%28Minimum%20Energy%20Performance%20Standards%20for%20Appliances%20and%20Labelling%29%20Regulations%2C%202026.pdf"},
        {"id": "energy-006", "section": "Regulations", "title": "Electricity (Licensing) (Amendment) Regulations, 2026 (S.I. 125 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-125%20Electricity%20%28Licensing%29%20%28Amendment%29%20Regulations%2C%202026.pdf"},
        {"id": "energy-007", "section": "Regulations", "title": "Electricity (Energy Management) Regulations, 2026 (S.I. 122 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-122%20Electricity%20%28Energy%20Management%29%20Regulations%2C%202026.pdf"},
        {"id": "energy-008", "section": "Regulations", "title": "Electricity (Electric Vehicle Charging Station Safety) Regulations, 2026 (S.I. 120 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-120%20Electricity%20%28Electric%20Vehicle%20Charging%20Station%20Safety%29%20Regulations%2C%202026.pdf"},
    ],
    "lg": [
        {"id": "lg-001", "section": "Governing law", "title": "Urban Councils Act [Chapter 29:15]",
         "publisher": "Government of Zimbabwe", "date": "Published copy 2023-08",
         "url": V + "Urban%20Councils%20Act%20%20%5BChapter%2029-15%5D.pdf"},
        {"id": "lg-002", "section": "Governing law", "title": "Provincial Councils and Administration Act [Chapter 29:11]",
         "publisher": "Government of Zimbabwe", "date": "Published copy 2021-05",
         "url": V + "Provincial%20Councils%20%26%20Administration%20Act.pdf"},
        {"id": "lg-003", "section": "Regulations", "title": "Rural District Councils and Urban Councils (By-laws) (Repeal), 2026 (S.I. 90 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-090%20Rural%20District%20Councils%20and%20Urban%20Councils%20%28By-laws%29%20%28Repeal%29.pdf"},
        {"id": "lg-004", "section": "Regulations", "title": "Model Fees (Amendment) By-laws, 2026 (No. 1) (S.I. 89 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-089%20Model%20Fees%20%28Amendment%29%20By-laws%2C%202026%20%28No.%201%29.pdf"},
        {"id": "lg-005", "section": "Regulations", "title": "Minimum Service Delivery Standards Indicators for Local Authorities (Amendment) Regulations, 2026 (No. 1) (S.I. 69 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-069%20Minimum%20Service%20Delivery%20Standards%20Indicators%20for%20Local%20Authorities%20%28Amendment%29%20Regulations%2C%202026%20%28No.%201%29.pdf"},
        {"id": "lg-006", "section": "Regulations", "title": "Collective Bargaining Agreement: Rural District Councils Sector (S.I. 34 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-034%20Collective%20Bargaining%20Agreement%20Rural%20District%20Councils%20Sector.pdf"},
    ],
    "env": [
        {"id": "env-001", "section": "Governing law", "title": "Forest Amendment Act, 2021 (Act No. 4 of 2021)",
         "publisher": "Government of Zimbabwe", "date": "2021",
         "url": V + "Forest%20Amendment%20Act%204%20of%202021.pdf"},
        {"id": "env-002", "section": "Governing law", "title": "Parks and Wildlife Amendment Act, 2025 (Act No. 4 of 2025)",
         "publisher": "Government of Zimbabwe", "date": "2025",
         "url": V + "Parks%20and%20Wildlife%20Amendment%20Act%20No.%204%20of%202025.pdf"},
        {"id": "env-003", "section": "Regulations", "title": "Environmental Management (Environmental Liability Polluter Pays) Regulations, 2026 (S.I. 92 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-092%20Environmental%20Management%20%28Environmental%20Liability%20Polluter%20Pays%29%20Regulations%2C%202026.pdf"},
        {"id": "env-004", "section": "Regulations", "title": "Environmental Management (Control of Alluvial Mining) (Amendment) Regulations, 2024 (No. 3) (S.I. 188 of 2024)",
         "publisher": "Government of Zimbabwe", "date": "2024",
         "url": V + "SI%202024-188%20Environmental%20Management%20%28Control%20of%20Alluvial%20Mining%29%20%28Amendment%29%20Regulations%2C%202024%20%28No.%203%29.pdf"},
        {"id": "env-005", "section": "Regulations", "title": "Carbon Trading (General) Regulations, 2025 (S.I. 48 of 2025)",
         "publisher": "Government of Zimbabwe", "date": "2025",
         "url": V + "SI%202025-048%20Carbon%20Trading%20%28General%29%20Regulations%2C%202025.pdf"},
        {"id": "env-006", "section": "Regulations", "title": "Environmental Management (Prohibition and Control of Ozone Depleting Substances, Greenhouse Gases and Dependent Equipment) Regulations, 2023 (S.I. 49 of 2023)",
         "publisher": "Government of Zimbabwe", "date": "2023",
         "url": V + "SI%202023-049%20Environmental%20Management%20%28Prohibition%20and%20Control%20of%20Ozone%20Depleting%20Substances%2C%20Greenhouse%20Gases%2C%20Ozone%20Depleting%20Substances%20and%20Greenhouse%20Gases%20Dependent%20Equipment%29%20Regulations%2C%202023.pdf"},
        {"id": "env-007", "section": "Bill", "title": "Environmental Management Amendment Bill, 2026 (H.B. 5, 2026)",
         "publisher": "Parliament of Zimbabwe", "date": "2026",
         "url": V + "Environmental%20Management%20Amendment%20Bill%2C%202026%20H.B.%205%2C%202026.pdf"},
        {"id": "env-008", "section": "Audit", "title": "Auditor-General's Report on Protection of Wetlands by the Environmental Management Agency",
         "publisher": "Auditor-General of Zimbabwe", "date": "Published copy 2022-02",
         "url": V + "Report%20on%20Protection%20of%20Wetlands%20by%20EMA.pdf"},
    ],
    "zimra": [
        {"id": "zimra-001", "section": "Regulations", "title": "Customs and Excise (General) (Amendment) Regulations, 2026 (No. 130) (S.I. 130 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-130%20Customs%20and%20Excise%20%28General%29%20%28Amendment%29%20Regulations%2C%202026%20%28No.%20130%29.pdf"},
        {"id": "zimra-002", "section": "Regulations", "title": "Customs and Excise (Surtax Tariff) (Amendment) Notice, 2026 (S.I. 84 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-084%20Customs%20and%20Excise%20%28Surtax%20Tariff%29%20%28Amendment%29%20Notice%2C%202026.pdf"},
        {"id": "zimra-003", "section": "Regulations", "title": "Customs and Excise (Suspension) (Amendment) Regulations, 2026 (No. 286) (S.I. 74 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-074%20Customs%20and%20Excise%20%28Suspension%29%20%28Amendment%29%20Regulations%2C%202026%20%28No.%20286%29.pdf"},
        {"id": "zimra-004", "section": "Regulations", "title": "Customs and Excise (Furniture Manufacturer) (Amendment) Regulations, 2026 (No. 1) (S.I. 73 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-073%20Customs%20and%20Excise%20%28Furniture%20Manufacturer%29%20%28Amendment%29%20Regulations%2C%202026%20%28No.%201%29.pdf"},
        {"id": "zimra-005", "section": "Regulations", "title": "Customs and Excise (Printing and Packaging) (Suspension) (Amendment) Regulations, 2026 (No. 1) (S.I. 72 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-072%20Customs%20and%20Excise%20%28Printing%20and%20Packaging%29%20%28Suspension%29%20%28Amendment%29%20Regulations%2C%202026%20%28No.%201%29.pdf"},
        {"id": "zimra-006", "section": "Regulations", "title": "Customs and Excise (Printing and Packaging) (Suspension) Regulations, 2026 (S.I. 36A of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-036A%20Customs%20and%20Excise%20%28Printing%20and%20Packaging%29%20%28Suspension%29%20Regulations%2C%202026.pdf"},
        {"id": "zimra-007", "section": "Regulations", "title": "Customs and Excise (Suspension) (Amendment) Regulations, 2026 (No. 285) (S.I. 36 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-036%20Customs%20and%20Excise%20%28Suspension%29%20%28Amendment%29%20Regulations%2C%202026%20%28No.%20285%29.pdf"},
        {"id": "zimra-008", "section": "Regulations", "title": "Customs and Excise (General) (Amendment) Regulations, 2026 (No. 129) (S.I. 15 of 2026)",
         "publisher": "Government of Zimbabwe", "date": "2026",
         "url": V + "SI%202026-015%20Customs%20and%20Excise%20%28General%29%20%28Amendment%29%20Regulations%2C%202026%20%28No.%20129%29.pdf"},
    ],
}


def download(url: str, path: Path) -> None:
    """Fetch a published file, with a few retries. Re-uses a cached copy when one is present."""
    if path.exists() and path.stat().st_size > 1024:
        return
    last_error = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=180) as response:
                path.write_bytes(response.read())
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


def build_department(department_id: str) -> tuple[list[dict], list[str], list[str]]:
    """Build one department's set. Returns (documents, failures, not_read)."""
    documents: list[dict] = []
    failures: list[str] = []
    not_read: list[str] = []

    for source in SOURCES[department_id]:
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

    return documents, failures, not_read


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the department document libraries.")
    parser.add_argument("--only", default="", help="comma-separated department ids to build")
    args = parser.parse_args()

    wanted = [d.strip() for d in args.only.split(",") if d.strip()] or list(SOURCES)
    unknown = [d for d in wanted if d not in SOURCES]
    if unknown:
        print(f"unknown department id(s): {', '.join(unknown)}", file=sys.stderr)
        return 1

    CACHE.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    any_failure = False
    for department_id in wanted:
        documents, failures, not_read = build_department(department_id)
        if failures:
            print(f"\n{department_id}: THE FOLLOWING LINKS FAILED AND MUST BE NAMED, NOT REPLACED:", file=sys.stderr)
            for failure in failures:
                print(f"  - {failure}", file=sys.stderr)
            any_failure = True
            continue

        payload = {
            "department": department_id,
            "source": "The published documents of this department — its governing law, its sector "
            "policy, the parliamentary committees' reports on it and the audits of it",
            "retrieved": time.strftime("%Y-%m-%d"),
            "documents": documents,
        }
        out = OUT_DIR / f"{department_id}.json"
        out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        readable = sum(1 for document in documents if document["read"])
        print(
            f"\nWROTE {out.relative_to(ROOT)} — {len(documents)} documents, "
            f"{readable} readable, {out.stat().st_size:,} bytes"
        )
        if not_read:
            print("RECORDED AS NOT READ (picture-only scans, named rather than faked):")
            for entry in not_read:
                print(f"  - {entry}")

    if any_failure:
        print("\nNothing was written for the departments above. Fix the addresses and run again.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
