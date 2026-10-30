# Development Roadmap

## Stage 0 — Repository and static foundation
- [x] Create a GitHub repository.
- [x] Connect repository to Cloudflare Pages.
- [ ] Publish reviewed website foundation.
- [ ] Add accessibility and mobile checks.
- [ ] Add a privacy and contact policy before collecting submissions.

## Stage 1 — Map-first atlas interface
- [x] Replace the scrolling homepage with a full-screen Bangladesh map workspace.
- [x] Default to Esri satellite imagery, bounded to Bangladesh and masked by a national outline polygon.
- [x] Add a documented fallback chain for the national mask; disable satellite view rather than show neighbouring countries if no reliable mask can load.
- [x] Fix ArcGIS query ordering by reading each service's actual object-ID field from metadata (including `fid` on BBS ADM1 / ADM2 layers).
- [x] Add switchable Division, District, Upazila, Union and available Ward map levels.
- [x] Add map zoom, fit-Bangladesh, satellite / outline controls and zoom-aware feature labels.
- [x] Add a collapsible government-information sidebar with Overview, Budget, Ministries, Projects, Procurement, Audit, Environment, Indicators and Sources sections.
- [x] Add Bangladesh place search, local administrative-name matching and submit-only Nominatim lookup.
- [x] Add point selection and a video-style slider / playback for local Esri World Imagery Wayback versions.
- [ ] Browser-validate ADM0 mask geometry, all boundary query pagination, actual feature counts, name matching and map outline at desktop / mobile sizes.
- [ ] Browser-validate Esri satellite tile attribution, mask clipping, Wayback tile switching and capture metadata.
- [ ] Browser-validate Nominatim search and the public usage-policy / privacy notice.
- [ ] Populate the sidebar only after source extraction, review and publication approvals.
- [ ] Preserve a versioned copy of the administrative boundary datasets and provenance.
- [ ] Add verified project / finance / asset layers only after the data model and review gates are implemented.

## Stage 2 — Source inventory
- [ ] Inventory national budget documents by fiscal year.
- [ ] Inventory ADP and RADP documents.
- [ ] Inventory IMED reports.
- [ ] Inventory CAG audit reports.
- [ ] Inventory BPPA / e-GP public procurement sources.
- [ ] Inventory BBS national statistics.
- [ ] Inventory international indicator providers.
- [ ] Inventory tree-planting commitment sources and follow-up records.
- [ ] Record source rights, access method and update frequency.

## Stage 3 — Evidence and project catalogue
- [ ] Define project identity matching rules.
- [ ] Create source and project schemas.
- [ ] Import a small, manually reviewed pilot dataset.
- [ ] Reconcile project cost revisions and schedules.
- [ ] Implement lifecycle status history.
- [ ] Separate delayed, suspended, cancelled, terminated, discontinued and abandoned statuses.
- [ ] Add coverage reporting and missing-update state.

## Stage 4 — Public finance
- [ ] Import selected fiscal-year budget tables.
- [ ] Separate original, revised and actual values.
- [ ] Define ministry, agency and sector mappings.
- [ ] Import expenditure only with an explicit accounting basis.
- [ ] Add CSV export and data dictionary.

## Stage 5 — Public procurement and audit
- [ ] Index procurement notices and awards from authorized sources.
- [ ] Link procurement packages to projects where identifiers support the match.
- [ ] Index audit reports and page references.
- [ ] Add government-response and follow-up tracking.

## Stage 6 — Promise and tree trackers
- [ ] Select official public commitments with measurable targets.
- [ ] Preserve exact promise wording and source.
- [ ] Reconcile overlapping tree-planting programmes.
- [ ] Separate reported planting from verified survival.
- [ ] Add documented follow-up inspections.

## Stage 7 — Bangladesh in the world
- [ ] Define comparable indicators and preferred sources.
- [ ] Record observation period, publication date and methodology.
- [ ] Distinguish observed, estimated and projected values.
- [ ] Add historical charts and same-year comparisons where possible.

## Stage 8 — Private administration and publication controls
- [ ] Design protected owner membership and MFA.
- [ ] Define source storage and access controls.
- [ ] Implement review queues and role permissions.
- [ ] Implement publication approvals and withdrawal.
- [ ] Add data revision history and audit logs.
- [ ] Security test all public APIs and storage access.
- [ ] Keep public release blocked until release gates pass.

## Stage 9 — Public launch
- [ ] Independent data-quality review.
- [ ] Source-rights and privacy review.
- [ ] Security review.
- [ ] Accessibility and mobile review.
- [ ] Correction process tested.
- [ ] Release audit passed.
- [ ] Owner approval recorded.

## Release rule

A checked box means the capability has actually been implemented and tested. Planned work must remain unchecked. A demo card is not a live data record.
