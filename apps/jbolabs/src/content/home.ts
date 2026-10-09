/**
 * Home page copy. Edit freely: headlines set `*words in asterisks*` in the
 * bold display weight, and every section can be removed by deleting it from
 * `src/pages/index.astro`.
 */
import type {
  CallToAction,
  FaqSection,
  Hero,
  Link,
  ListSection,
  Pillars,
} from "./types.ts";

const startProject: Link = { href: "/contact", label: "Start a project" };

export const hero: Hero = {
  example: {
    businesses: [
      {
        body: "Reef tanks, koi ponds, and water testing, with setup help.",
        cta: "Plan a visit",
        headline: "Healthy water, thriving fish.",
        hue: 258,
        icon: "fish",
        kind: "Aquarium",
        name: "Harbor Reef Aquatics",
      },
      {
        body: "Leaks, boilers, and bathrooms, with fixed-price quotes.",
        cta: "Get a quote",
        headline: "Same-day plumbing, done right.",
        hue: 150,
        icon: "wrench",
        kind: "Plumber",
        name: "Brightside Plumbing",
      },
      {
        body: "Sourdough, pastries, and cakes, baked every morning.",
        cta: "Order ahead",
        headline: "Bread worth getting up for.",
        hue: 55,
        icon: "croissant",
        kind: "Bakery",
        name: "Ember Bakery",
      },
      {
        body: "Cuts, fades, and hot towel shaves, walk-ins welcome.",
        cta: "Book a chair",
        headline: "Sharp cuts, no waiting around.",
        hue: 20,
        icon: "scissors",
        kind: "Barber",
        name: "North Street Barbers",
      },
    ],
    prompt: "Try another business",
  },
  headline: "Great websites, *shipped fast.*",
  primary: startProject,
  secondary: { href: "/work", label: "See my work" },
  subheadline:
    "Websites and web apps for small businesses that look sharp, load fast, and are easy to update.",
};

export const pillars: Pillars = {
  analytics: {
    body: "Visits, top pages, and enquiries, built in. No cookie banners.",
    title: "See *what's working.*",
  },
  editing: {
    body: "Text, photos, prices, hours. Change them any time, no email needed.",
    title: "Edit it *yourself.*",
  },
  speed: {
    body: "A live preview link early on, then launch.",
    title: "Launched in *days,* not months.",
  },
};

export const services: ListSection = {
  headline: "Your website, *done right.*",
  intro: "Most projects start here.",
  items: [
    {
      body: "Fast, findable, and easy for you to update.",
      title: "Marketing websites",
    },
    {
      body: "Portals, bookings, dashboards, internal tools. Whatever your business needs built.",
      title: "Custom software",
    },
    {
      body: "Updates, monitoring, backups, and a real person to call.",
      title: "Care and hosting",
    },
    {
      body: "AI tools and automations built around how you already work.",
      title: "AI and automation",
    },
  ],
};

export const process: ListSection = {
  headline: "How a project *runs.*",
  items: [
    {
      body: "A short chat about your business and what you need.",
      title: "Intro call",
    },
    {
      body: "Clear scope, fixed price.",
      title: "Proposal",
    },
    {
      body: "A preview link you can check any time.",
      title: "Build",
    },
    {
      body: "We go live, I stay on hand, and we look at what to take off your plate next.",
      title: "Launch and beyond",
    },
  ],
};

export const faq: FaqSection = {
  headline: "Things people *usually ask.*",
  items: [
    {
      answer:
        "A fixed quote after the intro call, based on scope. Share a rough budget and I will suggest what fits.",
      question: "What does a website cost?",
    },
    {
      answer:
        "Most websites launch within a week or two of getting your content. Larger apps ship in phases.",
      question: "How long does it take?",
    },
    {
      answer:
        "Yes. Text, photos, prices, and hours. Change them any time without emailing me.",
      question: "Can I update the site myself?",
    },
    {
      answer:
        "Yes. If your business needs something built, from a customer portal to an AI tool, I can build it. Tell me what you have in mind and I will tell you straight whether it is worth doing.",
      question: "Can you help with more than the website?",
    },
    {
      answer:
        "I am based in Irvine and work with businesses across Orange County, so we can meet in person. I also work with clients anywhere over video calls.",
      question: "Are you local?",
    },
  ],
};

export const closing: CallToAction = {
  headline: "Have something *in mind?*",
  link: startProject,
};
