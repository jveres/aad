# Exploration Record Schema

This Markdown specification is the accepted source for the structure of a shared
exploration record. It is for human and agent readers, not a machine-readable
schema or a claim that an automated validator exists.

Store shared exploration records in the directory named by `wiki/engineering.md`
(such as `wiki/experiments/`). For exploration procedures, taskless questions,
and adoption approvals, see [`wiki/aad.md`](../aad.md).

## Required Content

Every exploration record must include this information:

| Item | Content |
|---|---|
| Question | The question that the investigation answers |
| Comparison criteria | The criteria used to evaluate the options |
| Date | The date of the investigation or record |
| Evidence and source links | Verified findings, measurements, and links to primary sources or experiments |
| Untested claims | Claims or assumptions that were not verified |
| Conclusion | The recommended option, or why no option fits |
| Remaining uncertainty | Open questions, test limits, or unverified conditions |

## Formatting and Compatibility

- No YAML header, record identifier, or extra metadata field is required.
- The headings in the template below are recommended formatting, not mandatory
  section names. Existing and new exploration records are valid when they
  contain the required information.
- Write links to repository files relative to the exploration record.

## Minimal Template

The required information must be present; the layout and section headings below
are recommended (`wiki/experiments/2026-10-02-table-filter-libraries.md`):

```markdown
# Table filtering options

Date: 2026-10-02
Question: Which filtering approach meets QUAL-002?
Criteria: response time at 10,000 rows, keyboard access, new dependencies.

## Evidence
- [UI requirements](../requirements/ui.md): target is 300 ms at 10,000 rows.
- Client-side filter: 840 ms median (trial script, commit 4be1c07).
- Database filter with index: 41 ms median (same script and data).

## Untested claims
- The search service vendor claims under 20 ms. Not tested.

## Conclusion
Recommend the database filter. This record does not approve adoption.

## Uncertainty
Measured on the reference laptop only.
```

## Process References

- Storage location and separation from tasks:
  [Exploration Records](../aad.md#exploration-records)
- When a question needs a record vs a conversational answer:
  [Taskless Exploration](../aad.md#taskless-exploration)
- When findings update a task or create a new objective:
  [Task Selection and Scope](../aad.md#task-selection-and-scope)
- Investigation steps, prototype rules, and adoption approval:
  [Exploration](../aad.md#exploration)
