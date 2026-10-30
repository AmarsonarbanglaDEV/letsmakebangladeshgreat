# Initial Data Model

This document is a planning schema, not a deployed database migration. Field names can be refined after the first source datasets are reviewed.

## Shared conventions

Every source-backed record should carry:
- id (stable UUID or public ID)
- source_id
- source_published_at
- source_accessed_at
- source_page_or_table
- reporting_period
- fiscal_year_id, where applicable
- unit and currency, where applicable
- evidence_status
- reviewed_at
- created_at and updated_at

Use PostgreSQL NUMERIC for money. Preserve the original reported amount and unit. Store source timestamps and reporting periods explicitly.

## Reference tables

### fiscal_years
- id
- label (e.g. FY 2025-26)
- start_date
- end_date
- official_source_id

### ministries
- id
- official_name_en
- official_name_bn
- official_website
- active_from
- active_to

### agencies
- id
- ministry_id
- official_name_en
- official_name_bn
- official_website

### sectors
- id
- name_en
- name_bn
- parent_sector_id

### administrative_areas
- id
- area_type (division, district, upazila, union, city_corporation, municipality)
- official_name_en
- official_name_bn
- parent_area_id
- geometry_source_id
- boundary_version
- geometry_precision_note

## Finance

### funding_facts
Use for source-backed funding facts that cannot safely be treated as a transaction.
- id
- subject_type
- subject_id
- amount
- currency
- original_unit
- fact_type (allocation, revised_allocation, target, transfer, release, award, reported_expenditure)
- fiscal_year_id
- reporting_period
- accounting_level
- notes

### expenditure_records
- id
- project_id, nullable when record is not project-specific
- agency_id
- amount
- currency
- original_unit
- expenditure_type
- transaction_or_period_date
- reporting_period
- source_id
- reconciliation_status

Do not load cumulative snapshots as transactions.

## Projects and assets

### development_projects
- id
- official_reference_number
- title_en
- title_bn
- ministry_id
- implementing_agency_id
- sector_id
- programme_id
- location_area_id
- latitude
- longitude
- coordinate_precision
- original_approved_cost
- currency
- original_start_date
- original_completion_date
- current_status
- operational_status
- evidence_status

### project_revisions
- id
- project_id
- revision_number
- revision_type
- revised_cost
- revised_start_date
- revised_completion_date
- approval_date
- source_id
- change_reason_as_reported

### project_updates
- id
- project_id
- reported_at
- physical_progress_percent
- financial_progress_percent
- completion_claim
- operational_note
- source_id
- review_status

### public_assets
- id
- asset_type
- title_en
- title_bn
- location_area_id
- latitude
- longitude
- coordinate_precision
- linked_project_id
- reported_opening_date
- operational_status
- source_id

## Procurement and audit

### procurement_records
- id
- tender_reference
- title
- procuring_entity
- project_id
- method
- publication_date
- award_date
- awarded_amount
- currency
- supplier_name_as_published
- source_id

### audit_reports
- id
- institution
- title
- publication_date
- reporting_period
- document_url
- source_id

### audit_findings
- id
- audit_report_id
- page_reference
- audited_entity
- project_id
- amount_as_reported
- currency
- observation_summary
- government_response
- follow_up_status
- source_id

## Public commitments and environment

### public_promises
- id
- exact_wording
- language
- plain_language_summary
- responsible_ministry_id
- announcement_date
- target_date
- measurable_target
- unit
- source_id
- current_status

### promise_updates
- id
- promise_id
- update_date
- progress_value
- unit
- status
- evidence_note
- source_id

### plantation_records
- id
- programme_name
- plantation_site
- location_area_id
- latitude
- longitude
- species
- planting_date
- reported_sapling_count
- independently_checked_count
- source_id
- review_status

### tree_survival_checks
- id
- plantation_record_id
- inspection_date
- inspected_count
- surviving_count
- method
- inspection_source_id
- reviewer_note

## Global indicators

### indicator_definitions
- id
- name
- topic
- definition
- unit
- preferred_source
- methodology_url

### indicator_observations
- id
- indicator_id
- country_code
- value
- unit
- reference_period
- publication_date
- observation_type (observed, estimated, projected)
- rank
- rank_universe
- source_id

## Sources and changes

### sources
- id
- institution
- title
- original_url
- document_type
- publication_date
- access_date
- source_version
- checksum
- rights_status
- source_notes

### data_revisions
- id
- table_name
- record_id
- revision_type
- previous_value_summary
- new_value_summary
- reason
- source_id
- reviewer
- revision_date

## Important relationships

- Projects may relate to many revisions, updates, contracts, audit findings and sources.
- A public asset may link to a project, but it may also exist without a project match.
- A funding fact may relate to a ministry, agency, programme or project, but the accounting level must be explicit.
- A promise may relate to multiple project records; do not sum overlapping programmes without reconciliation.
- Plantation records and survival checks are distinct datasets.
- Historical locations must not be treated as payment or expenditure records.

## Not included in this first schema

Private reports, encrypted attachments, capability links, administrator membership, secrets, MFA configuration and private tracking require a separate security design and migrations. Do not implement them as public tables or public APIs in the static prototype.
