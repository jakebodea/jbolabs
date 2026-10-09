/**
 * Facts the jbolabs stacks are built from. Not secrets: account ids, zone
 * names and hostnames are visible to anyone who can resolve DNS.
 */

/** Same Cloudflare account as the sites repo (`sites/stacks/config.ts`). */
export const accountId = "984b82870acd18daf8bda97bad966b38";

/**
 * The studio domain. The marketing sites in `sites` send from
 * `sites@<sendingSubdomain>` and alert `alerts@<domain>`; both strings are
 * duplicated in `sites/stacks/config.ts`, which only needs them as text.
 */
export const studio = {
  domain: "jbolabs.com",
  sendingSubdomain: "mail.jbolabs.com",
} as const;

export const mailflare = {
  /** Where the web UI is served. Not `mail.`: that is the sites' sending subdomain. */
  host: "inbox.jbolabs.com",
  /**
   * Mailflare hardcodes this script name when it points a zone's catch-all at
   * the Worker (`getEmailWorkerName()` in `src/lib/cloudflare-api-utils.ts`),
   * so the Worker must be deployed under exactly this name.
   */
  workerName: "mailflare",
} as const;

/**
 * Zones whose mail lands in Mailflare. Zone ids are pinned so the runtime
 * token's scope is known at plan time (zones are owned by `studio.ts`, the
 * pcobooster repo and the shouldertap repo respectively).
 *
 * `ownsRouting`: whether `stacks/mail.ts` enables Email Routing on the zone.
 * jbolabs.com's routing belongs to `stacks/studio.ts`, so mail only claims its
 * catch-all.
 *
 * Literal routing rules beat the catch-all, so addresses other stacks route
 * explicitly keep their own handling: `support@shouldertap.app` stays with the
 * shouldertap repo's Support worker (it forwards to Gmail and Slack).
 */
export const mailDomains = [
  { name: "jbolabs.com", ownsRouting: false, zoneId: "333c7cb3be883e897fae5012d82f7091" },
  { name: "pcobooster.com", ownsRouting: true, zoneId: "a43fafd2bb6e6fb47f0233e6168e622e" },
  { name: "shouldertap.app", ownsRouting: true, zoneId: "67ca54dc8d4b36bf46486ad14875914d" },
] as const;
