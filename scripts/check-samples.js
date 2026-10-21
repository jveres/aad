// Fails when a §02 sample marked `fromSpec` is no longer a verbatim code block of aad.md
// or wiki/schemas/*.md, or when a tree path has no sample. Runs after `tsc` (reads public/js).
import { readdirSync, readFileSync } from "node:fs";

const spec = readFileSync(new URL("../aad.md", import.meta.url), "utf8");
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
const { TREE } = await import("../public/js/content.js");
const errors = [];

for (const node of TREE) {
  const sample = SAMPLES[node.name];
  if (!sample) errors.push(`${node.name}: no sample`);
  else if (sample.fromSpec && !blocks.has(sample.text)) {
    errors.push(`${node.name}: sample is marked fromSpec but differs from aad.md / wiki/schemas/`);
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(`samples: ${e}`);
  process.exit(1);
}
console.log(`samples: ${TREE.length} paths, all present; spec and schema samples verified`);
