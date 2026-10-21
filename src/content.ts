// Page content quoted or condensed from aad.md. The spec stays the accepted source.

export const CORE_RULES: readonly string[] = [
  "Keep one accepted source for each rule or decision.",
  "Link to existing information. Do not copy it.",
  "Give agents a short starting point.",
  "Read detailed information when the task needs it.",
  "Connect work to a clear problem or intended outcome.",
  "Separate facts, assumptions, recommendations, and accepted decisions.",
  "Support findings with evidence.",
  "Select checks based on the work and its risks.",
  "Where tools can enforce a rule, use those tools.",
  "Review results before you accept them.",
  "Keep shared tasks current.",
  "Search for suitable existing tools before you create new ones.",
];

export interface TreeNode {
  readonly name: string;
  readonly depth: number;
  readonly purpose: string;
  readonly source?: string;
  readonly optional?: boolean;
}

export const TREE: readonly TreeNode[] = [
  {
    name: "project/",
    depth: 0,
    purpose:
      "The repository. Its accepted baseline is the current default branch of the shared remote.",
  },
  {
    name: "AGENTS.md",
    depth: 1,
    purpose:
      "Starting instructions for agents: startup process, sources (including wiki/schemas/README.md and wiki/schemas/task.schema.md), index-first search, and targeted schema loading.",
    source: "Agent entry point (§9)",
  },
  {
    name: "src/",
    depth: 1,
    purpose: "Code. Observed behavior comes from code, tests, experiments, and live evidence.",
    source: "Observed behavior",
  },
  {
    name: "tests/",
    depth: 1,
    purpose: "Automated tests in the project's existing test locations.",
    source: "Observed behavior",
  },
  {
    name: "scripts/",
    depth: 1,
    purpose:
      "Scripts and tool configuration define how checks operate. A written rule does not enforce itself.",
    source: "Build, formatting, and analysis rules",
  },
  {
    name: "<dependency-and-tool-configuration>",
    depth: 1,
    purpose:
      "Manifests, lockfiles, and runtime configuration. Keep existing paths that serve this purpose.",
    source: "Dependencies and versions",
  },
  {
    name: "<ci-workflows>",
    depth: 1,
    purpose: "Workflow files and their scripts. CI does automated builds and tests after changes.",
    source: "CI execution",
  },
  { name: "wiki/", depth: 1, purpose: "Shared knowledge. Each topic has one accepted source." },
  {
    name: "README.md",
    depth: 2,
    purpose:
      "Main knowledge index. Links to accepted guidance and knowledge collections with a short statement of what each contains or when to use it. Read before creating a knowledge document.",
    source: "Knowledge index",
  },
  {
    name: "aad.md",
    depth: 2,
    purpose:
      "Accepted working process, record lifecycle, approvals, and publication procedures. The only versioned document.",
    source: "Working process, record lifecycle, approvals, and publication procedures",
  },
  {
    name: "schemas/",
    depth: 2,
    purpose:
      "Record-structure schemas and their collection index (wiki/schemas/README.md). Load the applicable schema when creating or structurally checking a record.",
    source: "Schema collection index",
  },
  {
    name: "task.schema.md",
    depth: 3,
    purpose:
      "Accepted structure for task records: stable filename ID, required and optional YAML fields, allowed status values, required Markdown sections, Next rule, relative links, and template.",
    source: "Task-record structure",
  },
  {
    name: "exploration.schema.md",
    depth: 3,
    purpose:
      "Accepted structure for exploration records: question, comparison criteria, date, evidence and source links, untested claims, conclusion, remaining uncertainty, and template. No mandatory YAML.",
    source: "Exploration-record structure",
  },
  {
    name: "decision.schema.md",
    depth: 3,
    purpose:
      "Accepted structure for ADRs: problem, chosen approach, alternatives, reasons, consequences, status (proposed, accepted, rejected, superseded), evidence, and template. No mandatory YAML.",
    source: "Decision-record structure",
  },
  {
    name: "requirements.md",
    depth: 2,
    purpose:
      "Accepted behavior and quality requirements. Observable results, with numbers and conditions for limits.",
    source: "Required behavior and user outcomes",
  },
  {
    name: "requirements/",
    depth: 2,
    optional: true,
    purpose:
      "Optional detailed behavior specifications: a stable ID, one testable rule per bullet, When/Then examples, and Limits. Cite the ID in test names. Recommended, not required.",
    source: "Required behavior and user outcomes",
  },
  {
    name: "architecture.md",
    depth: 2,
    purpose: "System boundaries and technology roles.",
    source: "System structure",
  },
  {
    name: "engineering.md",
    depth: 2,
    purpose:
      "Setup, commands, quality policy, approvals, approved tools, baseline, trusted checks and schemas, and publication method.",
    source: "Development and operational procedures",
  },
  {
    name: "decisions/",
    depth: 2,
    purpose:
      "Significant choices and their reasons. Structure and statuses follow wiki/schemas/decision.schema.md; approval and lifecycle rules stay in wiki/aad.md.",
    source: "Reasons for significant choices",
  },
  {
    name: "experiments/",
    depth: 2,
    purpose:
      "Exploration findings, trials, prototypes, and their evidence. Structure follows wiki/schemas/exploration.schema.md; findings do not approve adoption.",
    source: "Exploration records",
  },
  {
    name: "checkpoints/",
    depth: 2,
    purpose: "Current-state summaries, measurements, and recovery maps for checkpointed material.",
    source: "Recovery of checkpointed material",
  },
  {
    name: "proposals/",
    depth: 2,
    purpose:
      "Proposed process changes and their review outcomes. Current rules stay in their accepted sources.",
  },
  {
    name: "sources/",
    depth: 2,
    purpose:
      "Source ledgers and provenance. Can reference private originals without copying them into Git.",
  },
  {
    name: "tasks/",
    depth: 2,
    purpose:
      "Goals, progress, and next actions. Structure follows wiki/schemas/task.schema.md; lifecycle, approvals, and publication follow wiki/aad.md.",
    source: "Shared progress",
  },
];

