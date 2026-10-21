# Record Schemas

These Markdown specifications define the accepted structure for AAD records.
They are human- and agent-readable specifications, not machine-readable schemas,
and they do not by themselves establish that automated validators exist.

Load the applicable schema when creating or structurally checking a record.
Record lifecycle, approvals, and publication procedures remain in
[`wiki/aad.md`](../aad.md) and project engineering guidance. Like other project
documents outside `wiki/aad.md`, schemas use Git history rather than separate
version numbers.

## Schemas

- [`task.schema.md`](task.schema.md): Required and optional YAML fields, allowed
  `status` values, required Markdown sections, stable filename ID rule, and
  template for task records in `wiki/tasks/`. Use when creating, updating, or
  structurally checking a task.
- [`exploration.schema.md`](exploration.schema.md): Required information and
  recommended template for reusable investigation records in `wiki/experiments/`
  (or the directory named by `wiki/engineering.md`). Use when recording or
  reviewing reusable exploration findings.
- [`decision.schema.md`](decision.schema.md): Required information, allowed
  status values, and recommended template for architectural decision records in
  `wiki/decisions/`. Use when proposing, updating, or reviewing a decision
  record.
