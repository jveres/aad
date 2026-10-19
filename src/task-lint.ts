// Structural checks for a task file, following AAD §5 "Format", "States", and "Optional Fields".
// Semantic scope review is out of reach for a linter, as AAD itself states.

import { classifyTransition, isState, STATES, type State } from "./model.js";
import { compareSemver, isSemver } from "./versioning.js";

export type Severity = "error" | "warning" | "info";

export interface Diagnostic {
  readonly severity: Severity;
  readonly line: number;
  readonly rule: string;
  readonly message: string;
}

export interface LintOptions {
  /** Task file name, for example `T-014.md`. Used for self-dependency checks. */
  readonly fileName?: string;
  /** Status on the accepted baseline, or `undefined` for a new task. */
  readonly previous?: State | undefined;
  /** Version of the current shared guide. */
  readonly guideVersion?: string;
}

export interface LintResult {
  readonly diagnostics: readonly Diagnostic[];
  readonly status?: State;
}

const REQUIRED_FIELDS = ["title", "status", "aad_version"] as const;
const OPTIONAL_FIELDS = ["owner", "blocked_by"] as const;
const SECTIONS = ["Goal", "State", "Next", "References"] as const;

interface Field {
  readonly line: number;
  readonly value: string;
  readonly items: { line: number; value: string }[];
}

export function lintTask(text: string, options: LintOptions = {}): LintResult {
  const out: Diagnostic[] = [];
  const report = (severity: Severity, line: number, rule: string, message: string) =>
    out.push({ severity, line, rule, message });

  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    report("error", 1, "format/header", "Missing YAML header. The file must start with `---`.");
    return { diagnostics: out };
  }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end < 0) {
    report("error", 1, "format/header", "YAML header is not closed with `---`.");
    return { diagnostics: out };
  }

  const fields = parseHeader(lines.slice(1, end), 2, report);

  for (const name of REQUIRED_FIELDS) {
    const f = fields.get(name);
    if (!f || (f.value === "" && f.items.length === 0)) {
      report("error", 1, "format/required-field", `Required header field \`${name}\` is missing.`);
    }
  }
  for (const [name, f] of fields) {
    if (!(REQUIRED_FIELDS as readonly string[]).includes(name)) {
      if (!(OPTIONAL_FIELDS as readonly string[]).includes(name)) {
        report("info", f.line, "format/unknown-field", `\`${name}\` is not an AAD field.`);
      }
    }
  }

  let status: State | undefined;
  const statusField = fields.get("status");
  if (statusField?.value) {
    if (isState(statusField.value)) status = statusField.value;
    else {
      report(
        "error",
        statusField.line,
        "states/value",
        `\`${statusField.value}\` is not a stored status. Use one of: ${STATES.join(", ")}.`,
      );
    }
  }

  const version = fields.get("aad_version");
  if (version?.value) {
    if (!isSemver(version.value)) {
      report(
        "error",
        version.line,
        "format/aad-version",
        "`aad_version` must be MAJOR.MINOR.PATCH.",
      );
    } else if (options.guideVersion && compareSemver(version.value, options.guideVersion) > 0) {
      report(
        "warning",
        version.line,
        "version/newer-than-guide",
        `Task records ${version.value}, newer than the shared guide ${options.guideVersion}. Read the full guide and record the conflict in State.`,
      );
    }
  }

  const blocked = fields.get("blocked_by");
  if (blocked) {
    const self = options.fileName?.replace(/\.md$/, "");
    const seen = new Set<string>();
    for (const item of blocked.items) {
      if (self && item.value === self) {
        report("error", item.line, "deps/self", "A task cannot block itself.");
      }
      if (seen.has(item.value)) {
        report("warning", item.line, "deps/duplicate", `\`${item.value}\` is listed twice.`);
      }
      seen.add(item.value);
    }
    if (status === "done" && blocked.items.length > 0) {
      report(
        "warning",
        blocked.line,
        "deps/done-blocked",
        "A done task lists blockers. `blocked_by` holds current blockers only.",
      );
    }
  }

  const sections = parseSections(lines, end + 1);
  for (const name of SECTIONS) {
    const s = sections.get(name);
    if (!s) {
      report("error", end + 2, "format/section", `Required section \`## ${name}\` is missing.`);
    } else if (s.body.trim() === "") {
      report("error", s.line, "format/section-empty", `Section \`## ${name}\` is empty.`);
    }
  }

  const next = sections.get("Next");
  if (next && status) {
    const isNone = /^none\.?$/i.test(next.body.trim());
    if (status === "done" && !isNone) {
      report("error", next.line, "states/next", "For `done`, set `Next` to `None`.");
    }
    if (status !== "done" && isNone) {
      report(
        "error",
        next.line,
        "states/next",
        `For \`${status}\`, \`Next\` must name an action. Only \`done\` uses \`None\`.`,
      );
    }
  }

  if (status && statusField) {
    if (options.previous === undefined) {
      if (status === "done") {
        report(
          "warning",
          statusField.line,
          "creation/done",
          "Creation in `done` is approval-sensitive. Publish task-only, after approval.",
        );
      }
    } else if (options.previous !== status) {
      const v = classifyTransition(options.previous, status);
      const sev: Severity = v.classification === "invalid" ? "error" : "info";
      const label = v.classification === "invalid" ? "" : ` (${v.classification})`;
      report(
        sev,
        statusField.line,
        "states/transition",
        `${options.previous} → ${status}${label}: ${v.reason}`,
      );
    }
  }

  out.sort((a, b) => a.line - b.line);
  return status ? { diagnostics: out, status } : { diagnostics: out };
}

function parseHeader(
  header: readonly string[],
  firstLine: number,
  report: (s: Severity, line: number, rule: string, msg: string) => void,
): Map<string, Field> {
  const fields = new Map<string, Field>();
  let current: Field | undefined;
  header.forEach((raw, i) => {
    const line = firstLine + i;
    if (raw.trim() === "" || raw.trim().startsWith("#")) return;
    const item = /^\s+-\s*(.+?)\s*$/.exec(raw);
    if (item?.[1] && current) {
      current.items.push({ line, value: unquote(item[1]) });
      return;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(raw);
    if (!kv?.[1]) {
      report("error", line, "format/yaml", "Cannot read this header line.");
      return;
    }
    if (fields.has(kv[1])) report("error", line, "format/yaml", `Duplicate field \`${kv[1]}\`.`);
    current = { line, value: unquote(kv[2] ?? ""), items: [] };
    fields.set(kv[1], current);
  });
  return fields;
}

function parseSections(lines: readonly string[], start: number) {
  const sections = new Map<string, { line: number; body: string }>();
  let name: string | undefined;
  let body: string[] = [];
  let line = 0;
  const flush = () => {
    if (name !== undefined && !sections.has(name))
      sections.set(name, { line, body: body.join("\n") });
  };
  for (let i = start; i < lines.length; i++) {
    const h = /^##\s+(.+?)\s*$/.exec(lines[i] ?? "");
    if (h?.[1]) {
      flush();
      name = h[1];
      body = [];
      line = i + 1;
    } else body.push(lines[i] ?? "");
  }
  flush();
  return sections;
}

function unquote(v: string): string {
  return v.replace(/^(["'])(.*)\1$/, "$2");
}
