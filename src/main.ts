import { register, render } from "pele/core";
import stateDiagram from "pele/diagrams/state";
import {
  ACTIVITIES,
  ADOPTION,
  CASES,
  CORE_RULES,
  SAMPLE_TASK,
  STARTUP,
  TREE,
  WORKING_REFERENCE,
} from "./content.js";
import { $, h, inline, store } from "./dom.js";
import {
  BOARD_LABEL,
  CREATION,
  classifyTransition,
  isState,
  STATE_MEANING,
  STATES,
  type State,
  TRANSITIONS,
} from "./model.js";
import { CHANGES, classifyCandidate } from "./publication.js";
import { lintTask } from "./task-lint.js";
import { applyBump, IMPACTS, isSemver, readingRule, selectBump } from "./versioning.js";

const REPO = "jveres/aad";

interface Spec {
  readonly version: string;
  readonly latest: { readonly version: string; readonly items: readonly string[] } | undefined;
  readonly diagram: string | undefined;
}

let guideVersion = "2.2.0";

// ── spec ─────────────────────────────────────────────────────────────────────

export function parseSpec(text: string): Spec | undefined {
  const version = /^---\r?\n(?:.*\r?\n)*?version:\s*(\d+\.\d+\.\d+)/m.exec(text)?.[1];
  if (!version) return undefined;
  const tail = text.split(/^## Latest Change\s*$/m)[1];
  const diagram = lifecycleSource(text);
  if (!tail) return { version, latest: undefined, diagram };
  const lines = tail.trim().split(/\r?\n/);
  const items: string[] = [];
  for (const line of lines.slice(1)) {
    if (/^-\s+/.test(line)) items.push(line.replace(/^-\s+/, ""));
    else if (line.trim() && items.length > 0) items[items.length - 1] += ` ${line.trim()}`;
  }
  return { version, latest: { version: lines[0]?.trim() ?? version, items }, diagram };
}

async function loadSpec(): Promise<void> {
  let spec: Spec | undefined;
  try {
    const res = await fetch("aad.md", { cache: "no-cache" });
    if (res.ok) spec = parseSpec(await res.text());
  } catch {
    spec = undefined;
  }
  const log = $("[data-changelog]");
  if (!spec) {
    log.replaceChildren(
      h("p", { class: "muted" }, "Could not read aad.md. See the spec on GitHub."),
    );
    renderVersion();
    machine.draw();
    return;
  }
  guideVersion = spec.version;
  machine.draw(spec.diagram ?? "");
  renderVersion();
  if (spec.latest) {
    log.replaceChildren(
      h("p", { class: "label" }, spec.latest.version),
      h("ul", {}, ...spec.latest.items.map((i) => h("li", {}, inline(i)))),
    );
  }
  lint.run();
  reading.run();
  bump.run();
}

function renderVersion(): void {
  for (const el of document.querySelectorAll("[data-version]")) el.textContent = `v${guideVersion}`;
  $("#adopt-cmd").textContent = [
    "mkdir -p wiki/tasks",
    `curl -fsSL https://raw.githubusercontent.com/${REPO}/v${guideVersion}/aad.md -o wiki/aad.md`,
  ].join(" && \\\n  ");
  const current = $<HTMLInputElement>("[data-read-current]");
  if (!current.value) current.value = guideVersion;
}

// ── §01 rules ────────────────────────────────────────────────────────────────

function renderRules(): void {
  $("[data-rules]").replaceChildren(
    ...CORE_RULES.map((r, i) =>
      h("li", {}, h("span", { class: "n" }, String(i + 1).padStart(2, "0")), h("span", {}, r)),
    ),
  );
}

function renderReference(): void {
  $("[data-reference]").replaceChildren(
    ...WORKING_REFERENCE.map(([activity, record, rule, anchor]) =>
      h(
        "tr",
        {},
        h("td", {}, activity),
        h("td", {}, record),
        h(
          "td",
          {},
          h("a", { href: `https://github.com/${REPO}/blob/main/aad.md#${anchor}` }, rule),
        ),
      ),
    ),
  );
}

// ── §02 repository ───────────────────────────────────────────────────────────

/** True when no later sibling follows TREE[i] before its parent's subtree ends. */
function isLastChild(i: number): boolean {
  const depth = TREE[i]?.depth ?? 0;
  for (let j = i + 1; j < TREE.length; j++) {
    const d = TREE[j]?.depth ?? 0;
    if (d < depth) return true;
    if (d === depth) return false;
  }
  return true;
}

/** Guide segments for a row, like `tree`: pipe or blank per ancestor level, then tee or elbow. */
function treeGuides(i: number): ("pipe" | "blank" | "tee" | "elbow")[] {
  const depth = TREE[i]?.depth ?? 0;
  if (depth === 0) return [];
  const guides: ("pipe" | "blank" | "tee" | "elbow")[] = [];
  for (let level = 1; level < depth; level++) {
    let ancestor = i;
    while ((TREE[ancestor]?.depth ?? 0) !== level) ancestor--;
    guides.push(isLastChild(ancestor) ? "blank" : "pipe");
  }
  guides.push(isLastChild(i) ? "elbow" : "tee");
  return guides;
}

function renderTree(): void {
  const list = $("[data-tree]");
  const detail = $("[data-tree-detail]");
  const select = (i: number) => {
    const node = TREE[i];
    if (!node) return;
    for (const [j, b] of list.querySelectorAll("button").entries()) {
      b.setAttribute("aria-pressed", String(j === i));
    }
    detail.replaceChildren(
      h("p", { class: "label" }, node.optional ? "path · optional" : "path"),
      h("h3", {}, h("code", {}, node.name)),
      h("p", {}, inline(node.purpose)),
      ...(node.source
        ? [h("p", { class: "label" }, "accepted source for"), h("p", {}, node.source)]
        : []),
      ...(node.sample
        ? [
            h("p", { class: "label" }, `example · ${node.sample.file}`),
            h("pre", { class: "sample" }, h("code", {}, node.sample.text)),
          ]
        : []),
    );
  };
  list.replaceChildren(
    ...TREE.map((node, i) =>
      h(
        "li",
        {},
        h(
          "button",
          { type: "button", "aria-pressed": "false", onclick: () => select(i) },
          ...treeGuides(i).map((g) => h("span", { class: `guide ${g}`, "aria-hidden": "true" })),
          h("span", { class: "name" }, node.name),
          node.optional ? h("span", { class: "muted" }, "?") : null,
        ),
      ),
    ),
  );
  select(TREE.findIndex((n) => n.name === "tasks/"));
}

// ── §03 lifecycle ────────────────────────────────────────────────────────────

register(stateDiagram);

interface DiagramEdge {
  readonly from: State | "start";
  readonly to: State;
}

/** The lifecycle diagram source from aad.md §5 "States". */
export function lifecycleSource(md: string): string | undefined {
  return /```mermaid\r?\n(stateDiagram(?:-v2)?\r?\n[\s\S]*?)```/.exec(md)?.[1];
}

/** Transitions in source order; Pele numbers its edges `edge0…` in the same order. */
function diagramEdges(source: string): (DiagramEdge | undefined)[] {
  return [...source.matchAll(/^\s*(\[\*\]|\w+)\s*-->\s*(\w+)/gm)].map(([, from = "", to = ""]) => {
    if (!isState(to)) return undefined;
    if (from === "[*]") return { from: "start", to };
    return isState(from) ? { from, to } : undefined;
  });
}

function edgeClass(edge: DiagramEdge): string {
  if (edge.from === "start") {
    const c = CREATION.find((x) => x.status === edge.to);
    return `creation ${c?.classification ?? "routine"}`;
  }
  return classifyTransition(edge.from, edge.to).classification;
}

const machine = {
  current: "todo" as State,
  steps: 0,
  source: undefined as string | undefined,
  width: 0,

  init(): void {
    $("[data-reset]").addEventListener("click", () => this.reset());
    const host = $("[data-machine]");
    let timer = 0;
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(host.clientWidth - this.width) > 24) this.draw();
      }, 120);
    }).observe(host);
    this.reset();
  },

  /** Renders the spec's state diagram with Pele, then wires the states for interaction. */
  draw(source?: string): void {
    if (source !== undefined) this.source = source;
    const host = $("[data-machine]");
    if (!this.source) {
      host.replaceChildren(
        h("p", { class: "muted" }, "Diagram unavailable: could not read aad.md."),
      );
      return;
    }
    this.width = host.clientWidth;
    let svg: string;
    try {
      svg = render(this.source.replace(/^(stateDiagram(?:-v2)?)\s*$/m, "$1\n    direction LR"), {
        idPrefix: "lifecycle",
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--mono").trim(),
        fontSize: 13,
        maxWidth: this.width,
        padding: 12,
        // Below Pele's vertical breakpoint, keep natural size and let the panel scroll.
        responsive: this.width >= 640,
      }).svg;
    } catch (err) {
      host.replaceChildren(h("p", { class: "muted" }, `Diagram error: ${String(err)}`));
      return;
    }
    const el = document.importNode(
      new DOMParser().parseFromString(svg, "image/svg+xml").documentElement,
      true,
    );
    const edges = diagramEdges(this.source);
    for (const g of el.querySelectorAll<SVGGElement>(".pele-edge, .pele-edge-label")) {
      const edge = edges[Number(g.dataset.id?.replace("edge", ""))];
      if (!edge) continue;
      g.dataset.from = edge.from;
      g.dataset.to = edge.to;
      g.classList.add(...edgeClass(edge).split(" "));
    }
    for (const g of el.querySelectorAll<SVGGElement>(".pele-node.pele-state")) {
      const st = g.dataset.id ?? "";
      if (!isState(st)) continue;
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${BOARD_LABEL[st]}: ${STATE_MEANING[st]}`);
      g.addEventListener("click", () => this.attempt(st));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.attempt(st);
        }
      });
    }
    host.replaceChildren(el);
    this.render();
  },

  reset(): void {
    this.current = "todo";
    this.steps = 0;
    $<HTMLInputElement>("[data-approval]").checked = false;
    const creation = CREATION.map(
      (c) => `${c.status}${c.classification === "routine" ? "" : "*"}`,
    ).join(" | ");
    $("[data-log]").replaceChildren();
    this.log("info", `create task → todo   (creation allowed in: ${creation}; * needs approval)`);
    this.render();
  },

  log(kind: string, text: string): void {
    const n = String(this.steps).padStart(2, "0");
    const li = h("li", { class: kind }, h("span", { class: "n" }, n), text);
    const log = $("[data-log]");
    log.prepend(li);
    while (log.children.length > 8) log.lastElementChild?.remove();
  },

  attempt(to: State): void {
    const from = this.current;
    if (from === to) {
      this.log("info", `${from} → ${to}   no-op: keeping the same status is not a transition`);
      return;
    }
    this.steps++;
    const v = classifyTransition(from, to);
    const approval = $<HTMLInputElement>("[data-approval]");
    if (v.classification === "invalid") {
      this.log(
        "invalid",
        `${from} → ${to}   REJECTED  unlisted transition${approval.checked ? " (approval ignored)" : ""}`,
      );
      return;
    }
    if (v.classification === "approval-sensitive" && !approval.checked) {
      this.log(
        "approval-sensitive",
        `${from} → ${to}   BLOCKED   needs authorized approval; stays in ${from}`,
      );
      return;
    }
    this.current = to;
    if (v.classification === "approval-sensitive") approval.checked = false;
    const next = to === "done" ? "Next: None" : "Next: <action>";
    this.log(v.classification, `${from} → ${to}   ok  ${v.classification}  · ${next}`);
    this.render();
  },

  render(): void {
    const cur = this.current;
    $("[data-current]").textContent = `${cur} · ${BOARD_LABEL[cur]}`;
    for (const g of document.querySelectorAll<SVGGElement>(
      "[data-machine] .pele-node.pele-state",
    )) {
      g.classList.toggle("on", g.dataset.id === cur);
    }
    for (const g of document.querySelectorAll<SVGGElement>(
      "[data-machine] .pele-edge, [data-machine] .pele-edge-label",
    )) {
      g.classList.toggle("live", g.dataset.from === cur);
    }
    $("[data-targets]").replaceChildren(
      ...STATES.filter((st) => st !== cur).map((to) => {
        const v = classifyTransition(cur, to);
        return h(
          "button",
          {
            type: "button",
            class: `target ${v.classification}`,
            onclick: () => this.attempt(to),
            title: v.reason,
          },
          h("span", {}, `→ ${to}`),
          h("span", { class: "tag-sm" }, v.classification),
        );
      }),
    );
  },
};

// ── §04 lint ─────────────────────────────────────────────────────────────────

const lint = {
  init(): void {
    const input = $<HTMLTextAreaElement>("[data-lint-input]");
    input.value = SAMPLE_TASK;
    input.addEventListener("input", () => this.run());
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || e.shiftKey) return;
      e.preventDefault();
      input.setRangeText("  ", input.selectionStart, input.selectionEnd, "end");
      this.run();
    });
    $("[data-lint-file]").addEventListener("input", () => this.run());
    $("[data-lint-prev]").addEventListener("change", () => this.run());
    $("[data-lint-reset]").addEventListener("click", () => {
      input.value = SAMPLE_TASK;
      $<HTMLSelectElement>("[data-lint-prev]").value = "in_progress";
      this.run();
    });
    this.run();
  },

  run(): void {
    const text = $<HTMLTextAreaElement>("[data-lint-input]").value;
    const file = $<HTMLInputElement>("[data-lint-file]").value.trim() || "task.md";
    const prev = $<HTMLSelectElement>("[data-lint-prev]").value;
    const result = lintTask(text, {
      fileName: file,
      previous: isState(prev) ? prev : undefined,
      guideVersion,
    });
    const errors = result.diagnostics.filter((d) => d.severity === "error").length;
    const warnings = result.diagnostics.filter((d) => d.severity === "warning").length;
    const summary = $("[data-lint-summary]");
    summary.className = errors ? "bad" : warnings ? "warn" : "good";
    summary.textContent =
      errors || warnings ? `${errors} error(s), ${warnings} warning(s)` : "structure valid";
    const out = $("[data-lint-out]");
    out.replaceChildren(
      ...result.diagnostics.map((d) =>
        h(
          "li",
          { class: d.severity },
          h("span", { class: "loc" }, `${file}:${d.line}`),
          h("span", { class: "sev" }, d.severity),
          h("span", { class: "msg" }, inline(d.message)),
          h("span", { class: "rule" }, d.rule),
        ),
      ),
    );
    if (result.diagnostics.length === 0) {
      out.append(
        h(
          "li",
          { class: "ok" },
          h("span", { class: "msg" }, "No structural findings. Scope still needs review."),
        ),
      );
    }
  },
};

// ── §05 publication ──────────────────────────────────────────────────────────

function renderPublication(): void {
  const form = $<HTMLFormElement>("[data-changes]");
  const groups = [...new Set(CHANGES.map((c) => c.group))];
  form.replaceChildren(
    ...groups.map((g) =>
      h(
        "fieldset",
        {},
        h("legend", { class: "label" }, g),
        ...CHANGES.filter((c) => c.group === g).map((c) =>
          h(
            "label",
            { class: "check change", title: c.note },
            h("input", { type: "checkbox", name: c.id }),
            h("span", {}, c.label),
            h("span", { class: `dot ${c.classification}`, "aria-label": c.classification }),
          ),
        ),
      ),
    ),
  );
  const presets: readonly (readonly [string, readonly string[]])[] = [
    ["code + progress", ["code", "progress", "submit"]],
    ["code + completion", ["code", "complete"]],
    ["completion only", ["complete"]],
    ["rules + dependent task", ["rules", "depends"]],
  ];
  form.append(
    h(
      "div",
      { class: "presets" },
      h("span", { class: "label" }, "try"),
      ...presets.map(([name, ids]) =>
        h(
          "button",
          {
            type: "button",
            class: "ghost",
            onclick: () => {
              for (const el of form.querySelectorAll<HTMLInputElement>("input"))
                el.checked = ids.includes(el.name);
              update();
            },
          },
          name,
        ),
      ),
    ),
  );
  const out = $("[data-verdict]");
  const update = () => {
    const ids = [...form.querySelectorAll<HTMLInputElement>("input:checked")].map((i) => i.name);
    const v = classifyCandidate(ids);
    if (!v) {
      out.replaceChildren(
        h("p", { class: "label" }, "verdict"),
        h("p", { class: "muted" }, "Select the changes in the candidate."),
      );
      return;
    }
    const notes = CHANGES.filter((c) => ids.includes(c.id));
    out.replaceChildren(
      h("p", { class: "label" }, "verdict"),
      h("p", {}, h("span", { class: `tag ${v.classification}` }, v.classification)),
      h("p", { class: "path" }, v.path),
      h("p", { class: "label" }, "required"),
      h("ul", {}, ...v.steps.map((st) => h("li", {}, st))),
      h("p", { class: "label" }, "per change"),
      h(
        "ul",
        { class: "notes" },
        ...notes.map((c) =>
          h("li", {}, h("span", { class: `dot ${c.classification}` }), `${c.label}: ${c.note}`),
        ),
      ),
    );
  };
  form.addEventListener("change", update);
  update();
}

// ── §06 activities ───────────────────────────────────────────────────────────

function renderActivities(): void {
  const tabs = $("[data-tabs]");
  const body = $("[data-tab-body]");
  const select = (i: number, focus = false) => {
    const a = ACTIVITIES[i];
    if (!a) return;
    for (const [j, b] of tabs.querySelectorAll<HTMLButtonElement>("button").entries()) {
      b.setAttribute("aria-selected", String(j === i));
      b.tabIndex = j === i ? 0 : -1;
      if (j === i && focus) b.focus();
    }
    body.replaceChildren(
      h("p", { class: "lede-sm" }, a.summary),
      h("ol", { class: "steps" }, ...a.steps.map((st) => h("li", {}, h("span", {}, inline(st))))),
      h("p", { class: "note" }, a.note),
    );
  };
  tabs.replaceChildren(
    ...ACTIVITIES.map((a, i) =>
      h(
        "button",
        {
          type: "button",
          role: "tab",
          id: `tab-${a.id}`,
          onclick: () => select(i),
          onkeydown: (e: Event) => {
            const k = (e as KeyboardEvent).key;
            const d = k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0;
            if (d) select((i + d + ACTIVITIES.length) % ACTIVITIES.length, true);
          },
        },
        h("span", { class: "n" }, String(i + 1).padStart(2, "0")),
        a.name,
      ),
    ),
  );
  select(0);
}

// ── §07 startup & versioning ─────────────────────────────────────────────────

const reading = {
  init(): void {
    $("[data-startup]").replaceChildren(
      ...STARTUP.map((st) => h("li", {}, h("span", {}, inline(st)))),
    );
    for (const sel of [
      "[data-read-known]",
      "[data-read-current]",
      "[data-read-content]",
      "[data-read-diff]",
    ]) {
      $(sel).addEventListener("input", () => this.run());
    }
    $<HTMLInputElement>("[data-read-known]").value = "2.0.0";
    this.run();
  },
  run(): void {
    const known = $<HTMLInputElement>("[data-read-known]").value.trim();
    const current = $<HTMLInputElement>("[data-read-current]").value.trim() || guideVersion;
    const out = $("[data-read-out]");
    if (!isSemver(current)) {
      out.replaceChildren(
        h("span", { class: "tag invalid" }, "input"),
        " Current version must be MAJOR.MINOR.PATCH.",
      );
      return;
    }
    const v = readingRule({
      known: known || undefined,
      current,
      contentChanged: $<HTMLInputElement>("[data-read-content]").checked,
      diffAvailable: $<HTMLInputElement>("[data-read-diff]").checked,
    });
    const label = {
      full: "read full guide",
      diff: "read guide diff",
      "content-diff": "read content diff",
      none: "no re-read",
    };
    out.replaceChildren(
      h(
        "span",
        { class: `tag ${v.action === "full" ? "approval-sensitive" : "routine"}` },
        label[v.action],
      ),
      " ",
      v.reason,
    );
  },
};

const bump = {
  init(): void {
    const form = $<HTMLFormElement>("[data-impacts]");
    form.replaceChildren(
      ...IMPACTS.map((i) =>
        h(
          "label",
          { class: "check" },
          h("input", { type: "checkbox", name: i.id }),
          h("span", {}, i.label),
          h("span", { class: "tag-sm" }, i.bump),
        ),
      ),
    );
    form.addEventListener("change", () => this.run());
    this.run();
  },
  run(): void {
    const ids = [
      ...$<HTMLFormElement>("[data-impacts]").querySelectorAll<HTMLInputElement>("input:checked"),
    ].map((i) => i.name);
    const b = selectBump(ids);
    const out = $("[data-bump-out]");
    if (!b) {
      out.replaceChildren(
        h("span", { class: "muted" }, `v${guideVersion} → select at least one impact`),
      );
      return;
    }
    out.replaceChildren(
      h("code", {}, `v${guideVersion} → v${applyBump(guideVersion, b)}`),
      " ",
      h(
        "span",
        {
          class: `tag ${b === "major" ? "invalid" : b === "minor" ? "approval-sensitive" : "routine"}`,
        },
        b,
      ),
      " The version number does not approve the change.",
    );
  },
};

// ── §08 adoption ─────────────────────────────────────────────────────────────

function renderAdoption(): void {
  const KEY = "aad.adopt";
  let done: number[] = [];
  try {
    done = JSON.parse(store.get(KEY) ?? "[]") as number[];
  } catch {
    done = [];
  }
  const list = $("[data-adopt]");
  const bar = $("[data-adopt-bar]");
  const update = () => {
    const boxes = [...list.querySelectorAll<HTMLInputElement>("input")];
    done = boxes.flatMap((b, i) => (b.checked ? [i] : []));
    store.set(KEY, JSON.stringify(done));
    bar.style.width = `${(done.length / ADOPTION.length) * 100}%`;
    bar.dataset.label = `${done.length}/${ADOPTION.length}`;
  };
  list.replaceChildren(
    ...ADOPTION.map((step, i) =>
      h(
        "li",
        {},
        h(
          "label",
          { class: "check" },
          h("input", { type: "checkbox", checked: done.includes(i), onchange: update }),
          h("span", { class: "n" }, String(i + 1).padStart(2, "0")),
          h("span", {}, inline(step)),
        ),
      ),
    ),
  );
  update();

  const filter = $<HTMLInputElement>("[data-case-filter]");
  const cases = $("[data-cases]");
  const render = () => {
    const q = filter.value.trim().toLowerCase();
    const rows = CASES.filter(([c, r]) => !q || `${c} ${r}`.toLowerCase().includes(q));
    cases.replaceChildren(
      ...rows.map(([c, r]) =>
        h("li", {}, h("p", {}, inline(c)), h("p", { class: "res" }, "⟶ ", inline(r))),
      ),
    );
    if (rows.length === 0) cases.append(h("li", { class: "muted" }, "No matching case."));
  };
  filter.addEventListener("input", render);
  render();
}

// ── chrome ───────────────────────────────────────────────────────────────────

function initChrome(): void {
  const root = document.documentElement;
  const saved = store.get("aad.theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  $("[data-theme-toggle]").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store.set("aad.theme", root.dataset.theme);
  });
  for (const btn of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
    btn.addEventListener("click", async () => {
      const src = document.querySelector(btn.dataset.copy ?? "");
      try {
        await navigator.clipboard.writeText(src?.textContent ?? "");
        btn.textContent = "copied";
      } catch {
        btn.textContent = "select + copy";
      }
      setTimeout(() => {
        btn.textContent = "copy";
      }, 1400);
    });
  }
}

initChrome();
renderVersion();
renderRules();
renderReference();
renderTree();
machine.init();
lint.init();
renderPublication();
renderActivities();
reading.init();
bump.init();
renderAdoption();
void loadSpec();
