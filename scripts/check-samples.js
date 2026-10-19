// Fails when a §02 sample marked `fromSpec` is no longer a verbatim code block of aad.md,
// or when a tree path has no sample. Runs after `tsc` (reads public/js).
import { readFileSync } from "node:fs";

const spec = readFileSync(new URL("../aad.md", import.meta.url), "utf8");
const blocks = [...spec.matchAll(/```\w*\n([\s\S]*?)```/g)].map((m) => m[1]);
const { SAMPLES } = await import("../public/js/samples.js");
const { TREE } = await import("../public/js/content.js");
const errors = [];

for (const node of TREE) {
  const sample = SAMPLES[node.name];
  if (!sample) errors.push(`${node.name}: no sample`);
  else if (sample.fromSpec && !blocks.includes(sample.text)) {
    errors.push(`${node.name}: sample is marked fromSpec but differs from aad.md`);
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(`samples: ${e}`);
  process.exit(1);
}
console.log(`samples: ${TREE.length} paths, all present; spec samples match aad.md`);
