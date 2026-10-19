// Publishes the spec next to the page so the site reads the version from one source.
import { copyFileSync } from "node:fs";
import { readAadVersion } from "./aad-version.js";

copyFileSync(new URL("../aad.md", import.meta.url), new URL("../public/aad.md", import.meta.url));
console.log(`build: public/ ready (AAD ${readAadVersion()})`);
