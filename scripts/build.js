// Publishes the spec next to the page so the site reads the version from one source.
import { copyFileSync, cpSync, rmSync } from "node:fs";
import { readAadVersion } from "./aad-version.js";

copyFileSync(new URL("../aad.md", import.meta.url), new URL("../public/aad.md", import.meta.url));

// Vendor Pele's ES modules: the core, the state diagram, and their shared chunks.
const pele = new URL("../node_modules/pele/dist/esm/", import.meta.url);
const vendor = new URL("../public/vendor/pele/", import.meta.url);
rmSync(vendor, { recursive: true, force: true });
cpSync(new URL("chunks/", pele), new URL("chunks/", vendor), { recursive: true });
cpSync(new URL("core.js", pele), new URL("core.js", vendor));
cpSync(new URL("diagrams/state.js", pele), new URL("diagrams/state.js", vendor));

console.log(`build: public/ ready (AAD ${readAadVersion()})`);
