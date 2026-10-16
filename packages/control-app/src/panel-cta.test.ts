import { describe, expect, it } from "vitest";

import { panelCtaUsesPanelTokens } from "./panel-cta";

describe("panel CTA markup", () => {
  it("accepts panel foreground tokens on the CTA link", () => {
    expect(
      panelCtaUsesPanelTokens(`
        <div class="bg-panel">
          <a href="/contact" class="bg-panel-foreground text-panel">Start</a>
        </div>
      `)
    ).toBeTruthy();
  });

  it("requires a panel CTA link on the home page markup", () => {
    expect(
      panelCtaUsesPanelTokens(`<div class="bg-panel"><p>No button</p></div>`)
    ).toBeFalsy();
  });

  it("rejects page background tokens on the CTA link", () => {
    expect(
      panelCtaUsesPanelTokens(`
        <div class="bg-panel">
          <a href="/contact" class="bg-background text-foreground">Start</a>
        </div>
      `)
    ).toBeFalsy();
  });
});
