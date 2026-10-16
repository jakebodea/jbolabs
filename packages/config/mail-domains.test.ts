import { describe, expect, it } from "vitest";

import { mailDomains } from "../../stacks/config.ts";
import { publishesDmarc } from "../../stacks/mail-domain-flags.ts";

describe(publishesDmarc, () => {
  it("skips zones that already publish DMARC outside Alchemy", () => {
    expect(
      publishesDmarc({
        name: "shouldertap.app",
        ownsDmarc: false,
        ownsRouting: true,
        zoneId: "67ca54dc8d4b36bf46486ad14875914d",
      })
    ).toBeFalsy();
  });

  it("keeps shouldertap.app off DMARC in the committed mail domain list", () => {
    const shoulder = mailDomains.find(
      (domain) => domain.name === "shouldertap.app"
    );
    if (shoulder === undefined) {
      throw new Error("shouldertap.app missing from mailDomains");
    }
    expect(publishesDmarc(shoulder)).toBeFalsy();
  });
});
