# Decision Record Schema

This Markdown specification is the accepted source for the structure of an
architectural decision record (ADR) in `wiki/decisions/` (or the project's
established equivalent). It is for human and agent readers, not a
machine-readable schema or a claim that an automated validator exists.

For decision approval and lifecycle rules, see [`wiki/aad.md`](../aad.md).

## Required Content

Every decision record must include this information:

| Item | Content |
|---|---|
| Problem | The context and problem that requires a significant choice |
| Chosen approach | The selected option or proposed design |
| Alternatives | Other options considered |
| Reasons | Why the chosen approach was selected, or why a rejected proposal was not approved |
| Consequences | Trade-offs, operational effects, and follow-up obligations |
| Status | Current decision status (and a link to the replacement when `superseded`) |
| Evidence | Links to supporting experiments, requirements, or primary sources |

## Allowed Statuses

| Status | Meaning |
|---|---|
| `proposed` | Created for review; awaiting required approval |
| `accepted` | Approved and currently in force |
| `rejected` | Not approved; the record includes the reason |
| `superseded` | Replaced by a later accepted decision; the record links to the replacement |

## Formatting and Compatibility

- No YAML header or new metadata field is required.
- ADRs use decision IDs and statuses; Git history tracks revisions without
  separate document version numbers.
- The headings in the template below are recommended formatting, not mandatory
  section names. Existing and new decision records are valid when they contain
  the required information.
- Write links to repository files relative to the decision record.

## Minimal Template

Start new decision proposals with `proposed`. The required information and a
valid status must be present; the section headings below are recommended
(`wiki/decisions/ADR-003-payment-filter-query.md`):

```markdown
# ADR-003: Filter payments in the database

Status: proposed

## Problem
Client-side filtering misses QUAL-002 above 5,000 rows.

## Approach
Filter by status in the API query, with an index on `status`.

## Alternatives
- Client-side filtering: simple, but fails the response-time target.
- Search service: fast, but adds a new dependency and operations cost.

## Reasons
Meets QUAL-002 in the trial; no new dependency.

## Consequences
Needs a migration for the index. Rollback drops the index.

## Evidence
- [Filter trial](../experiments/2026-10-02-table-filter-libraries.md)
```

## Process References

- Approval rules, recording rejection reasons, and linking replacements:
  [Decision Records](../aad.md#decision-records)
- Creating a proposed ADR during implementation:
  [Implementation](../aad.md#implementation)
- Document versioning and decision IDs:
  [Guide Version and Document Changes](../aad.md#8-guide-version-and-document-changes)
- Maintaining links when decisions are replaced:
  [Knowledge Maintenance and Safety](../aad.md#10-knowledge-maintenance-and-safety)
