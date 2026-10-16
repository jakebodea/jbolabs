---
name: verify
description: Definition of done for jbolabs changes. Use before claiming a task is complete or opening a PR.
---

# Verify

Run the cheapest checks that prove your change on the real surface. Output from `bun run app -- …` is JSON; artifacts live under `.artifacts/app/jbolabs/<stage>/`.

## Always

```bash
bun run ci
```

Zero lint warnings, typecheck, and tests. Markup copy checks (`check:copy`, `check:locality`) run as part of `bun run check`.

## Site changes

| You changed | Do |
| --- | --- |
| Templates, styles, copy (`src/content`), components | `bun run app -- smoke --no-submit` (server hot-reloads) |
| Contact pipeline, server code, islands, `alchemy.run.ts` | `bun run app -- restart`, then smoke |
| Anything visible | `bun run app -- screenshot <paths>` at 1280 and 375; read the PNGs |
| Meta, routes, SEO | `bun run app -- seo` |
| Panel / theme tokens | Smoke includes panel CTA token + dark-mode checks on `/` |

```bash
ALCHEMY_PROFILE=admin bun run app -- start
bun run app -- smoke --no-submit
bun run app -- seo
bun run app -- screenshot / /about
```

Deployed stage: `bun run app -- smoke --url https://…`

## Stacks

Never deploy without Jake's go-ahead. Read-only:

```bash
ALCHEMY_PROFILE=admin bun run plan:studio | plan:mail | plan:github
```

## PR body

List what you ran, paths or URLs checked, and anything you could not verify.
