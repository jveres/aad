// Guide version rules from AAD §8.

export type Bump = "major" | "minor" | "patch";
export type ReadAction = "full" | "diff" | "content-diff" | "none";

export function isSemver(v: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(v);
}

function parts(v: string): [number, number, number] {
  const [a = 0, b = 0, c = 0] = v.split(".").map(Number);
  return [a, b, c];
}

export function compareSemver(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

export interface ReadingInput {
  /** Guide version this worker previously read, or `undefined` if unknown or uncertain. */
  readonly known: string | undefined;
  readonly current: string;
  /** The content differs although the version is the same. */
  readonly contentChanged: boolean;
  /** The earlier content or the complete diff can be retrieved. */
  readonly diffAvailable: boolean;
}

export interface ReadingVerdict {
  readonly action: ReadAction;
  readonly reason: string;
}

/** What a worker must read at start or resume (AAD §8 "Read Current Guidance"). */
export function readingRule(input: ReadingInput): ReadingVerdict {
  const { known, current, contentChanged, diffAvailable } = input;
  if (known === undefined || !isSemver(known)) {
    return {
      action: "full",
      reason:
        "No known reading baseline. Read the full guide. A task's aad_version does not prove what this worker read.",
    };
  }
  const [kM, km, kp] = parts(known);
  const [cM, cm, cp] = parts(current);
  if (kM !== cM || km !== cm) {
    return { action: "full", reason: "The major or minor version changed. Read the full guide." };
  }
  if (kp !== cp) {
    return diffAvailable
      ? {
          action: "diff",
          reason: "Only the patch changed. Examine all guide changes between the revisions.",
        }
      : {
          action: "full",
          reason: "Patch change, but the complete diff is unavailable. Read the full guide.",
        };
  }
  if (contentChanged) {
    return diffAvailable
      ? { action: "content-diff", reason: "Same version, different content. Examine that diff." }
      : {
          action: "full",
          reason: "Content differs and the diff is unavailable. Read the full guide.",
        };
  }
  return {
    action: "none",
    reason:
      "Same version and content. No guide reading needed; other documents can still have changed.",
  };
}

export interface ImpactOption {
  readonly id: string;
  readonly label: string;
  readonly bump: Bump;
}

/** Compatibility impacts that select the increment (AAD §8 table). */
export const IMPACTS: readonly ImpactOption[] = [
  { id: "migrate", label: "Requires migration of existing valid records", bump: "major" },
  { id: "states", label: "Removes or redefines task states or transitions", bump: "major" },
  { id: "approval", label: "Changes approval authority or required approval gates", bump: "major" },
  { id: "publication", label: "Replaces the required publication model", bump: "major" },
  { id: "capability", label: "Adds a compatible capability or guidance", bump: "minor" },
  {
    id: "obligation",
    label: "Adds a prospective obligation within the existing contract",
    bump: "minor",
  },
  { id: "wording", label: "Corrects wording, examples, formatting, or links", bump: "patch" },
];

const ORDER: readonly Bump[] = ["major", "minor", "patch"];

/** A release is classified by its most significant change. */
export function selectBump(ids: readonly string[]): Bump | undefined {
  const bumps = IMPACTS.filter((i) => ids.includes(i.id)).map((i) => i.bump);
  return ORDER.find((b) => bumps.includes(b));
}

export function applyBump(version: string, bump: Bump): string {
  const [M, m, p] = parts(version);
  if (bump === "major") return `${M + 1}.0.0`;
  if (bump === "minor") return `${M}.${m + 1}.0`;
  return `${M}.${m}.${p + 1}`;
}
