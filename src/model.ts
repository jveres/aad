// Task lifecycle model from AAD §5 "States", "Task Creation", and "Change Categories".

export const STATES = ["todo", "in_progress", "review", "done"] as const;
export type State = (typeof STATES)[number];

export type Classification = "routine" | "approval-sensitive" | "unclassified" | "invalid";

/** Most restrictive first, as in AAD §5 "Required Task-Change Validation". */
export const SEVERITY: readonly Classification[] = [
  "invalid",
  "unclassified",
  "approval-sensitive",
  "routine",
];

export const BOARD_LABEL: Record<State, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

export const STATE_MEANING: Record<State, string> = {
  todo: "Work has not started",
  in_progress: "Work has started",
  review: "The result waits for review or acceptance",
  done: "The goal and the quality conditions are met, and the required approvals are complete",
};

export interface Transition {
  readonly from: State;
  readonly to: State;
  readonly condition: string;
  readonly classification: Exclude<Classification, "unclassified" | "invalid">;
}

/** The authoritative transition table. An unlisted transition is invalid. */
export const TRANSITIONS: readonly Transition[] = [
  { from: "todo", to: "in_progress", condition: "Start work", classification: "routine" },
  {
    from: "in_progress",
    to: "todo",
    condition: "Return to backlog: work did not start, or all work was discarded",
    classification: "routine",
  },
  {
    from: "in_progress",
    to: "review",
    condition: "Make the result and evidence available for review",
    classification: "routine",
  },
  {
    from: "review",
    to: "todo",
    condition: "All work was discarded; explain why in State",
    classification: "routine",
  },
  {
    from: "review",
    to: "in_progress",
    condition: "Review requires more work",
    classification: "routine",
  },
  {
    from: "review",
    to: "done",
    condition: "Goal and quality conditions are met; completion approval is required",
    classification: "approval-sensitive",
  },
  {
    from: "done",
    to: "in_progress",
    condition: "Original goal is unmet; reopening approval is required",
    classification: "approval-sensitive",
  },
];

export interface Creation {
  readonly status: State;
  readonly condition: string;
  readonly classification: Transition["classification"];
}

export const CREATION: readonly Creation[] = [
  { status: "todo", condition: "Work has not started", classification: "routine" },
  {
    status: "in_progress",
    condition: "Work has started and more preparation is necessary",
    classification: "routine",
  },
  {
    status: "review",
    condition: "The result and the evidence are ready for review",
    classification: "routine",
  },
  {
    status: "done",
    condition: "Records previously approved completed work",
    classification: "approval-sensitive",
  },
];

export interface Verdict {
  readonly classification: Classification;
  readonly reason: string;
}

export function findTransition(from: State, to: State): Transition | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to);
}

/** Classifies a status change of an existing task. */
export function classifyTransition(from: State, to: State): Verdict {
  if (from === to) {
    return { classification: "routine", reason: "Keeping the same status is not a transition." };
  }
  const t = findTransition(from, to);
  if (!t) {
    return {
      classification: "invalid",
      reason: `${from} → ${to} is not in the transition table. No approval can grant an unlisted transition.`,
    };
  }
  return { classification: t.classification, reason: t.condition };
}

export function isState(value: string): value is State {
  return (STATES as readonly string[]).includes(value);
}

export function mostRestrictive(list: readonly Classification[]): Classification {
  for (const c of SEVERITY) if (list.includes(c)) return c;
  return "routine";
}