export interface Activity {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly steps: readonly string[];
  readonly note: string;
}

export const ACTIVITIES: readonly Activity[] = [
  {
    id: "discovery",
    name: "Discovery",
    summary: "Identifies a problem, the people affected, and an outcome worth the effort.",
    steps: [
      "Identify the users or other people affected.",
      "Collect evidence about the problem.",
      "Identify the business constraints.",
      "State the intended outcome.",
      "Define how the team will assess that outcome.",
      "Record open questions and assumptions.",
    ],
    note: "Record quality requirements: performance, reliability, security, accessibility, privacy, recovery.",
  },
  {
    id: "exploration",
    name: "Exploration",
    summary: "Assesses possible approaches before the team selects one.",
    steps: [
      "Define the question and the comparison criteria.",
      "Limit the time, the options, or the experiment scope.",
      "Find suitable options.",
      "Read current primary sources.",
      "Compare the options against the criteria.",
      "If evidence is missing, do a small experiment.",
      "Record reusable findings in an exploration record following `wiki/schemas/exploration.schema.md`.",
      "Separate verified results from assumptions.",
      "Recommend an option, or explain why none fits.",
    ],
    note: "A valid result can be that no option fits. Accepted findings do not approve adoption.",
  },
  {
    id: "implementation",
    name: "Implementation",
    summary: "Changes the system to meet the task goal.",
    steps: [
      "Read the relevant requirements, decisions, code, and tests.",
      "If an approved skill fits the task, use it.",
      "If necessary, create a private detailed plan.",
      "Make the change within the agreed scope.",
      "Do the required tests and the code analysis.",
      "Update the affected documents and affected wiki indexes.",
      "For a significant choice, create an ADR with status `proposed` following `wiki/schemas/decision.schema.md`.",
      "Prepare implementation commits and separate routine task commits.",
      "Complete the audit before each push, then publish.",
    ],
    note: "Before review, make the proposed revision available and hand off with the decision needed.",
  },
  {
    id: "review",
    name: "Review",
    summary: "Assesses a result against the task goal and the project rules.",
    steps: [
      "Read the task and the current guidance.",
      "Examine the result and the supporting evidence.",
      "Make sure that the result meets the success criteria.",
      "Select checks based on the work and its risks.",
      "Do the required checks.",
      "Record findings, results, and remaining uncertainty.",
      "Identify the reviewed result or revision.",
      "Publish permitted routine task updates and the next action; recommend approval-sensitive changes.",
    ],
    note: "Use a different worker when possible. Treat an agent's report as a report, not as proof.",
  },
  {
    id: "delivery",
    name: "Delivery",
    summary: "Prepares and releases an accepted result.",
    steps: [
      "Read the approved release procedure.",
      "Identify the version or the artifact to release.",
      "Make sure that the required approvals are complete.",
      "Define the post-release checks and the recovery steps.",
      "Do the authorized release.",
      "Examine the behavior in the target environment.",
      "Record the release identity and the observed results.",
    ],
    note: "Do not assume that a return to older code reverses data changes.",
  },
  {
    id: "operation",
    name: "Operation",
    summary: "Investigates the live system and improves its behavior.",
    steps: [
      "Collect evidence: incidents, support requests, performance and reliability problems.",
      "Include security findings, unexpected costs, and repeated manual work.",
      "Include user adoption and outcome measures.",
      "Record findings as tasks when they need tracked follow-up.",
      "After review, update related code, tests, decisions, or procedures.",
      "For outcomes that need observation, create a follow-up task with a measurement period.",
    ],
    note: "Other reusable findings follow the exploration-record rules.",
  },
  {
    id: "checkpoint",
    name: "Checkpoint",
    summary: "Records current state and reduces the live tree. Git keeps the history.",
    steps: [
      "Track the checkpoint as a separate goal on a closed part of history.",
      "Record scope, baseline revision, candidate paths, and a numeric reduction target.",
      "Summarize eligible material with exact source commit and path.",
      "Archive superseded material in Git; no second archive directory.",
      "Repair links, indexes, and references to removed files.",
      "Prove recovery with immutable commit IDs.",
      "Measure the complete result: bytes, file counts, startup reading cost.",
    ],
    note: "Ordinary commits only: no history rewrite, force-push, or branch deletion. A tag alone is not a checkpoint.",
  },
];

