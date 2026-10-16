# Alchemy beta.82 upgrade

This repository pins `alchemy` and `@alchemy.run/frontend-frameworks` to `2.0.0-beta.82` in the Bun catalog and lockfile. Effect, platform-bun, platform-node and vitest remain pinned to `4.0.0`, satisfying beta.82's `^4.0.0` peer requirements. Use Bun (the repo pins 1.4.2) or Node >=24.11.1; all existing Alchemy commands and CI paths use the installed, locked version through Bun.

Source: [beta.82 release notes](https://alchemy.run/blog/2026-10-12-beta-82/).

## Changes that apply here

- Enable Workers Issues on the website and Mailflare alongside their existing observability settings. Website logs remain fully sampled, persisted and include invocation logs; traces remain sampled at 10% in production and 100% elsewhere. Mailflare retains its existing `enabled: true` observability default.
- Retain the custom Astro Worker entry alias: beta.82 still pins the adapter entry. The local contact action and cron smoke checks verify the custom wrapper runs.
- Keep `Cloudflare.Email.CatchAll` for Mailflare. The ordinary `Email.Rule` fixes exclude the catch-all singleton from enumeration/deletion and reconcile existing rules by matcher identity. No routing declarations, destinations or resources need changing, and no live rule adoption is performed by this upgrade.
- Alchemy's Workers AI streaming fixes apply to its Effect AI adapter. The studio website does not call AI. Mailflare uses upstream `ai` / `workers-ai-provider` against a native AI binding, separately built by its own toolchain; this upgrade does not change or claim to repair that streaming implementation.
- Keep classic session KV. Switching to Instant would replace a namespace without copying data. Other new infrastructure features are not needed here.

## Mailflare and Durable Object coverage

`mailflare/` remains at upstream commit `83ade981e588bd7d693fe4a14850a844bcd8984a`. Its vinext beta toolchain is unchanged: Alchemy's new `Website.Vinext` integration does not build it. `mailflare:build` uses the submodule's npm lockfile and produces `dist/server/index.js` and assets. `stacks/mail.ts` uploads those modules with `bundle: false` and the existing compatibility flags. Do not replace this with rebundling or manual Worker exports.

The `REALTIME` binding still names `RealtimeHub`. The prebuilt entry exports that class itself, as required for `bundle: false`. Beta.82's provider computes Cloudflare declarative DO metadata from the binding and observed namespace storage; its prebuilt reader keeps file contents unchanged. Existing namespaces must retain their observed storage and identity during the authorized rollout.

Local validation performed for this upgrade, beyond the website CI:

- `bun run mailflare:build` passed with upstream bundler/deprecation warnings.
- Beta.82's `readPrebuiltWorkerBundle` read 708 server modules; every module matched its source bytes and the entry exported `RealtimeHub` and `default`.
- The complete prebuilt module set loaded in a local Miniflare runtime with declarative `RealtimeHub` SQLite exports and a `REALTIME` binding. Direct DO `/connect` returned 426 with `Expected WebSocket upgrade`; an authenticated WebSocket upgraded with 101 and returned `pong` for `ping`.
- The submodule remained clean after the build and runtime proof.

These checks prove packaging and local DO compatibility, not an existing live namespace migration, email delivery, queues, attachments, AI calls or the shared state-store upgrade. The current GitHub `check` job typechecks `stacks/mail.ts` but builds/tests the website and workspace packages only; it does not initialize or build Mailflare and does not run this local DO proof. Re-run the Mailflare build and local runtime proof when its pinned commit or Worker bindings change.

## Coordinated rollout (requires Jake's go-ahead)

1. Upgrade every developer checkout and CI deploy/preview/cleanup path to beta.82 or newer before any cloud-backed command. Coordinate other repositories using the same account's `Cloudflare.state()` too: its shared state Worker/DO is in scope even for stacks whose application Worker has no Durable Objects.
2. Keep this PR draft until that coordination and deployment authorization are complete. Merging main can automatically deploy production. Do not add the `preview` label to this PR, dispatch workflows, rerun old deployment jobs, or close/unlabel previews using older main: cleanup can initialize cloud state even when no preview Worker exists.
3. With explicit authorization, review the live diff and state-store bootstrap together. `Cloudflare.state()` may deploy/update its Worker while loading state; a cloud-backed `alchemy plan` is not a guaranteed read-only operation. No such plans, bootstrap, deployments or migrations ran for this upgrade.
4. The first deployment of each affected DO Worker must use 100% traffic. This repo currently has no `version.traffic` configuration; preserve that for the first deployment. Include the shared state Worker and Mailflare, not only the site.
5. Once declarative exports have deployed, never deploy that Worker using Alchemy older than beta.82. For an application rollback, keep upgraded deploy tooling and the DO exports intact; do not replay an old CI run or revert the lockfile. Removing a DO binding alone no longer deletes its namespace while the class remains exported. Do not remove `RealtimeHub`, rename stacks/resources, adopt live resources or delete state as part of this upgrade.

Stack identities stay `studio/shared`, `mail/prod`, `jbolabs` and `jbolabs-ci/ci`. Credentials, access policies, domain ownership and the upstream submodule are unchanged.

## Website validation

`bun run ci` passed with zero lint warnings, all workspace/root typechecks and 112 tests. `bun run build` passed without Cloudflare credentials. Local Alchemy dev smoke passed all sitemap pages, 404, images, contact submission and cron; SEO reported zero errors and warnings across four pages. Home and contact screenshots at 1280 and 375 had no broken images or browser console errors and were inspected.
