# Let's Make Bangladesh Great

**Public Money. Public Knowledge.**  
**জনগণের অর্থ কোথায় যায়?**

An independent, non-partisan, evidence-led public finance and development atlas for Bangladesh.

## What this project is

The platform is designed to help the public explore:
- Bangladesh's national budget and ministry-level financial information
- Development projects across their full lifecycle
- Delayed, suspended, completed, cancelled and discontinued projects
- Public procurement and contract records
- Official audit reports and documented observations
- Public commitments, including environmental and tree-planting commitments
- Bangladesh's economic, social, education, health, energy and environmental indicators in international context
- Source-linked bilingual explainers and downloadable evidence receipts

## Current website

The first version is a static HTML/CSS/JavaScript site deployed through Cloudflare Pages.

- Production preview: https://letsmakebangladeshgreat.pages.dev/
- Repository: https://github.com/AmarsonarbanglaDEV/letsmakebangladeshgreat

The current interface is a full-screen, Bangladesh-only map workspace. It opens in satellite mode, masks imagery outside Bangladesh using the national boundary, draws selectable administrative outlines, and offers a collapsible public-finance sidebar. Search supports local administrative areas plus submitted place-name searches restricted to Bangladesh. A video-style timeline can play the historical Esri World Imagery Wayback versions available for a selected point. The map now includes a 16-record pilot register (11 Road Transport and Highways Division entries and five completed IMED institutional programmes) and a separate historical research-source catalogue. This is **not** a complete national register: the pilot has no source-verified exact project-site coordinates, so it uses clearly labelled district coverage areas or unresolved records rather than district-centre pins. The FY2026-27 ADP list contains 1,173 projects in an official 88-page report, but those rows have not yet been imported into the main register. Historical imagery begins in 2014 and local availability varies; it is not a complete 15-year record.

## Historical project evidence

The target research period is 1971-2026. See [the research-source register](data/research-source-register.json) for 23 identified sources, temporal coverage notes, limitations, media leads and evidence rules. Important starting points include annual ADP/RADP lists, IMED implementation and completion reports, ERD's foreign-assistance series from FY1971-72, historical General Economics Division plan documents, and agency project/GIS archives such as LGED and BWDB.

The source catalogue is **not** a complete project database. The current FY2026-27 ADP report lists 1,173 projects across 88 pages. The map now imports this PDF at runtime through a same-site cached endpoint, extracts project codes, English titles, Bangla location text and allocations in the browser, then matches the names against the actual division, district, upazila and union names in the map's boundary layers. It prefers the most specific unambiguous map match and uses parent-area wording to disambiguate repeated names. Clustered dots show those administrative-area matches, while unmatched and ambiguous entries are counted separately. These are area locators, not exact work-site coordinates; the ADP PDF does not publish surveyed site coordinates or a per-project lifecycle status. The runtime parser is not yet a static 1,173-row JSON export. ERD's long-run aid tables are aggregate financial series, not named-site project records. Historic project statuses and precise locations must be reconstructed record by record from approval documents, agency project pages, completion/evaluation reports, procurement records, GIS/route files and dated media coverage. News and media are used as research leads and corroboration, not as sole proof of a project's cancellation, completion, expenditure or exact coordinates.

Map location rules: surveyed site coordinates may be shown as exact pins; official route geometry may be shown as lines; chainage, site names, upazila/district and national coverage must retain their true precision; conflicting or unlocated entries remain unresolved. A clicked crosshair is only a temporary satellite-imagery lookup point, not a government project pin.

## Interface design

The public map uses an independently implemented, Bangladesh-themed adaptation of a map-first atlas interface, informed by [Hisaab](https://github.com/theadiram/Hisaab). The layout keeps the map as the main canvas, with floating navigation, contextual evidence panels and compact map controls. See [third-party notices](THIRD_PARTY_NOTICES.md) for attribution and licensing information.

## Evidence principles

1. An allocation is not an expenditure.
2. A transfer is not proof of a project payment.
3. A project delay is not proof of wrongdoing.
4. An audit observation is not automatically a finding of criminal wrongdoing.
5. Official completion is distinct from independent physical verification.
6. A reported sapling planted is not a tree independently confirmed to have survived.
7. Missing data stays unknown.
8. Every published figure needs a traceable source, reporting period, unit and review status.

Read:
- [Project blueprint](docs/PROJECT_BLUEPRINT.md)
- [Data governance and publication policy](docs/DATA_GOVERNANCE.md)
- [Data model](docs/DATA_MODEL.md)
- [Roadmap](docs/ROADMAP.md)

## Technology

Current prototype:
- HTML
- CSS
- Vanilla JavaScript
- Leaflet interactive map library with a CDN fallback
- Bangladesh ADM0 national mask / outline, plus switchable division, district, upazila, union and available-ward boundary layers
- Official DGHS GIS / BBS ADM0, ADM1 and ADM2 layers, BBS 2022 upazila layer, DGHS All_Union and All_Wards_main layers; geoBoundaries gbOpen is a fallback where available
- Esri World Imagery satellite tiles, clipped to the Bangladesh polygon, with a separate outline-only mode
- Esri World Imagery Wayback point lookup, date slider and playback for available local archive versions (2014 onward)
- Search for administrative areas in the loaded layer and search for other places in Bangladesh via OpenStreetMap Nominatim, only after form submission (no autocomplete)

Not yet implemented:
- Verified government financial / project database and area-to-project relationships
- Ministry / agency / budget / audit / procurement record imports and review workflow
- Upazila / union / ward browser validation and coverage review

Planned capabilities:
- PostgreSQL / Supabase for structured records
- MapLibre and PMTiles for scalable geographic layers
- Python for controlled data extraction and validation
- Automated tests and publication gates
- A separate protected owner console

Do not add credentials, private evidence, personal information or populated environment files to this public repository.

## Run locally

No build step is required for the current static prototype. Open `index.html` in a browser, or run a local server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

An internet connection is required for Leaflet, administrative boundary services, Esri satellite tiles, Wayback imagery and place search. Search text is sent to the public OpenStreetMap Nominatim service only when a visitor submits the form; do not enter personal or confidential information. The code avoids autocomplete and spaces queries by at least 1.1 seconds to respect the public service's published use policy. The Mouza / land-map link opens the official settlement portal; a complete national village / mouza polygon layer is not integrated.

## Contributing

Before adding data:
1. Identify the original source and its publication date.
2. Preserve the original unit, fiscal year and reporting period.
3. Record the page, table or dataset reference.
4. Check for duplicates and conflicting versions.
5. Distinguish reported, extracted, reviewed and independently corroborated information.
6. Do not publish private, restricted or unlicensed material.
7. Never publish allegations as established facts.

See the data governance document before proposing public records.

## Project status

The website foundation is in prototype stage. Public release of financial and project records remains blocked until evidence collection, review, privacy checks and publication approval are implemented.