export const STARTUP: readonly string[] = [
  "Read the `AGENTS.md` in the current checkout.",
  "Fetch the shared default branch, or read the declared local baseline and report that it is not shared.",
  "Read `AGENTS.md` from the accepted baseline and identify the guide revision.",
  "Establish which guide revision this worker previously read. If unknown, read the full guide.",
  "Inspect shared tasks in `review` and resolve acceptance before unrelated implementation.",
  "If the task records a newer version than the shared guide, read the full guide and record the conflict.",
  "Read the current shared documents relevant to the work.",
  "When publishing a task update, record the guide version that you read and used.",
];

export const ADOPTION: readonly string[] = [
  "Add the guide as `wiki/aad.md` and install the record schemas under `wiki/schemas/`. Reuse equivalent established project locations where appropriate, updating all links consistently.",
  "Create `AGENTS.md` and `wiki/README.md`, linking `wiki/schemas/README.md` and the project's knowledge collections.",
  "Document setup, checks, approvals, and completion rules.",
  "Define task ID allocation.",
  "Name the accepted baseline and the combined and task-only publication methods.",
  "Configure trusted task checks for both publication paths. Record any gaps.",
  "Record essential requirements and decisions.",
  "Record approved skills and tools.",
  "Record the selected ASD-STE100 issue.",
  "Create the first task using `wiki/schemas/task.schema.md`.",
  "Ask an agent without earlier context to do the next activity.",
  "Publish coordination state promptly; keep completion separate.",
  "Ask another agent to continue or review the result.",
  "Correct the gaps found in the trial.",
];

