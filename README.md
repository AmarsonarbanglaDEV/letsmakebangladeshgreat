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

The current interface is a prototype. It does **not** yet contain a verified project, payment, funding or indicator database. Empty states are intentional; no project or financial figures are fabricated to populate the design.

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
- Leaflet map library via CDN
- Bangladesh eight-division boundary polygons from the DGHS GIS Feature Service (BBS ADM1 dataset)

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

An internet connection is required for the Leaflet library and Bangladesh division boundary service.

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
