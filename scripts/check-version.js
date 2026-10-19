// Fails when package.json, aad.md, and (on a tag build) the Git tag disagree.
import { readFileSync } from "node:fs";
import { readAadVersion } from "./aad-version.js";

const aad = readAadVersion();
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const errors = [];

if (pkg !== aad) errors.push(`package.json version ${pkg} != aad.md version ${aad}`);

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
for (const needle of [`spec-v${aad}-`, `/v${aad}/aad.md`]) {
  if (!readme.includes(needle)) errors.push(`README.md does not mention ${needle}`);
}

const ref = process.env.GITHUB_REF ?? "";
if (ref.startsWith("refs/tags/") && ref !== `refs/tags/v${aad}`) {
  errors.push(`tag ${ref.slice(10)} != v${aad}`);
}

if (errors.length > 0) {
  for (const e of errors) console.error(`version: ${e}`);
  process.exit(1);
}
console.log(`version: ${aad} (aad.md, package.json${ref.startsWith("refs/tags/") ? ", tag" : ""})`);