export const CASES: readonly (readonly [string, string])[] = [
  [
    "Fresh worker, task version matches current guide",
    "Full guide read; the task field does not prove worker knowledge",
  ],
  [
    "Known reading baseline, patch change only",
    "Examine the complete guide diff; read in full if that baseline is unavailable",
  ],
  [
    "Existing `in_progress` task changes to `done`",
    "Reject the unlisted transition, even with approval",
  ],
  [
    "New task records already approved completed work",
    "Apply approval-sensitive initial creation in `done`",
  ],
  ["All work in `review` is discarded", "Allow direct `review → todo`, with the reason in `State`"],
  [
    "Code and routine task edits, including `in_progress → review`",
    "Run trusted task checks; allow valid changes in separate task commits",
  ],
  [
    "Code and completion, reopening, cancellation, or goal changes",
    "Reject combined publication; use task-only approval",
  ],
  [
    "Code and initial task creation in `done`",
    "Reject combined publication; creation needs task-only approval",
  ],
  [
    "Change adds, removes, or alters an accepted behavior obligation",
    "Require goal-level approval",
  ],
  [
    "Requirement wording changes without a meaning change",
    "Allow after review; no goal-level approval needed",
  ],
  [
    "Task or record edit depends on rule or schema changes in the same candidate",
    "Reject; publish rule or schema changes first",
  ],
  [
    "Long-lived branch has a stale task edit",
    "Validate against the current accepted task and preserve other workers' changes",
  ],
  ["Target branch changes during review", "Rerun affected checks against the new target revision"],
  ["Project has no remote", "Use its declared local baseline and report that it is not shared"],
  [
    "Revert would restore a completed task to `review`",
    "Reject the invalid transition; correct task state through the valid approval path",
  ],
  [
    "A task completes while dependents list it",
    "Require removal of its blocker references in the same change",
  ],
  [
    "A dependency edit adds a self-reference or cycle",
    "Reject it; report existing unrelated anomalies separately",
  ],
  ["A `done` task is submitted for cancellation", "Reject deletion under completed-task retention"],
  [
    "Bounded conversational answer has no reusable findings",
    "Require neither a task nor an exploration file",
  ],
  [
    "Taskless research produces reusable evidence",
    "Use an exploration record, not an unrelated task update",
  ],
  [
    "Existing intended outcome has revised success criteria",
    "Require authorized review of the amendment",
  ],
  ["Request establishes an independently trackable outcome", "Create a new task"],
  [
    "Shared state or reviewed content changes before merge",
    "Revalidate the merge candidate and renew affected review or approval",
  ],
  [
    "Unrelated feature requested while a result awaits acceptance",
    "Resolve acceptance, requested changes, or explicit deferral before implementation",
  ],
  [
    "Commit or push requested for a reviewed result",
    "Publish within authorization; keep acceptance pending",
  ],
  [
    '"Continue to the next task" directly approves a clear handoff',
    "Record the identified task's acceptance and use the existing completion path",
  ],
  [
    "Explicit review deferral",
    "Keep `review`; record approval, reason, return condition, and any limit exception",
  ],
  [
    "Deferred reviews reach the configured limit",
    "Require an explicit recorded exception before exceeding it",
  ],
  [
    "Approved replacement supersedes pending work",
    "Reconcile the earlier task through approved completion or cancellation; link the replacement",
  ],
  [
    "Historical task predates the pending-review rule",
    "Preserve its record; apply the selection rule to future work",
  ],
  [
    "Review recommends completion without completion authority",
    "Keep acceptance pending; recommendation alone does not authorize `done`",
  ],
  [
    "Pending-review count is below the limit",
    "Still require explicit deferral before unrelated implementation",
  ],
  [
    "Adoption finds reviews above the configured limit",
    "Preserve valid records; resolve reviews or record deferrals and required exceptions before unrelated implementation",
  ],
  ["Started work retains progress but is paused", "Keep `in_progress`; do not return it to `todo`"],
  ["Task rename changes an allocated filename ID", "Reject the identity change"],
  [
    "Accepted requirement change accompanies implementation and tests",
    "Permit after required approval; actual task-goal edits remain task-only",
  ],
  [
    "Clearly marked behavior proposal remains within the task goal",
    "Permit routine recording without approving adoption or implementation",
  ],
  [
    "Completion publication is automated",
    "Require authorized acceptance, trusted validation, and a separate task-only publication",
  ],
];

