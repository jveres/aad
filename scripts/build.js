// Publishes the spec and schemas next to the page so the site reads from one source.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { readAadVersion } from "./aad-version.js";

copyFileSync(new URL("../aad.md", import.meta.url), new URL("../public/aad.md", import.meta.url));
const schemasSrc = new URL("../wiki/schemas/", import.meta.url);
const schemasDest = new URL("../public/schemas/", import.meta.url);
mkdirSync(schemasDest, { recursive: true });
for (const name of readdirSync(schemasSrc)) {
  if (name.endsWith(".md")) {
    copyFileSync(new URL(name, schemasSrc), new URL(name, schemasDest));
  }
}
console.log(`build: public/ ready (AAD ${readAadVersion()})`);
