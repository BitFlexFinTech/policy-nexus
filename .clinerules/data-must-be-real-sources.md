# DATA MUST COME FROM REAL, NAMED, PUBLISHED SOURCES — NO INVENTED FIGURES

> **THE OWNER'S DECISION (2026-10-04): *"We want REAL sources."*** This rule was **missing from every rules
> folder** — the decision lived only in chat and a status note, which is exactly why it kept being
> re-litigated across sessions. It is written here now, in every location the runtime reads, so it can never
> come back.

## The rule

Every figure the platform shows as evidence — a stakeholder-group share, a reference indicator, a rate, any
number presented as a fact about the country — **must come from a real, named, published source**, cited on
screen: **the body that publishes it, the publication, and the period**.

- **No invented figures. Ever.** A number with no source is not permitted, whatever it is called.
- **"Modelled" is NOT an escape hatch for a placeholder.** A made-up number labelled "Modelled" is still a
  made-up number. If it has no method and no source, it does not belong in the platform.
- **Where a measure has no published source, REPLACE THE MEASURE** with one that does. Do not invent a value,
  and do not keep an unsourced one.

## The one permitted distinction — evidence versus projection

- **The evidence base (inputs)** — how many people are in a group, a literacy rate, a debt ratio — is
  **real and cited**.
- **A simulation's output** — how stakeholders are modelled to react, what impacts are projected — is
  **inherently modelled**, because it is a projection of something that has not happened. It must be
  **plainly labelled as simulated**, and it is the ONLY place the word "modelled" may appear.

So: **real data in, clearly-labelled simulated output out.** Never a real-sounding figure with nothing behind
it.

## How to satisfy it

1. Research the real figure from a named source — ZIMSTAT (census and surveys), the Reserve Bank of Zimbabwe,
   the World Bank, the line ministries, WHO / UNICEF / UNESCO / ITU / UN Comtrade.
2. Cite it on screen: publisher, publication, period.
3. If no source exists for a measure, replace the measure with one that has a source.
4. Never present a projection as measured fact, and never present an invention at all.

## How it is enforced

`PROJECT_STATUS.md` carries this as a **locked constraint**, and the platform's own validator fails if a
figure lacks a named source. A "temporary" or "demo" figure is **not** an exception — it is the defect this
rule exists to stop.

## Finding a figure — try every door, never just one (added 2026-10-05)

> **The defect this exists for:** a session reported that no new publisher could be found because
> **FAOSTAT, UNCTAD, ITU, AfDB, UNAIDS and UNdata did not answer their API**, and it wrote each body off
> after **one** method. That is not a search. When WHO's and UNESCO's own **OData/API** doors and the
> **IMF DataMapper** were later tried they answered; and ZIMSTAT, POTRAZ and the regulators — reachable all
> along — were never opened at all. Calling "no source exists" after one failed attempt is the same class of
> error as inventing a figure.

Before a publisher is called unavailable, **every door below must be tried, and the attempts recorded**:

1. **JSON API** — a web address that returns numbers as text (e.g. the World Bank API).
2. **OData / SDMX API** — a *different* data address the same body may run (e.g. the WHO Global Health
   Observatory's OData host; the UNESCO UIS API with a country parameter).
3. **Bulk download** — one ZIP/CSV of everything, instead of one indicator at a time.
4. **The document itself** — read the body's own report, census table or statistical release (PDF/XLSX) and
   take the figure; many national bodies publish this way and nothing else.
5. **A registry or regulator list** — the body that *counts* the thing being measured (a telecoms regulator
   for subscriber counts, an insurance-and-pensions regulator for pension funds, a companies registry for
   business types).
6. **An aggregator that names the origin** — a compiler such as Our World in Data or the IMF DataMapper may
   be used to LOCATE a number, but the figure must be **cited to the original body it names**, never to the
   compiler.

**Not only online:** a figure held by another ministry, a published Act or a printed report counts too — the
test is that it is real, named and citable, not that it came from a web address.

**Only when all six have genuinely been tried** may a source be reported as unavailable — and the report
must **list which doors were tried and what each said**, so the next session can tell a real dead end from an
untried one. "I could not find it" is never acceptable after one attempt.
