# Task Record Schema

This Markdown specification is the accepted source for the structure of a task
record in `wiki/tasks/`. It is for human and agent readers; automated checks
depend on the project's configured validator (`wiki/engineering.md`).

For task scope, lifecycle transitions, approvals, and publication rules, see
[`wiki/aad.md`](../aad.md).

## Path and Stable ID

- Store each task in `wiki/tasks/<ID>.md` (or the project's established task
  directory).
- Use the filename without `.md` as the task's stable ID (for example `T-014`).
- Once allocated, do not rename the task file to change its ID. Change `title`
  when its label needs correction.
- Allocate IDs through the method in [Task IDs](../aad.md#task-ids).

## Structure

A task file starts with a YAML header between `---` lines for fields that tools
can read, followed by a Markdown body for people and agents.

### Required YAML Fields

| Field | Meaning |
|---|---|
| `title` | Short label for the task |
| `status` | Current task state (`todo`, `in_progress`, `review`, or `done`) |
| `aad_version` | Guide version (`MAJOR.MINOR.PATCH`) read and used for this published task update |

### Optional YAML Fields

```yaml
owner: agent-02
blocked_by:
  - T-012
```

| Field | Meaning |
|---|---|
| `owner` | Worker responsible for the next action; does not assign a permanent role |
| `blocked_by` | YAML list of unfinished existing task IDs that currently prevent progress |

Describe external blockers in `State`. For dependency cleanup and validation
rules, see [Optional Fields](../aad.md#optional-fields).

### Allowed Status Values

| Stored value | Board label | Meaning |
|---|---|---|
| `todo` | To Do | Work has not started |
| `in_progress` | In Progress | Work has started |
| `review` | In Review | The result waits for review or acceptance |
| `done` | Done | The goal and the quality conditions are met, and the required approvals are complete |

For allowed status transitions, creation states, completion, reopening,
retention, and cancellation, see [States](../aad.md#states) and
[Task Creation](../aad.md#task-creation).

### Required Markdown Sections

Each published task must contain these four `##` sections:

| Section | Content |
|---|---|
| `Goal` | Intended result, benefit, and success criteria |
| `State` | Current progress, evidence, blockers, and unresolved questions |
| `Next` | Next activity or action |
| `References` | Relevant sources and work results |

### Section and Link Rules

- Set `Next` to `None` only when `status` is `done`. For each other status,
  `Next` must name an action.
- Write links relative to the task file.

## Minimal Template

The three YAML fields (`title`, `status`, `aad_version`) and the four `##`
section headings (`Goal`, `State`, `Next`, `References`) are required. The
example values and body text below are illustrative (`wiki/tasks/T-014.md`):

```markdown
---
title: Add filtering to the payments table
status: in_progress
aad_version: 2.3.0
---

## Goal
Help support staff find failed payments without engineering help.
Add filtering by payment status.
Preserve keyboard access.
Meet the response-time target in the UI requirements.

## State
Filtering is implemented on branch `T-014-payment-filters`.
Unit tests pass.
Keyboard testing has not run.

## Next
Test keyboard navigation.

## References
- [UI requirements](../requirements/ui.md)
```

## Process References

- Scope and when to create or update a task:
  [Task Selection and Scope](../aad.md#task-selection-and-scope)
- Resolving pending reviews before new implementation:
  [Acceptance Before Unrelated Implementation](../aad.md#acceptance-before-unrelated-implementation)
- Recording branches, revisions, and local changes:
  [Format](../aad.md#format)
- Status transitions, completion, reopening, retention, and cancellation:
  [States](../aad.md#states)
- Dependency maintenance and validation:
  [Optional Fields](../aad.md#optional-fields)
- ID allocation: [Task IDs](../aad.md#task-ids)
- Initial status rules: [Task Creation](../aad.md#task-creation) and
  [Record Work After It Starts](../aad.md#record-work-after-it-starts)
- Combined and task-only publication, change categories, and trusted validation:
  [Task Publication](../aad.md#task-publication)
