/**
 * Everything that makes this site *this* site (as opposed to the template):
 * identity, domain, business facts for structured data, and contact routing.
 * Page copy lives in `src/content`. Structurally a `SiteIdentity` (checked
 * where alchemy.run.ts passes it to `resolveStage`).
 *
 * The brand name and domain are still provisional: renaming the studio means
 * changing `name`/`shortName`/`domain` here (and rerunning brand/render.py for
 * the share image). `id` names cloud resources, so it stays put once a stage
 * is deployed.
 */
/** Facts for ProfessionalService JSON-LD. Leave unknown fields out rather than guessing. */
interface BusinessFacts {
  readonly founder: string;
  readonly email?: string;
}

const business: BusinessFacts = {
  founder: "Jake Bodea",
};

export const site = {
  business,

  description:
    "JBO Labs is the Orange County web studio of Jake Bodea: websites and web apps for local businesses, plus help with the tech behind them.",
  /** Appended to meta descriptions too short for a search snippet (see `metaDescription`). */
  descriptionContext:
    "Websites and web apps for Orange County businesses, by Jake Bodea at JBO Labs.",

  /** Attached to the production Worker through Alchemy. */
  domain: "jbolabs.com",

  /** Prefixes Worker names (`jbolabs-<stage>`) and the Alchemy stack. */
  id: "jbolabs",

  leadInbox: "hello@jbolabs.com",

  name: "JBO Labs",

  shortName: "JBO Labs",

  /** Footer line under the wordmark. */
  tagline: "Websites and web apps for Orange County businesses.",
  /** Home page `<title>`: "JBO Labs | <this>". */
  titleSuffix: "Websites for Orange County businesses",

  /** The Cloudflare account's workers.dev subdomain (non-prod stages live there). */
  workersSubdomain: "jakebodea",
} as const;
