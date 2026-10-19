import { readFileSync } from "node:fs";

/** Reads the `version` field from the YAML header of `aad.md`. */
export function readAadVersion(path = new URL("../aad.md", import.meta.url)) {
  const text = readFileSync(path, "utf8");
  const match = /^---\r?\n(?:.*\r?\n)*?version:\s*(\d+\.\d+\.\d+)\s*\r?\n(?:.*\r?\n)*?---/m.exec(
    text,
  );
  if (!match?.[1]) throw new Error("aad.md: missing `version` in the YAML header");
  return match[1];
}
