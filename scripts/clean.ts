/**
 * Remove all generated files.
 *
 * Usage: npx tsx scripts/clean.ts
 */

import { rmSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

const targets = [
  ".wrangler",
  "lex.config.js",
  "lexicons-pulled",
  "lexicons-generated",
  "src/lexicon-types",
  "src/core/queryable.generated.ts",
];

for (const target of targets) {
  rmSync(join(ROOT, target), { recursive: true, force: true });
  console.log(`  removed ${target}`);
}

console.log("Done.");
