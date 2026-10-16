import { describe, expect, it } from "vitest";

import { findLocalityViolations } from "./check-locality";

describe("locality copy", () => {
  it("allows Irvine on the About copy file", () => {
    expect(
      findLocalityViolations(
        "apps/jbolabs/src/content/pages.ts",
        'const x = "Irvine";'
      )
    ).toStrictEqual([]);
  });

  it("flags Irvine in other content modules", () => {
    expect(
      findLocalityViolations(
        "apps/jbolabs/src/content/home.ts",
        'tagline: "Orange County businesses"'
      )
    ).toStrictEqual([
      {
        column: 11,
        line: 1,
        match: "Orange County",
        path: "apps/jbolabs/src/content/home.ts",
      },
    ]);
  });
});
