/**
 * Build inputs: per-stage values the Astro build needs (the public origin).
 * The stack writes them to `.build-inputs.json`
 * before Alchemy builds the site; local tooling writes the same file. The file
 * is gitignored but listed in the site's Alchemy `memo` globs, so changing a
 * value triggers a rebuild.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Schema } from "effect";

export const BUILD_INPUTS_FILE = ".build-inputs.json";

const Value = Schema.optionalKey(Schema.NonEmptyString);

export const BuildInputs = Schema.Struct({
  /** Public origin of the stage, e.g. `https://example.com`. */
  origin: Value,
});
export type BuildInputs = typeof BuildInputs.Type;

const decode = Schema.decodeUnknownSync(Schema.fromJsonString(BuildInputs));

export const readBuildInputs = (root: string): BuildInputs => {
  const file = path.join(root, BUILD_INPUTS_FILE);
  return existsSync(file) ? decode(readFileSync(file, "utf-8")) : {};
};

/** Writes only when the content changes, so unchanged inputs keep the build memoized. */
export const writeBuildInputs = (root: string, inputs: BuildInputs): void => {
  const file = path.join(root, BUILD_INPUTS_FILE);
  const next = `${JSON.stringify(inputs, null, 2)}\n`;
  if (!existsSync(file) || readFileSync(file, "utf-8") !== next) {
    writeFileSync(file, next);
  }
};
