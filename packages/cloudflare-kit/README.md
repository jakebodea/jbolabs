# Cloudflare kit

Shared server services and Alchemy helpers for the jbolabs site. Forked on 2026-10-09 from `packages/cloudflare-kit` in the `sites` repo, without its EmDash CMS modules. Both copies are meant to become the shared `@jakebodea/*` toolkit, so keep changes here easy to port back.

## Analytics and alerts

Spread `yield* webAnalytics(stage)` and `leadMail(stage, { emailFrom, inbox, fromName, alertInbox })` into the Worker bindings in `alchemy.run.ts`. Declare bindings with `KitEnv` from `./env`.

Render the prop-less `./astro/web-analytics-beacon.astro` in the public layout. Only prod's canonical hostname and its `www` form measure traffic. The stage helpers supply empty bindings on dev and preview.

Contact actions decode their site schema and call `submitContact` with `sourcePath`, `requestId` from `cf-ray` or `crypto.randomUUID()`, and optional `remoteIp`. Merge `LeadMailFromConfig` and `emailFromEnv(env.EMAIL)` into the contact layer with Turnstile and the site's lead store. The pipeline owns alert policy. Turnstile outages, save failures, and defects alert; rejected visitors do not. Inbox delivery failure logs and still succeeds because the lead is saved.

`stacks/github.ts` provisions the production Account Analytics Read token. The site stack passes the committed studio sender and alert inbox plus its inbox and display name to `leadMail`. Setting the verified `studio.sender` enables mail; otherwise failed leads remain recoverable in Workers Logs.

`./astro/worker-entry` swaps the site's `src/worker.ts` in for Alchemy's pinned Astro Worker entry, so the site can add crons and response headers.

See [ADR 0001](../../docs/adr/0001-client-site-analytics-and-alerting.md).