export const WORKING_REFERENCE: readonly (readonly [string, string, string, string])[] = [
  [
    "Start or resume",
    "Read current guidance; select the relevant task when needed",
    "Read Current Guidance",
    "read-current-guidance",
  ],
  [
    "Answer a bounded question",
    "Conversation, or an exploration record for reusable findings",
    "Taskless Exploration",
    "taskless-exploration",
  ],
  [
    "Publish progress or submit a result",
    "Evidence with a short task summary",
    "Task Publication; only routine task edits may accompany implementation",
    "task-publication",
  ],
  [
    "Propose behavior",
    "Clearly marked proposal, separate from accepted requirements",
    "Behavior Requirements",
    "behavior-requirements",
  ],
  [
    "Change accepted behavior",
    "Requirements and tests in the same change",
    "Required behavior-change approval; task-goal edits remain task-only",
    "behavior-requirements",
  ],
  [
    "Hand off for acceptance",
    "Task, revisions, verification, limits, and decision needed",
    "Acceptance Before Unrelated Implementation",
    "acceptance-before-unrelated-implementation",
  ],
  [
    "Complete, reopen, cancel, or change a task goal",
    "Task-only publication",
    "Required authorized approval and validation",
    "task-publication",
  ],
];

export const SAMPLE_TASK = `---
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
Filtering is implemented on branch \`T-014-payment-filters\`.
Unit tests pass.
Keyboard testing has not run.

## Next
Test keyboard navigation.

## References
- [UI requirements](../requirements/ui.md)
`;

// Prompt for a fresh agent in an empty or existing project folder. Keep in sync
// with the README "Adopt AAD in a project" section; check-version.js checks the URL.
export function adoptPrompt(repo: string, version: string): string {
  return `Set up AAD (Agent-Assisted Development) ${version} in this project folder. The folder can be empty or an existing project.

1. Download the guide and schemas: mkdir -p wiki/schemas && curl -fsSL https://raw.githubusercontent.com/${repo}/v${version}/aad.md -o wiki/aad.md && for f in README.md task.schema.md exploration.schema.md decision.schema.md; do curl -fsSL "https://raw.githubusercontent.com/${repo}/v${version}/wiki/schemas/$f" -o "wiki/schemas/$f"; done
   If wiki/aad.md already exists, compare the versions and ask me before you replace it. Read the full guide. §13 Adoption is the checklist; §9 has the AGENTS.md template.
2. Examine the folder: Git repository, remote and default branch, README, AGENTS.md, CLAUDE.md and other agent instruction files, docs, build and test commands, CI. If there is no Git repository, ask me before you run git init. Do not overwrite or move existing files. Extend them, or link to existing equivalents.
3. Create or extend AGENTS.md, wiki/README.md (linking wiki/schemas/README.md and the knowledge collections), and wiki/engineering.md. Make sure that CLAUDE.md contains the line @AGENTS.md. Fill in what you can find in the project. Ask me, in one short list with your recommended defaults, the decisions that only people can make: accepted baseline, task ID allocation, publication methods, reviewers, approval authority, sensitive actions, ASD-STE100 issue. Do not leave placeholders. Record each unresolved item under "Adoption gaps".
4. Create other documents only when they have real content now. Ask me for one small, real first task and create it in wiki/tasks/ using wiki/schemas/task.schema.md.
5. Show me the changes and the 14 adoption steps, each marked done or gap. Do not commit or push without my approval.
6. Tell me how to test the setup: a new agent session without this conversation does the next activity of the first task, and a second agent reviews the result.`;
}
