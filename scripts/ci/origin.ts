/**
 * Prints the public origin of a jbolabs stage, so CI can verify a deploy
 * without parsing Alchemy's output: `https://jbolabs.com` for prod, the
 * workers.dev URL for anything else.
 *
 *   bun scripts/ci/origin.ts <stage>
 */
import { resolveStage } from "@jakebodea/cloudflare-kit/infra/stage";

import { site } from "../../apps/jbolabs/site.config.ts";

export const stageOrigin = (stage: string): string =>
  resolveStage(site, stage).origin;

if (import.meta.main) {
  const [stage] = process.argv.slice(2);
  if (stage === undefined) {
    throw new Error("Usage: bun scripts/ci/origin.ts <stage>");
  }
  process.stdout.write(`${stageOrigin(stage)}\n`);
}
