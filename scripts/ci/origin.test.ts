import { describe, expect, it } from "vitest";

import { stageOrigin } from "./origin.ts";

describe(stageOrigin, () => {
  it("serves prod from the custom domain", () => {
    expect(stageOrigin("prod")).toBe("https://jbolabs.com");
  });

  it("serves a PR preview from workers.dev", () => {
    expect(stageOrigin("pr-7")).toBe(
      "https://jbolabs-pr-7.jakebodea.workers.dev"
    );
  });
});
