/**
 * Closing CTA on `bg-panel` must use panel button tokens (`bg-panel-foreground`),
 * not page tokens (`bg-background`), or dark mode shows a dark pill on a lighter band.
 */
const PANEL_BLOCKS =
  /<div\b[^>]*\bbg-panel\b[^>]*>(?<inner>[\s\S]*?)<\/div>/giu;
const LINK_TAG = /<a\b[^>]*>/giu;

const linkUsesPanelTokens = (tag: string): boolean =>
  tag.includes("bg-panel-foreground") && !tag.includes("bg-background");

export const panelCtaUsesPanelTokens = (html: string): boolean => {
  let panelLink = false;
  for (const block of html.matchAll(PANEL_BLOCKS)) {
    const inner = block.groups?.inner ?? "";
    for (const link of inner.matchAll(LINK_TAG)) {
      panelLink = true;
      const [tag] = link;
      if (!linkUsesPanelTokens(tag)) {
        return false;
      }
    }
  }
  return panelLink;
};
