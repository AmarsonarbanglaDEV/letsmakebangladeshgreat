# Bangladesh Progress & Promise Tracker — data guide

This document describes the JSON register consumed by **Progress & Promises** in the Bangladesh Atlas.

## Files

- `data/government-promises.json` is the source register.
- Populate it only with commitments that can be linked to an original source.
- Keep an update history rather than silently overwriting a previous evaluation.

## Root structure

```json
{
  "schemaVersion": "1.0.0",
  "coverage": {},
  "methodology": {},
  "statusDefinitions": [],
  "sectors": [],
  "governments": [],
  "promises": [],
  "achievements": [],
  "evidence": []
}
```

## Government period

Each `governments[]` record should contain:
`id`, `name`, `party` (when relevant), `startDate`, `endDate`, `governmentType`, `sources[]`.

Use a stable identifier. Avoid a shortened nickname where it could cause ambiguity.

## Promise record

Required identity and provenance fields:

- `id`, `title`, `originalText`
- `governmentId`, `announcedDate`, `sourceIds[]`
- `sector`, `status`, `lastEvaluatedAt`

Recommended fields:

- `englishTranslation`, `banglaTranslation`
- `responsibleMinistry`, `responsibleDepartment`
- `geography[]` (type, name; only add coordinates for an exact, source-backed site)
- `target` (description, value, unit, baseline, targetDate)
- `successCriteria[]`
- `progress` (method, completedValue, targetValue, unit, verifiedAt, evidenceIds[])
- `milestones[]` (id, title, status, completedAt, evidenceIds[])
- `evidenceIds[]`, `officialResponse`, `updateHistory[]`
- `relatedProjectIds[]`, `budgetReferences[]`, `procurementReferences[]`

Supported status values:
`fulfilled`, `partially_fulfilled`, `in_progress`, `not_started`, `delayed`,
`cancelled_withdrawn`, `insufficient_evidence`, `under_review`.

## Evidence record

Each `evidence[]` record should have:
`id`, `title`, `issuer`, `url`, `publicationDate`, `evidenceType`,
`verificationStatus` (`verified`, `reviewed`, `unverified`),
`lastCheckedAt`, and optionally `pageOrSection`, `excerpt`, `relatedPromiseIds[]`.

Never mark a source verified only because it is an official-looking URL. Record the exact page, table or section that supports the claim.

## Achievement record

Each `achievements[]` entry needs a title, sector, description, target, verified result,
completion date, geography and `evidenceIds[]`. The UI only displays a verified achievement badge
when at least one linked evidence record is marked `verified`.

## Progress calculation

1. Numeric: `round(min(100, completedValue / targetValue * 100))`; target must be greater than zero.
2. Milestones: completed milestones with verified evidence / all pre-defined milestones.
3. Do not interpolate from announcements, budget allocation, project listing or subjective judgement.
4. If the calculation cannot be reproduced from the stored fields and linked evidence, leave progress blank.
5. Status remains a human-reviewed classification and must have a dated update-log entry.

## District map

A district association is not an exact project-site coordinate. Use `geography[]` to list areas, and add
`latitude`, `longitude`, `locationPrecision: "site"` only when an original record supports the exact site.
The map must not invent a marker at the district centroid and call it the project location.

## Neutrality and corrections

- Do not aggregate different governments into an unlabeled number.
- Do not create political popularity rankings or one overall party score.
- Separate allocation, release, expenditure, physical output and public outcome.
- Keep original wording, translations, reviewer notes and historical corrections.
- No evidence found is not equivalent to not started or cancelled.

## Evidence search coverage is separate from promise status

A promise may include an `evidenceAssessment` object:

- `status: "implementation_evidence_found"`: at least one reviewed source documents implementation evidence.
- `status: "reviewed_no_evidence_found"`: a documented search of named sources found no implementation evidence. This is not proof that implementation never occurred.
- `status: "not_publicly_disclosed"`: the reviewed source set does not publicly disclose implementation information.
- `status: "not_assessed"`: no sufficient source review has been completed.

Include `reviewedSources[]` and `reviewedAt`. These values do not automatically set the promise status. In particular, lack of public disclosure must not be changed to `not_started` without a defensible review and stated evidence scope.

Promise records may also include `independentAssessments[]` with `title`, `issuer`, `date`, `assessmentType`, `conclusion` or `summary`, and an original `url`. Keep these assessments distinct from the government's official response and link the underlying document where possible. Evidence entries display `lastCheckedAt` so visitors can see when a source was last revisited.
