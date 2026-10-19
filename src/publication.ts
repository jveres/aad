// Candidate classification from AAD §5 "Task Publication" and "Change Categories".

import { type Classification, mostRestrictive } from "./model.js";

export type ChangeKind = "files" | "task" | "task-only" | "requirement" | "dependency";

export interface ChangeOption {
  readonly id: string;
  readonly group: "Files" | "Task records" | "Requirements";
  readonly label: string;
  readonly classification: Classification;
  readonly kind: ChangeKind;
  readonly note: string;
}

export const CHANGES: readonly ChangeOption[] = [
  {
    id: "code",
    group: "Files",
    label: "Implementation, tests, or documents",
    classification: "routine",
    kind: "files",
    note: "Non-task files. Run the documented checks and the audit before each push.",
  },
  {
    id: "rules",
    group: "Files",
    label: "Rule or validator changes (AAD, engineering, CI)",
    classification: "routine",
    kind: "files",
    note: "Trusted checks load from the target branch. The candidate cannot use its own rule changes.",
  },
  {
    id: "progress",
    group: "Task records",
    label: "Update State, Next, or References within the goal",
    classification: "routine",
    kind: "task",
    note: "Routine. Keep task edits in their own commit.",
  },
  {
    id: "fields",
    group: "Task records",
    label: "Update title, owner, blocked_by, or aad_version",
    classification: "routine",
    kind: "task",
    note: "Routine after validation.",
  },
  {
    id: "submit",
    group: "Task records",
    label: "in_progress → review",
    classification: "routine",
    kind: "task",
    note: "Routine. Make the result and the evidence available first.",
  },
  {
    id: "create",
    group: "Task records",
    label: "Create a task in todo, in_progress, or review",
    classification: "routine",
    kind: "task",
    note: "Routine creation. Creation in review does not approve the result.",
  },
  {
    id: "complete",
    group: "Task records",
    label: "review → done (completion)",
    classification: "approval-sensitive",
    kind: "task-only",
    note: "Completion approval, then task-only publication. Merging code does not complete a task.",
  },
  {
    id: "create-done",
    group: "Task records",
    label: "Create a task in done",
    classification: "approval-sensitive",
    kind: "task-only",
    note: "Records approved completed work. Task-only publication.",
  },
  {
    id: "reopen",
    group: "Task records",
    label: "done → in_progress (reopen)",
    classification: "approval-sensitive",
    kind: "task-only",
    note: "Only for an unmet original goal. Reopening approval required.",
  },
  {
    id: "cancel",
    group: "Task records",
    label: "Cancel an unfinished task (delete file)",
    classification: "approval-sensitive",
    kind: "task-only",
    note: "Remove the ID from other tasks' blocked_by in the same change.",
  },
  {
    id: "goal",
    group: "Task records",
    label: "Change a goal or success criteria",
    classification: "approval-sensitive",
    kind: "task-only",
    note: "Approval-sensitive, also when expressed through another field.",
  },
  {
    id: "proposal",
    group: "Task records",
    label: "Record a marked behavior proposal within the goal",
    classification: "routine",
    kind: "task",
    note: "Routine. A proposal records an option; it does not approve adoption or implementation.",
  },
  {
    id: "rename",
    group: "Task records",
    label: "Rename a task file (changes its allocated ID)",
    classification: "invalid",
    kind: "task",
    note: "Invalid. Change the title instead; a rename is not cancellation plus creation.",
  },
  {
    id: "scope",
    group: "Task records",
    label: "Next introduces a possibly separate objective",
    classification: "unclassified",
    kind: "task",
    note: "Scope relation unclear. Block until semantic review establishes a category.",
  },
  {
    id: "skip",
    group: "Task records",
    label: "Unlisted transition (e.g. in_progress → done)",
    classification: "invalid",
    kind: "task",
    note: "Invalid. Human approval does not make an unlisted transition valid.",
  },
  {
    id: "depends",
    group: "Task records",
    label: "Task edit depends on rule changes in this candidate",
    classification: "invalid",
    kind: "dependency",
    note: "Invalid. Publish the rule changes first.",
  },
  {
    id: "req-meaning",
    group: "Requirements",
    label: "Add, remove, or alter a behavior obligation",
    classification: "approval-sensitive",
    kind: "requirement",
    note: "Same approval as a goal change. Update the requirement and its tests together.",
  },
  {
    id: "req-wording",
    group: "Requirements",
    label: "Reword a requirement without changing meaning",
    classification: "routine",
    kind: "requirement",
    note: "Routine after review of its meaning.",
  },
];

export interface PublicationVerdict {
  readonly classification: Classification;
  readonly path: string;
  readonly steps: readonly string[];
}

export function classifyCandidate(ids: readonly string[]): PublicationVerdict | undefined {
  const picked = CHANGES.filter((c) => ids.includes(c.id));
  if (picked.length === 0) return undefined;

  const touchesTasks = picked.some(
    (c) => c.kind === "task" || c.kind === "task-only" || c.kind === "dependency",
  );
  const taskOnly = picked.filter((c) => c.kind === "task-only");
  const other = picked.filter((c) => c.kind === "files" || c.kind === "requirement");
  const classes = picked.map((c) => c.classification);

  const mixesTaskOnly = taskOnly.length > 0 && other.length > 0;
  if (mixesTaskOnly) classes.push("invalid");
  const classification = mostRestrictive(classes);

  const steps: string[] = [];
  if (touchesTasks) {
    steps.push("Run trusted task checks loaded from the current target branch revision.");
  }
  steps.push("Do the audit before each push; record evidence and omitted checks.");

  let path: string;
  switch (classification) {
    case "invalid":
      path = mixesTaskOnly
        ? "Rejected: completion, creation in done, reopening, cancellation, and goal changes cannot combine with other files. Split into a task-only publication."
        : "Blocked until correction. Approval cannot make an invalid change valid.";
      break;
    case "unclassified":
      path = "Blocked until semantic review establishes a category. Research can continue.";
      break;
    case "approval-sensitive":
      path =
        taskOnly.length > 0
          ? "Task-only publication after authorized approval."
          : "Publish after authorized review of the meaning change and validation.";
      steps.push("Get authorized approval; renew it if reviewed content or scope changes.");
      break;
    default:
      path =
        touchesTasks && other.length > 0
          ? "Combined publication allowed. Keep task edits in their own commit."
          : touchesTasks
            ? "Task-only publication after validation."
            : "Publish through the documented method.";
  }
  if (touchesTasks && classification !== "invalid") {
    steps.push("Validate against the current shared task, not only the PR base.");
  }
  return { classification, path, steps };
}
