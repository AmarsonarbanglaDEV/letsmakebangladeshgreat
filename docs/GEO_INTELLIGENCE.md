# Geo-Intelligence & Grievance Module

## Integration

The feature is a separate route at \`/geo-intelligence.html\`. The existing atlas is not replaced. The page reuses the same-origin \`/api/map\` administrative-boundary endpoint and existing Leaflet-based mapping approach.

## Current capabilities

- Esri World Imagery, OpenStreetMap street tiles and Esri World Topographic tiles.
- Click-to-select coordinates, a neon marker, a visual connector and shareable coordinate URL.
- Reverse geocoding through OpenStreetMap Nominatim after a deliberate map click (no autocomplete).
- Administrative context is populated only from returned address fields. Missing fields remain unavailable.
- Government offices are presented as potential jurisdiction categories with links to official directories; individual office contacts are not invented.
- Complaint and Right to Information letter drafting; these drafts are not submitted to a government authority.
- Private complaint intake API with validation, a one-hour per-IP-hash limit and no public listing/read endpoint.
- Private file attachment storage through an R2 bucket, with MIME and file-signature checks.

## Required Cloudflare configuration before enabling submissions

Create a D1 database and apply \`migrations/0001_geo_grievances.sql\`. Add the D1 binding named \`COMPLAINTS_DB\` to the Pages project for both Preview and Production.

Create a **private** R2 bucket and add the binding \`COMPLAINTS_BUCKET\`. Do not enable public bucket access or expose object keys through a public endpoint.

Add a random secret environment variable named \`GEO_RATE_LIMIT_SALT\` in Cloudflare Pages. Keep it private and rotate it if exposed.

Add a Cloudflare WAF/rate-limiting rule for \`POST /api/grievances\` and review the threshold for expected legitimate traffic. The application additionally limits each hashed client address to five submissions per UTC hour. The hash salt is required; the API fails closed if it is missing.

Deploy the feature branch only after the D1 migration and bindings are configured. Without D1, the endpoint returns a clear 503 and does not pretend that a report was submitted. Without R2, text-only reports can be accepted; file attachments are rejected with a clear message.

## Private operations and retention

There is deliberately no public GET endpoint for reports or attachments. Access reports through authenticated Cloudflare D1/R2 administration with least-privilege access. Before collecting real citizen reports, define a named review team, retention period, deletion/correction process, incident response and a privacy notice. Do not expose complainant contact details in public project profiles. Add a separate authenticated staff workflow before operational use.

Village / para labels come from reverse-geocoding results where available; a complete nationwide village / mouza polygon or cadastral layer is not integrated. The administrative boundary point lookup uses the existing BBS/DGHS-backed map services where they respond; missing or ambiguous matches remain unavailable rather than being guessed.\n\nThe current public form does not represent an official government grievance channel and does not issue an official government case number. It only returns a platform reference after private storage succeeds.

## Geographic accuracy

Reverse geocoding is approximate. It can return the nearest mapped feature, not necessarily the exact building at the clicked coordinate. It is not evidence of land ownership, cadastral boundaries or legal jurisdiction. BBS/DGHS administrative boundary layers are loaded through the existing same-origin map API when the user enables the overlay. The returned page can be limited by source pagination and source availability; never label incomplete geometry as a complete cadastral or village map.

## Known limits

- The public map page currently uses external tile/geocoding services; their availability and terms apply.
- Individual union/ward office names, postal codes and contacts are shown only when actually returned or confirmed from official sources.
- This module does not yet deliver complaints to an official government portal or provide a staff case-management console.
- A production grievance service needs a privacy notice, retention policy, operational owner and security review before public launch.
