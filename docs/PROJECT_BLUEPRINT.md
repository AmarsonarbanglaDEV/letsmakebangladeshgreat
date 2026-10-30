# Project Blueprint

## 1. Mission

Let's Make Bangladesh Great is an independent, non-partisan, evidence-led public finance and development atlas for Bangladesh. It should make public information easier to find, understand, compare and trace to original records.

The platform is an information and research tool. It does not determine guilt, assign political verdicts or replace official oversight institutions.

## 2. Public exploration model

The public experience has three principal exploration screens:

### A. Bangladesh Map Workspace
- Make the map the whole public interface; remove the separate long homepage as the main navigation surface.
- Open on Esri World Imagery satellite tiles. A national ADM0 polygon masks imagery outside Bangladesh; the map's pan bounds stay within Bangladesh. If the country mask and documented fallbacks fail, disable satellite display rather than leave neighbouring countries visible as part of the product.
- Draw a clear country outline, with selectable boundary levels for Division (8), District (64), Upazila, Union and available Ward polygons.
- Fetch the authoritative layer metadata first and use its actual object-ID field for paginated queries. Do not hard-code `OBJECTID`: the BBS ADM1 / ADM2 layers expose a `fid` identifier field.
- Use BBS / DGHS ADM0, ADM1 and ADM2 layers; BBS 2022 Upazila Boundary layer; DGHS All_Union and All_Wards_main; geoBoundaries gbOpen (CC BY 4.0) as a documented fallback when a layer is unavailable.
- Display the actual feature count returned by each source. Do not imply the headline total is complete when coverage or matching is partial. A ward is not the same as a village or mouza.
- Provide a map search for addresses and place names limited to Bangladesh. The current prototype searches local administrative records first, then submits the search phrase to OpenStreetMap Nominatim on Enter only; do not implement Nominatim autocomplete and respect its public rate limit and attribution.
- Provide a collapsible sidebar for Area Overview, Budget, Ministries, Projects / ADP, Procurement, Audit, Environment, Indicators and Sources. These are information panels, not proof that financial data is already imported.
- Keep map zoom, fit-to-Bangladesh, satellite / outline mode and focus-to-selected-area controls.
- Point selection on the map opens a point-based Esri World Imagery Wayback history search. Provide a slider and playback for the local archive versions returned for that point and zoom.
- The Wayback archive begins in 2014; availability and imagery capture dates vary by place. It is not a continuous 15-year dataset. Display the archive release date separately from image acquisition date / provider / resolution metadata when the provider supplies it.
- Keep Esri imagery attribution and boundary-source / dataset notes visible.

A location marker or a satellite image is not proof that money was spent at that point. Transfers, budget allocations and project expenditure must not be conflated.

Historical imagery is visual context only. It may help identify visible land-use or construction changes, but it cannot establish corruption, intent, contract values, payment, quality, ownership or misuse of public money. Compare imagery dates with project approval and completion schedules, procurement records, audited expenditure, official responses and independent site evidence.
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

The current site is a map-first static prototype. Its satellite basemap is clipped to Bangladesh using an ADM0 country polygon, and the national outline / division / district / optional deeper administrative layers are drawn from documented GIS services. A dynamic metadata lookup discovers each service's object-ID field to avoid a failed query caused by assuming OBJECTID. The sidebar contains structured finance, ministries, projects, procurement, audit, environment, indicators and source panels, but these are intentionally unpopulated until verified records are imported. Nominatim search runs only after form submission and is restricted to Bangladesh. Wayback playback shows only the local archive versions available for the selected point; it does not constitute a complete 15-year record. Administrative boundaries and imagery are geographic context, not project locations or proof of expenditure.

A private owner console, authenticated submissions, database, evidence storage and publication system are future work and must not be represented as operational until implemented and tested.
