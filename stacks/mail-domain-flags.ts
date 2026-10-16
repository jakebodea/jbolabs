import type { MailDomain } from "./config.ts";

/** Whether `stacks/mail.ts` should publish a `_dmarc` TXT record for this zone. */
export const publishesDmarc = (domain: MailDomain): boolean => domain.ownsDmarc;

/** Whether `stacks/mail.ts` should enable Email Routing on this zone. */
export const enablesMailRouting = (domain: MailDomain): boolean =>
  domain.ownsRouting;
