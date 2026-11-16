// Fails when a §02 sample marked `fromSpec` is no longer a verbatim code block of aad.md
// or wiki/schemas/*.md, when a tree path has no sample, or when condensed content in
// src/content.ts (adoptPrompt, CORE_RULES, CASES) drifts from aad.md / README.md.
// Runs after `tsc` (reads public/js).
import { readdirSync, readFileSync } from "node:fs";
import { readAadVersion } from "./aad-version.js";

const aad = readAadVersion();
const spec = readFileSync(new URL("../aad.md", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const schemasDir = new URL("../wiki/schemas/", import.meta.url);
const schemaFiles = readdirSync(schemasDir)
  .filter((n) => n.endsWith(".md"))
  .map((n) => readFileSync(new URL(n, schemasDir), "utf8"));

const blocks = new Set([
  ...[spec, ...schemaFiles].flatMap((doc) =>
    [...doc.matchAll(/```\w*\n([\s\S]*?)```/g)].map((m) => m[1]),
  ),
  ...schemaFiles,
]);

const { SAMPLES } = await import("../public/js/samples.js");
const { adoptPrompt, CASES, CORE_RULES, TREE } = await import("../public/js/content.js");
const errors = [];

for (const node of TREE) {
  const sample = SAMPLES[node.name];
  if (!sample) errors.push(`${node.name}: no sample`);
  else if (sample.fromSpec && !blocks.has(sample.text)) {
    errors.push(`${node.name}: sample is marked fromSpec but differs from aad.md / wiki/schemas/`);
  }
}

if (!readme.includes(adoptPrompt("jveres/aad", aad))) {
  errors.push("adoptPrompt in src/content.ts differs from README.md");
}

for (const [i, rule] of CORE_RULES.entries()) {
  const line = `${i + 1}. ${rule}`;
  if (!spec.includes(line)) errors.push(`CORE_RULES[${i}] differs from aad.md: ${line}`);
  if (!readme.includes(line)) errors.push(`CORE_RULES[${i}] differs from README.md: ${line}`);
}

const specCasesSection = spec.split(/^### Adoption Decision Cases\s*$/m)[1] ?? "";
const specCases = [...specCasesSection.matchAll(/^\| ([^|]+) \| ([^|]+) \|$/gm)]
  .slice(1)
  .map((m) => [m[1].trim(), m[2].trim()]);

if (specCases.length !== CASES.length) {
  errors.push(`CASES length ${CASES.length} != aad.md table length ${specCases.length}`);
}
for (let i = 0; i < Math.max(specCases.length, CASES.length); i++) {
  const sc = specCases[i];
  const cc = CASES[i];
  if (!sc || !cc || sc[0] !== cc[0] || sc[1] !== cc[1]) {
    errors.push(`CASES[${i}] differs from aad.md: ${JSON.stringify(cc)} != ${JSON.stringify(sc)}`);
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(`samples: ${e}`);
  process.exit(1);
}
console.log(
  `samples: ${TREE.length} paths, ${CASES.length} decision cases, rules, and prompt verified`,
);
