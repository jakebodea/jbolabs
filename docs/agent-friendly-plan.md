# Agent-friendly plan for jbolabs

**Goal:** When a coding agent gets something wrong here, fix it at the highest layer that can stick—code and types first, then lint/CI/tests, then prose, then human review.

**Evidence window:** All 46 commits on `main` (through `d8e2829`), all 10 GitHub PRs on `jbolabs/jbolabs`, and the imported `apps/jbolabs` history from `jbolabs/sites` (especially PRs #23–#24, #30–#31, #33, #39). There are **no inline PR review comments** on this repo yet; corrections show up as follow-up PRs, fix commits, and Jake-authored reverts.

**pstack:** The Cursor `pstack` skills (`poteto-mode`, `correct`, `architect`) are not installed in this environment. This plan follows the same inverse-pyramid idea by hand.

---

## What keeps going wrong

| # | Pattern | Evidence (count / links) | Typical agent mistake |
| --- | --- | --- | --- |
| A | **Infrastructure assumed uniform across zones** | Initial mail stack (`4ff9871`); production incident fixed in [PR #1](https://github.com/jbolabs/jbolabs/pull/1) (`7d4b031`) | Deploy `stacks/mail.ts` for every domain the same way; duplicate `_dmarc` broke shouldertap.app |
| B | **Wrong design tokens for surface context** | [PR #3](https://github.com/jbolabs/jbolabs/pull/3) (`d69ede7`, `60038ea`); [PR #9](https://github.com/jbolabs/jbolabs/pull/9) (`1217137`) | Use page tokens (`bg-background`) on `bg-panel` or stale `theme-color` hex |
| C | **Geo copy scattered, then rolled back** | [PR #2](https://github.com/jbolabs/jbolabs/pull/2) (`e447ffd`) → [PR #8](https://github.com/jbolabs/jbolabs/pull/8) (`fb9b6e9`) within 5 days | Repeat “Orange County / Irvine” outside About after Jake narrowed placement |
| D | **Motion / nav over-iteration** | 8 commits (`7a3b145`…`564d8fc`), **1 Jake revert** (`8f7321c`) | Large CSS/animation rewrites instead of small deltas; Jake restored pre-`/animate` menu |
| E | **Operational docs stripped on refactor** | Jake fix `7bab61a` (Co-Authored-By Claude) | Delete “why” comments in `worker.ts` / contact pipeline during analytics work |
| F | **Config drift vs reality** | [PR #10](https://github.com/jbolabs/jbolabs/pull/10) (`d8e2829`) | `stacks/config.ts` `repository.owner` still `jakebodea` after org move |
| G | **Verification tooling misapplied** | [PR #2](https://github.com/jbolabs/jbolabs/pull/2) reviewer notes | Use `bun run app -- screenshot` for portfolio WebPs (scrolls page → wrong sticky header state) |
| H | **Weak or missing automated checks** | `check-copy.ts` exists but **not** in `bun run ci` (contrast `jbolabs/sites` [PR #30](https://github.com/jbolabs/sites/pull/30)) | Em/en dashes and template-only copy slip past oxlint |
| I | **Deploy / plan semantics misunderstood** | [PR #6](https://github.com/jbolabs/jbolabs/pull/6) draft; `productionDeployRefusal` in `alchemy.run.ts` | Treat `alchemy plan` as always read-only; deploy mail/site stacks without Jake’s go-ahead |
| J | **Tests that don’t earn their place** | Ported patterns in `jbolabs/sites` [PR #23](https://github.com/jbolabs/sites/pull/23), [PR #24](https://github.com/jbolabs/sites/pull/24); enforced here via `oxlint-plugin-test-quality.ts` | Already partially addressed in this repo—keep parity when adding tests |

**Volume signal:** **28 / 46** commits (61%) carry `Co-Authored-By: Claude …`, so defaults and guardrails matter more than more AGENTS.md prose.

---

## Ranked fixes (leverage × effort)

Scale: **Leverage** H/M/L, **Effort** S/M/L. Ordered by leverage first.

### 1. Type-safe mail zone ownership (A, I) — Leverage **H**, Effort **S**

**Layer:** Code / types.

**Do:** Make `mailDomains` entries require explicit `ownsDmarc` and `ownsRouting` (already present) and add a **stack unit test** that fails if a new domain is added without both flags set to literal `true`/`false` (no implicit default). Optionally add a `plan:mail` snapshot test in CI that only runs when `ALCHEMY_PROFILE=admin` is available (document as optional job).

**Evidence:** [PR #1](https://github.com/jbolabs/jbolabs/pull/1); comments in `stacks/config.ts` lines 54–60.

**Why not prose:** Agents will keep “helpfully” adding DNS for every zone.

---

### 2. Wire markup copy checks into CI (H) — Leverage **H**, Effort **S**

**Layer:** Static analysis.

**Do:**

- Add `check:copy` → `bun packages/config/check-copy.ts` to root `package.json`.
- Run it from `bun run ci` (or `lint:ci`) alongside oxlint.

**Evidence:** Tool exists (`packages/config/check-copy.ts`); sites repo [PR #30](https://github.com/jbolabs/sites/pull/30) made this mandatory. **0** jbolabs CI steps invoke it today.

**Prototype:** branch `cursor/prototype-check-copy-ci-abf7` (`92058d9`) wires `check:copy` and adds a locality checker sketch (see #3).

---

### 3. Locality copy guard (C) — Leverage **H**, Effort **S**

**Layer:** Static analysis.

**Do:** Enforce “city / region strings only in `apps/jbolabs/src/content/pages.ts`” via a small checker (same pattern as `check-copy.ts`). Global positioning stays in `site.config.ts` without geo names.

**Evidence:** [PR #2](https://github.com/jbolabs/jbolabs/pull/2) vs [PR #8](https://github.com/jbolabs/jbolabs/pull/8).

**Prototype:** `packages/config/check-locality.ts` + tests on `cursor/prototype-check-copy-ci-abf7` (`92058d9`). Ran clean against current `main` content (only `pages.ts` contains markers).

---

### 4. Panel-surface components bind token choice (B) — Leverage **H**, Effort **M**

**Layer:** Code architecture.

**Do:**

- Keep `inverse` on `Button` (fixed in [PR #3](https://github.com/jbolabs/jbolabs/pull/3)).
- Make `CtaBand` (and similar) accept children only through a narrow API, e.g. `CtaButton` that hardcodes `variant="inverse"` so agents cannot pass `outline` on `bg-panel`.
- Add a **smoke assertion** for dark mode: computed `background-color` on the closing CTA button matches `panel-foreground` token (one literal hex from design tokens file, not recomputed from the component).

**Evidence:** [PR #3](https://github.com/jbolabs/jbolabs/pull/3); [PR #9](https://github.com/jbolabs/jbolabs/pull/9) for `theme-color` drift.

---

### 5. `theme-color` tied to CSS variables (B) — Leverage **M**, Effort **S**

**Layer:** Code.

**Do:** Single module exports light/dark `theme-color` values derived from the same OKLCH tokens as `global.css` (or read via `getComputedStyle` in a tiny unit test on static constants). Prevents `#33353a`-style hex drift noted in [PR #9](https://github.com/jbolabs/jbolabs/pull/9).

---

### 6. Control-app: screenshot mode for marketing assets (G) — Leverage **M**, Effort **M**

**Layer:** Tooling + docs.

**Do:** Add `bun run app -- screenshot --no-scroll <paths>` (or `--fresh`) for 1200×750 portfolio captures; default keeps current scroll-to-load behavior for lazy images. Document in `apps/jbolabs/README.md`.

**Evidence:** [PR #2](https://github.com/jbolabs/jbolabs/pull/2) reviewer notes.

---

### 7. Repository owner consistency test (F) — Leverage **M**, Effort **S**

**Layer:** Test.

**Do:** Root vitest: `stacks/config.ts` `repository.owner` must equal the GitHub org from `package.json` / `GITHUB_REPOSITORY` or a single `EXPECTED_GITHUB_OWNER` constant used by `stacks/github.ts`.

**Evidence:** [PR #10](https://github.com/jbolabs/jbolabs/pull/10).

---

### 8. Port high-value `check-style` rules from sites (D, visual) — Leverage **M**, Effort **M**

**Layer:** Static analysis.

**Do:** Port `packages/config/check-style.ts` from `jbolabs/sites` ([PR #30](https://github.com/jbolabs/sites/pull/30)): **solid sticky header** (no translucent/blur header surface). jbolabs already follows this in places; the checker prevents regressions when agents copy patterns from the web.

**Skip for now:** eyebrow ban (jbolabs doesn’t use eyebrows); mobile menu is site-specific and was reverted once—prefer shared `site-ui` if menus converge again ([sites PR #31](https://github.com/jbolabs/sites/pull/31)).

**Evidence:** Jake revert `8f7321c` after agent menu work (`7a3b145`…`564d8fc`).

---

### 9. Preserve worker “why” via structure (E) — Leverage **M**, Effort **M**

**Layer:** Code.

**Do:** Move non-obvious worker behaviors (noindex header, backup cron gating, canonical redirect) into named functions in `@jakebodea/cloudflare-kit` with tests, so refactors don’t rely on comment blocks agents delete. Keep a short file header in `worker.ts`.

**Evidence:** `7bab61a` explicitly restored comments removed during analytics work.

---

### 10. Alchemy plan/deploy guards in CI messages (I) — Leverage **M**, Effort **S**

**Layer:** CI + code (already partial).

**Do:** Document in `stacks/mail.ts` header: **mail deploy is shell-only, not CI** ([PR #1](https://github.com/jbolabs/jbolabs/pull/1) post-merge step). Add a lint or `scripts/` check that fails if `alchemy deploy` appears in workflows for `stacks/mail.ts` / `stacks/studio.ts`. Site prod deploy already guarded by `productionDeployRefusal`.

**Evidence:** [PR #6](https://github.com/jbolabs/jbolabs/pull/6) rollout notes; AGENTS.md Never list.

---

### 11. Motion change budget (D) — Leverage **L**, Effort **S**

**Layer:** Prose (last resort for taste).

**Do:** One paragraph in `apps/jbolabs/README.md`: prefer ≤1 animation PR per feature; if Jake reverts motion, restore the prior file from git instead of re-inventing. Link `8f7321c`.

Only after #8 and component boundaries—agents shouldn’t need this if the easy path is small diffs.

---

### 12. Trim duplicate agent guidance — Leverage **L**, Effort **S**

**Layer:** Prose cleanup.

**Do:** Point `CLAUDE.md` at `AGENTS.md` (or generate one from the other) to avoid drift. Skills already live in `.agents/skills/` (`control-app`, `deploy`); avoid a fourth copy of the Never list.

---

## Proposed `verify` skill (no `verify-*` skill today)

The repo is runnable via `packages/control-app` and documents verification in AGENTS.md and `.agents/skills/control-app/SKILL.md`, but agents often stop at `bun run ci`. Add **`.agents/skills/verify/SKILL.md`**:

| Step | Command | When |
| --- | --- | --- |
| CI gate | `bun run ci` | Always |
| Start / restart | `bun run app -- start` / `restart` | After server, island, or alchemy config edits |
| Read-only crawl | `bun run app -- smoke --no-submit` | Copy/layout/component changes |
| Full intake | `bun run app -- smoke` | Contact pipeline changes |
| SEO | `bun run app -- seo` | Meta, routes, structured data |
| Visual | `bun run app -- screenshot <changed paths>` at **1280 and 375** | Anything visible; **read PNGs** |
| Dark mode | Re-run screenshot/snapshot after toggling theme | Token or `theme-color` changes |
| Stacks | `ALCHEMY_PROFILE=admin bun run plan:studio \| plan:mail \| plan:github` | Only with Jake’s go-ahead; never deploy |
| Done report | List what ran + URLs/paths + anything skipped | Required in PR body |

**CI parity:** Preview/production already run smoke + SEO ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)); local verify should mirror that before claiming done.

---

## Prototype branches (for open questions)

| Branch | Commit | Question answered |
| --- | --- | --- |
| `cursor/prototype-check-copy-ci-abf7` | `92058d9` | How to wire `check-copy` + locality checker into scripts without touching site code |

Merge prototypes after review; this plan PR is **docs only**.

---

## Suggested implementation order

1. **#2 + #3** (CI copy/locality)—cheap, prevents repeat of PR #8 class bugs.  
2. **#1 + #7**—config drift and mail DNS safety.  
3. **#4 + #5**—token/context bugs ([PR #3](https://github.com/jbolabs/jbolabs/pull/3), [PR #9](https://github.com/jbolabs/jbolabs/pull/9)).  
4. **#6 + verify skill**—close the “said they verified” gap.  
5. **#8–#10**—port sites learnings and harden worker/stacks.  
6. **#11–#12**—only if metrics still show motion/guidance issues.

---

## Out of scope for automation

- **Footer art tuning** ([PR #7](https://github.com/jbolabs/jbolabs/pull/7)): aesthetic follow-up; tests helped for `swellReach` but not taste.  
- **Large open PRs** ([#5](https://github.com/jbolabs/jbolabs/pull/5) contact animation): merge gates + verify skill matter more than new rules.  
- **Alchemy beta.82 rollout** ([#6](https://github.com/jbolabs/jbolabs/pull/6)): human gate by design.

---

## Definition of done (for future agent PRs)

Same as `AGENTS.md`, enforced by the verify skill: `bun run ci` (zero warnings) + control-app smoke/seo/screenshot for visible work + explicit “not checked” list. No product deploys or mail/studio stack deploys without Jake.
