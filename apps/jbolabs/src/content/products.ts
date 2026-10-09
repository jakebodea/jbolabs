/** My own products, shown on `/products`. Screenshots are each product's live landing page at 1280 by 800. */
import type { Product } from "./types.ts";

export const products: readonly Product[] = [
  {
    description:
      "The workspace worship and ministry leaders open every week to fill teams, look after volunteers, and get songs and charts ready for Sunday. It runs on the Planning Center Services they already use, and every change saves straight back. Open source.",
    href: "https://pcobooster.com",
    image: "/products/pcobooster.webp",
    kind: "Planning Center for worship teams",
    name: "PCOBooster",
    status: "Beta",
  },
  {
    description:
      "When someone at home needs you, their message covers your Mac until you answer. Reply with a tap or a few words, and they see it the moment you send it.",
    href: "https://shouldertap.app",
    image: "/products/shouldertap.webp",
    kind: "Mac app",
    name: "Shouldertap",
    status: "Live",
  },
  {
    description:
      "Add everyone in the gift exchange, mark who should not draw whom, and it finds a fair draw that respects every rule. Everyone gets their match by email, and the organizer gets a link to the results. Free, with no accounts.",
    href: "https://supersimplesecretsanta.com",
    image: "/products/secret-santa.webp",
    kind: "Gift exchange draws",
    name: "Super Simple Secret Santa",
    status: "Live",
  },
];
