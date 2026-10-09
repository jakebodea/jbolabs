# jbolabs

Jake's own studio infrastructure on Cloudflare, managed with Alchemy v2. Client work lives in `~/code/projects/sites`.

| Path | What lives there |
| --- | --- |
| `stacks/studio.ts` | jbolabs.com: registrar, zone, `mail.jbolabs.com` sending subdomain (the sites send from it), Email Routing. Stack `studio`, stage `shared` |
| `stacks/mail.ts` | Mailflare at inbox.jbolabs.com: Worker, D1, R2, queues, catch-all routing, apex sending + DMARC for every domain in `mailDomains`. Stack `mail`, stage `prod` |
| `stacks/config.ts` | Account, hostnames, and the domains Mailflare receives for |
| `mailflare/` | Upstream Mailflare as a git submodule, unmodified. Built with its own toolchain, uploaded with `bundle: false` |

## Commands

```bash
ALCHEMY_PROFILE=admin bun run plan:studio
ALCHEMY_PROFILE=admin bun run deploy:studio
ALCHEMY_PROFILE=admin bun run plan:mail     # builds mailflare/ first
ALCHEMY_PROFILE=admin bun run deploy:mail
bun run typecheck
```

Update Mailflare: `git -C mailflare pull origin main`, check its `wrangler.jsonc` for new bindings and mirror them in `stacks/mail.ts`, deploy, then apply pending database migrations from Mailflare's Admin settings.

## Rules

- Every resource and setting changes only through `alchemy deploy`. No dashboard, `wrangler`, or raw API writes. Mailflare's own runtime token (`CF_TOKEN`, minted in `stacks/mail.ts`) is the one exception: its domain onboarding writes the same settings this repo declares.
- Never deploy or destroy without Jake's explicit go-ahead.
- Don't rename the `studio` stack or its `shared` stage: its state predates this repo.
- `.env` holds `FORWARD_TO` (the verified Gmail destination). Never print or commit it.
