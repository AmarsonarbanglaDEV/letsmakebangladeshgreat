# Project Blueprint

## 1. Mission

Let's Make Bangladesh Great is an independent, non-partisan, evidence-led public finance and development atlas for Bangladesh. It should make public information easier to find, understand, compare and trace to original records.

The platform is an information and research tool. It does not determine guilt, assign political verdicts or replace official oversight institutions.

## 2. Public exploration model

The public experience has three principal exploration screens:

### A. Bangladesh Atlas
- A Bangladesh-only administrative map showing either the eight division polygons or all 64 district polygons; do not show surrounding countries or a global basemap in this view.
- A visible Division / District level switch, with all 64 districts listed and searchable in English and Bangla.
- Each district polygon receives its own stable, distinct display colour, and its official name is available in the directory and map tooltip.
- Zoom in, zoom out and fit-Bangladesh controls, plus focus-to-area when a division or district is selected.
- Division boundaries from the DGHS GIS Feature Service using the BBS ADM1 administrative-boundary dataset; district boundaries from the matching BBS ADM2 administrative-boundary dataset.
- Optional Division, District, Upazila, Union and available Ward map levels. The current prototype uses the BBS 2022 upazila boundary layer, DGHS All_Union polygon service and DGHS All_Wards_main service; show actual returned coverage rather than assuming a headline total.
- A separate Mouza / land-record link to the official settlement portal. Do not treat a ward as a village or mouza, and do not draw national village boundaries until a documented, licensed dataset is available.
- Satellite basemap toggle using Esri World Imagery.
- Point selection on the map and a local historical imagery timeline using Esri World Imagery Wayback versions where available. The archive starts in February 2014, so it does not provide a complete 15-year sequence.
- Separate toggles for funding facts, projects, public assets, historical locations, audit observations and environment records.
- Search by project, administrative area, ministry, agency and source.
- Map features must identify their geometry source, dataset date, precision and limitations. Historical imagery must identify the archive version, local capture date if known, provider and pixel resolution where metadata is available. The initial map is restricted to Bangladesh and uses no world basemap.

A location marker is not proof that money was spent at that point. Transfers, budget allocations and project expenditure must not be conflated.

Historical imagery is visual context only. It may help identify visible land-use or construction changes, but it cannot establish corruption, intent, contract values, payment, quality, ownership or misuse of public money. Compare imagery dates with project approval and completion schedules, procurement records, audited expenditure, official responses and independent site evidence. Wayback basemap release dates are not necessarily the local image acquisition dates; display acquisition metadata separately when the provider supplies it.

### B. Division / District Development Card
Each administrative profile may show:
- Name in English and Bangla.
- Administrative hierarchy and source-linked geography.
- Population and area with reference year.
- Funding and allocation facts with accounting level clearly stated.
- Projects whose documented location falls within the area.
- Public assets and environmental records.
- Audit references.
- Coverage gaps and last review date.

Do not calculate a local expenditure total from national, ministry or transfer-level data.

### C. Project / Public Asset Receipt
Each reviewed project or asset receives a stable public identifier and a source-linked record:
- Official title and reference number.
- Ministry and implementing agency.
- Sector and programme.
- Location and coordinate precision.
- Approved original cost and revisions.
- Annual allocations and reported expenditure as separate fields.
- Financing sources and units.
- Start date, original deadline, revised deadlines and reported completion.
- Physical progress and financial progress, each with source and reporting date.
- Contract packages and procurement references.
- Operational status.
- Audit references and published government responses.
- Source history, review history and corrections.

A receipt must not be created solely from a historical map point.

## 3. Project lifecycle taxonomy

Use explicit, evidence-backed statuses:
- Proposed
- Under appraisal
- Approved
- Approved, not started
- Ongoing
- Delayed
- Under revision
- Suspended
- Partially implemented
- Officially completed
- Operational
- Partially operational
- Officially cancelled
- Officially terminated
- Discontinued
- Abandoned (only where authoritative evidence supports the term)
- Status unconfirmed
- No recent public update

Do not infer abandonment from silence. Missing updates should have their own status.

Keep the event history so users can see how and when a status changed.

