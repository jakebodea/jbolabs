/**
 * Custom Worker entry for an Astro site on Alchemy.
 *
 * Alchemy's `Cloudflare.Website.Astro` injects its own Cloudflare adapter and
 * pins the Worker entry. This Vite alias swaps in the site's own entry so it
 * can add cron handlers and response headers. Verified with Alchemy and its
 * frontend-frameworks package at 2.0.0-beta.80; delete it when Alchemy
 * supports a custom Worker entry for Astro.
 */

export interface AliasEntry {
  readonly find: RegExp;
  readonly replacement: string;
}

/**
 * Alchemy pins its own Worker entry; this swaps in the site's `src/worker.ts`.
 * The site's entry wraps Alchemy's handler,
 * imported as `@alchemy.run/frontend-frameworks/astro/entrypoints/server.js`
 * (the `.js` spelling escapes this alias), to add crons and response headers.
 */
export const workerEntryAlias = (workerEntry: string): AliasEntry => ({
  find: /^@alchemy\.run\/frontend-frameworks\/astro\/entrypoints\/server$/u,
  replacement: workerEntry,
});
