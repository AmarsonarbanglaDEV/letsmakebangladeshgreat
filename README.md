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

The current interface is a full-screen, Bangladesh-only map workspace. It opens in satellite mode, masks imagery outside Bangladesh using the national boundary, draws selectable administrative outlines, and offers a collapsible public-finance sidebar. Search supports local administrative areas plus submitted place-name searches restricted to Bangladesh. A video-style timeline can play the historical Esri World Imagery Wayback versions available for a selected point. This is still a prototype: the government-finance sidebar is structured but does **not** yet contain a verified project, payment, funding or indicator database. Historical imagery begins in 2014 and local availability varies; it is not a complete 15-year record.

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