## 4. Development sectors

Support at minimum:
- Transport: roads, bridges, tunnels, rail, ports, airports and public transit
- Energy: generation, transmission, distribution, fuel and renewables
- Health: hospitals, clinics, equipment and public health programmes
- Education: schools, colleges, universities, training and research
- Water, sanitation, drainage and flood management
- Agriculture, irrigation, fisheries and rural development
- Housing, urban development and public buildings
- Digital infrastructure and public services
- Industry and economic zones
- Environment, forests, biodiversity and climate adaptation
- Social protection and community infrastructure
- Local government and regional development

## 5. Public-money explorer

Track separately:
- National budget allocations
- Revised allocations
- Reported actual expenditure
- Revenue targets and collections
- Operating expenditure
- Development expenditure
- ADP and RADP records
- Ministry and agency allocations
- Project approvals and revisions
- Fund releases and transfers
- Contract award values
- Reported project expenditure

Every value must retain currency, unit, accounting basis, fiscal year and reporting period. Do not sum incompatible financial events or treat cumulative snapshots as new transactions.

## 6. Stalled and discontinued projects

Provide dedicated views for delayed, suspended, cancelled, terminated, discontinued and documented abandoned projects.

For each record show:
- Original and revised cost
- Original and revised dates
- Last known official update
- Reported financial and physical progress
- Completed and incomplete components
- Officially published explanation
- Current operational status
- Related procurement and audit documents
- Latest response and source

Cost escalation and delays are observations, not proof of misconduct.

## 7. Public commitments and promise tracker

Index measurable commitments from official budget speeches, policy documents, approved plans and official programme announcements.

For each promise record:
- Exact original wording and language
- Source, page and announcement date
- Responsible ministry and agency
- Target date and measurable target
- Funding linkage, if documented
- Subsequent official updates
- Outcome evidence
- Missing information
- Current status and review date

Statuses include announced, planned, approved, funded, started, in progress, delayed, revised, reported complete, independently verified outcome, cancelled and unknown.

Do not assign political scores or rankings to administrations or public figures.

## 8. Tree and environmental commitment tracker

Track national and programme-level planting commitments with separate counts for:
- Saplings reported planted
- Planting sites documented
- Planting independently checked
- Trees verified as surviving
- Replanting
- Missing survival follow-up

Each plantation record should identify location, species, planting date, programme, responsible entity, reported count, source, checks and follow-up dates.

Do not assume a reported planting count equals surviving trees. Reconcile overlapping programmes before calculating national totals. Keep One Tree, One Child and other programmes identifiable rather than double-counting them.

## 9. Bangladesh in the world

Organize international indicators by:
- Economy and public finance
- Poverty, inequality and employment
- Human development
- Education and research
- Health
- Energy
- Environment and climate
- Governance and institutions
- SDG progress
- Digital access and infrastructure

Each observation must contain the exact indicator, value, unit, reference period, publication date, source, methodology, population coverage and whether it is observed, estimated or projected. Country comparisons must use comparable years and definitions.

## 10. Public procurement

Index tender notices and awarded contracts only from authorized public sources. Store procuring entity, tender reference, dates, procurement method, awarded amount, supplier when officially published, contract period, packages, amendments, project relationship and original sources.

A high contract value, repeated supplier or amendment is not by itself evidence of wrongdoing.

## 11. Evidence and panels

Public detail panels may contain programme evidence, documented roles, sources, observations, correction history and review status.

Private case tracking, confidential notes, personal details and restricted originals belong only in the protected owner console.

## 12. Current implementation boundary

The current site is a static prototype. The Bangladesh map can switch between division polygons from the DGHS GIS Feature Service (BBS ADM1 dataset) and 64 district polygons from its BBS ADM2 dataset. The district directory includes English and Bangla names, individual display colours, search and zoom/focus controls. These boundaries are geographic reference data, not project locations or evidence of expenditure. The project, funding, tree, global-indicator and audit sections intentionally show no published records until a verified dataset exists.

A private owner console, authenticated submissions, database, evidence storage and publication system are future work and must not be represented as operational until implemented and tested.
