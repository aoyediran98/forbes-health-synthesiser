import { readFileSync } from "node:fs";
import path from "node:path";
import { companies } from "./companies";

// Sample datasets are read at build time, so the pages stay static.
export function loadSamples() {
  return companies.map((entry) => ({
    ...entry,
    text: readFileSync(
      path.join(process.cwd(), "src", "data", `${entry.slug}.txt`),
      "utf8",
    ).trim(),
  }));
}
