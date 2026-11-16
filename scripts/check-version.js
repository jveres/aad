// Fails when package.json, package-lock.json, aad.md, schemas, samples, README,
// and (on a tag build) the Git tag disagree.
import { readFileSync } from "node:fs";
import { readAadVersion } from "./aad-version.js";

const aad = readAadVersion();
const pkgJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const pkg = pkgJson.version;
const biomeVer = pkgJson.devDependencies?.["@biomejs/biome"];
const tsVer = pkgJson.devDependencies?.typescript;
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const biomeCfg = JSON.parse(readFileSync(new URL("../biome.json", import.meta.url), "utf8"));
const errors = [];

if (pkg !== aad) errors.push(`package.json version ${pkg} != aad.md version ${aad}`);
if (lock.version !== aad)
  errors.push(`package-lock.json version ${lock.version} != aad.md version ${aad}`);
if (lock.packages?.[""]?.version !== aad)
  errors.push(
    `package-lock.json packages[""].version ${lock.packages?.[""]?.version} != aad.md version ${aad}`,
  );
if (biomeVer && biomeCfg.$schema !== `https://biomejs.dev/schemas/${biomeVer}/schema.json`) {
  errors.push(`biome.json $schema (${biomeCfg.$schema}) does not match @biomejs/biome ${biomeVer}`);
}

const latest = readFileSync(new URL("../aad.md", import.meta.url), "utf8").split(
  /^## Latest Change\s*$/m,
)[1];
if (!latest?.trim().startsWith(aad))
  errors.push(`aad.md "Latest Change" does not start with ${aad}`);

const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const fallback = /let guideVersion = "([^"]+)"/.exec(main)?.[1];
if (fallback !== aad)
  errors.push(`src/main.ts fallback version ${fallback} != aad.md version ${aad}`);

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
for (const needle of [
  `spec-v${aad}-`,
  `(version ${aad})`,
  `/v${aad}/aad.md`,
  `/v${aad}/wiki/schemas/$f`,
  `aad_version: ${aad}`,
  `| [TypeScript](https://www.typescriptlang.org/) | ${tsVer}`,
  `| [Biome](https://biomejs.dev/) | ${biomeVer} |`,
]) {
  if (!readme.includes(needle)) errors.push(`README.md does not mention ${needle}`);
}

const taskSchema = readFileSync(new URL("../wiki/schemas/task.schema.md", import.meta.url), "utf8");
if (!taskSchema.includes(`aad_version: ${aad}`))
  errors.push(`wiki/schemas/task.schema.md does not record aad_version: ${aad}`);

const content = readFileSync(new URL("../src/content.ts", import.meta.url), "utf8");
if (!content.includes(`aad_version: ${aad}`))
  errors.push(`src/content.ts SAMPLE_TASK does not record aad_version: ${aad}`);

const samples = readFileSync(new URL("../src/samples.ts", import.meta.url), "utf8");
for (const needle of [`AAD ${aad} rules`, `version: ${aad}`, `aad_version: ${aad}`]) {
  if (!samples.includes(needle)) errors.push(`src/samples.ts does not mention ${needle}`);
}
for (const m of samples.matchAll(/aad_version:\s*(\d+\.\d+\.\d+)/g)) {
  if (m[1] !== aad) errors.push(`src/samples.ts has stale aad_version: ${m[1]} (expected ${aad})`);
}

const ref = process.env.GITHUB_REF ?? "";
if (ref.startsWith("refs/tags/") && ref !== `refs/tags/v${aad}`) {
  errors.push(`tag ${ref.slice(10)} != v${aad}`);
}

if (errors.length > 0) {
  for (const e of errors) console.error(`version: ${e}`);
  process.exit(1);
}
console.log(
  `version: ${aad} (aad.md, package.json, package-lock.json, schemas, samples${ref.startsWith("refs/tags/") ? ", tag" : ""})`,
);
