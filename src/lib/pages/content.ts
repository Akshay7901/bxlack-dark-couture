/**
 * Editable copy for the About, Shipping, Returns, FAQ and Contact pages.
 * Each page has a fixed structure (so the design can't break) and default
 * text matching the original site. Saved edits live in the site_pages table;
 * anything missing falls back to these defaults.
 */
import { z } from "zod";

export const PAGE_SLUGS = ["about", "shipping", "returns", "faq", "contact"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

const text = (max = 400) => z.string().max(max);
const longText = () => z.string().max(4000);

const headerSchema = z.object({
  eyebrow: text(80),
  title: text(120),
  italic: text(80),
  intro: longText(),
});

const blockSchema = z.object({ heading: text(160), body: z.array(longText()).max(20) });

export const infoPageSchema = headerSchema.extend({ blocks: z.array(blockSchema).max(30) });
export const faqPageSchema = headerSchema.extend({
  faqs: z.array(z.object({ q: text(300), a: longText() })).max(60),
});
export const contactPageSchema = headerSchema.extend({
  channels: z.array(z.object({ label: text(60), value: text(200) })).max(12),
});

const aboutSection = z.object({
  label: text(80),
  /** Use a line break to split the heading over two lines. */
  title: text(160),
  lead: longText(),
  paragraphs: z.array(longText()).max(12),
});
export const aboutPageSchema = z.object({
  hero: z.object({ eyebrow: text(80), title: text(160), italic: text(80), tagline: text(200) }),
  philosophy: aboutSection.extend({ quote: longText() }),
  story: aboutSection.extend({ quote: longText(), cite: text(120) }),
  codes: z.object({
    label: text(80),
    title: text(160),
    intro: longText(),
    items: z
      .array(
        z.object({
          name: text(60),
          line: text(160),
          body: longText(),
          attrs: z.array(z.object({ k: text(60), v: text(120) })).max(8),
        }),
      )
      .max(6),
  }),
  closing: z.object({ statement: text(300), button: text(60) }),
});

export type InfoPageContent = z.infer<typeof infoPageSchema>;
export type FaqPageContent = z.infer<typeof faqPageSchema>;
export type ContactPageContent = z.infer<typeof contactPageSchema>;
export type AboutPageContent = z.infer<typeof aboutPageSchema>;

export type PageContentMap = {
  about: AboutPageContent;
  shipping: InfoPageContent;
  returns: InfoPageContent;
  faq: FaqPageContent;
  contact: ContactPageContent;
};

export const PAGE_SCHEMAS: { [K in PageSlug]: z.ZodType<PageContentMap[K]> } = {
  about: aboutPageSchema,
  shipping: infoPageSchema,
  returns: infoPageSchema,
  faq: faqPageSchema,
  contact: contactPageSchema,
};

export const PAGE_META: Record<PageSlug, { name: string; path: string }> = {
  about: { name: "About Us", path: "/about" },
  shipping: { name: "Shipping", path: "/shipping" },
  returns: { name: "Returns", path: "/returns" },
  faq: { name: "FAQ", path: "/faq" },
  contact: { name: "Contact", path: "/contact" },
};

// ---------------------------------------------------------------------------
// Defaults — the original copy of each page
// ---------------------------------------------------------------------------

export const DEFAULT_PAGES: PageContentMap = {
  shipping: {
    eyebrow: "",
    title: "Shipping &",
    italic: "delivery.",
    intro: "Every piece is packed and dispatched by hand. Below is exactly what to expect from confirmation to your door.",
    blocks: [
      {
        heading: "Paying online",
        body: [
          "Prepaid orders leave our hands within 48 hours of confirmation. A tracking link follows by email and WhatsApp the moment it does.",
          "A handful of pieces are made to pre-order. Where that's the case, the expected dispatch window is stated on that product's own page, under its details tab.",
          "Standard delivery is complimentary on every prepaid order, and typically lands within 7–8 business days.",
          "In a hurry? Add express delivery at checkout for a flat ₹99. This charge is non-refundable, even if the order is later returned.",
        ],
      },
      {
        heading: "Returns & shipping costs",
        body: ["Returning a prepaid order? A flat ₹100 is held back from your refund to cover the cost of return shipping."],
      },
      {
        heading: "Shipping outside India",
        body: [
          "International orders are charged shipping at actual cost, calculated at checkout for your destination.",
          "Any customs duties or import taxes levied on arrival are set by your local authorities, not by us, and remain the recipient's responsibility.",
        ],
      },
    ],
  },

  returns: {
    eyebrow: "Client Services",
    title: "Returns &",
    italic: "refunds.",
    intro:
      "Product photography is enhanced in post-production, so colour can read slightly differently in person. Beyond that, here's exactly how returns, exchanges and cancellations work.",
    blocks: [
      {
        heading: "Before you send it back",
        body: [
          "A return must be postmarked within 7 days of delivery. Made-to-order pieces are final sale and can't be returned or exchanged.",
          "The item needs to come back new, unused and in its original condition, with brand tag and plastic seal still attached. Once either is removed, the piece is no longer eligible.",
          "Send the piece back in its original BXLACK packing tube. If the tube isn't returned, ₹300 is deducted. This applies to both returns and exchanges.",
          "Spotted a quality or quantity issue? Flag it within 24 hours of delivery so we can sort it quickly.",
        ],
      },
      {
        heading: "How it works",
        body: [
          "Email clients@bxlack.com with your order number and a clear photo or video showing the tag and seal intact.",
          "Once approved, pickup is attempted twice at your address. If both attempts fail, you'll need to ship the piece back to us yourself, since reverse pickup depends on courier availability in your area.",
          "Refund processing begins once we've received and inspected the return, and typically reaches your original payment method within 3–5 business days.",
        ],
      },
      {
        heading: "What's deducted, what isn't",
        body: [
          "A flat ₹100 logistics charge is held back from every refund. Express shipping charges are non-refundable and aren't reimbursed either.",
          "Other packaging (wooden boxes, brown boxes, gift wraps) is part of delivery, not the product, and isn't returnable or refundable under any circumstance. The packing tube is the exception: it must come back with the piece, or ₹300 is deducted.",
          "Gift cards and store credit don't expire, but they can't be refunded to a bank account or transferred once issued.",
        ],
      },
      {
        heading: "Exchanges",
        body: [
          "Same 7-day window, same condition requirements: tags on, seal intact, unworn.",
          "If you accept an exchange pickup and then refuse it after it's already shipped back to you, ₹200 is deducted from any resulting refund. Only request an exchange if you're going ahead with it.",
          "Each order gets one return or exchange, not both, and not a second time. Double-check size and details before confirming, since once an exchange is fulfilled, that order is closed.",
          "Exchanging into something cheaper doesn't generate a cash-back on the difference. If you'd rather keep that value, return the piece instead and take a gift card, which never expires.",
        ],
      },
      {
        heading: "Cancellations",
        body: [
          "Before it ships, cancel anytime from your account or by contacting us directly.",
          "Once shipped, an order can't be cancelled. If it's not right for you, send it back under the return terms above. Refusing delivery is treated the same way as a return.",
          "Pre-orders can be cancelled within 24 hours of placing them. After that window, they're locked in.",
        ],
      },
      {
        heading: "International orders",
        body: [
          "Returns and exchanges aren't available outside India, so please choose sizing and pieces carefully before ordering internationally.",
        ],
      },
    ],
  },

  faq: {
    eyebrow: "Client Services",
    title: "Frequently",
    italic: "asked.",
    intro: "Everything on drops, sizing, delivery and care. If your question is not here, write to clients@bxlack.com.",
    faqs: [
      { q: "When does the next drop release?", a: "Drops are announced by email first. Join the list in the footer and you will receive the exact release time 24 hours ahead of the public." },
      { q: "Are pieces restocked?", a: "No. Every run is numbered and finite. Once a size is gone it does not return." },
      { q: "How do your pieces fit?", a: "Cut oversized with a dropped shoulder. If you prefer a closer line, size down. Full measurements are on the size guide." },
      { q: "How long does delivery take?", a: "1–2 working days to dispatch, then 3–5 days domestically and 4–12 days internationally depending on destination." },
      { q: "Can I return or exchange a piece?", a: "Yes, within 14 days of delivery, unworn and with the numbered tag attached. Size exchanges are free within Europe." },
      { q: "Which payment methods do you accept?", a: "Major cards, wallets and local methods supported by our payment provider at checkout. Card details are never stored by BXLACK." },
      { q: "Do you ship internationally?", a: "Yes, worldwide. Orders outside the EU may attract import duties collected by the carrier on delivery." },
      { q: "How should I care for my piece?", a: "Cold wash inside out, no bleach, hang to dry, iron on reverse. Never tumble dry embroidered or printed pieces." },
    ],
  },

  contact: {
    eyebrow: "Client Services",
    title: "Write to",
    italic: "us.",
    intro: "We answer every message within one working day. For order enquiries, include your order number.",
    channels: [
      { label: "Timing", value: "Mon – Sat, 10:00 AM – 7:00 PM" },
      { label: "Email", value: "hello@bxlack.com" },
      { label: "Contact number", value: "+91 00000 00000" },
    ],
  },

  about: {
    hero: {
      eyebrow: "Est. 2026",
      title: "A house built on",
      italic: "shadow.",
      tagline: "The point where everything happens.",
    },
    philosophy: {
      label: "01 · Philosophy",
      title: "One colour.\nNo limits.",
      lead: "Working in black does not restrict what we can make. It does the opposite.",
      paragraphs: [
        "When every product shares the same colour, the catalogue becomes infinite. A jacket, a bag, a boot, an accessory: they all belong together. You never have to ask whether something fits the brand. If it is built properly and it is black, it is BXLACK.",
        "Colour forces decisions: which season, which market, which customer. Black removes those questions. The product stands on its construction, its materials, its function. There is nothing else to look at.",
      ],
      quote: "The single-colour rule is not a limitation. It is what makes expansion possible.",
    },
    story: {
      label: "02 · Story",
      title: "Every piece\nhas a story.",
      lead: "Design without story is product. Design with story is brand.",
      paragraphs: [
        "Every garment we release carries a reason for existing: not a trend, not a season, not a mood board. A story: where it was built, what problem it solves, who it was made for, what it means to own it.",
        "That story is what connects you to the product. Not the colour, not the logo, not the marketing. The story behind the thing.",
      ],
      quote: "“Every piece has a story. The story builds the connection.”",
      cite: "BXLACK Brand Philosophy",
    },
    codes: {
      label: "03 · The Codes",
      title: "Three moods.\nAny product.",
      intro: "The codes are not product lines. They are aesthetic registers. Any BXLACK piece can draw from any code.",
      items: [
        {
          name: "Street",
          line: "The urban register.",
          body: "Built for everyday use in city environments. Proportions are generous, construction is honest, hardware is matte. Nothing is decorative: every detail is there because it needs to be.",
          attrs: [
            { k: "Proportion", v: "Generous, deliberate" },
            { k: "Hardware", v: "Matte black" },
            { k: "Feel", v: "Heavy, considered" },
            { k: "Reference", v: "Urban architecture" },
          ],
        },
        {
          name: "Active",
          line: "The technical register.",
          body: "Follows the logic of performance: clean lines, functional closures, minimal weight, materials built to work under pressure. Every element earns its place.",
          attrs: [
            { k: "Line", v: "Technical, clean" },
            { k: "Closures", v: "Functional" },
            { k: "Material", v: "Performance grade" },
            { k: "Weight", v: "Minimal" },
          ],
        },
        {
          name: "Alpine",
          line: "The severe register.",
          body: "The language of extreme environments: stripped back, built for conditions, no margin for error. It looks like it was made where there are no second chances.",
          attrs: [
            { k: "Form", v: "Stripped to function" },
            { k: "Seams", v: "Welded or taped" },
            { k: "Hardware", v: "Zero excess" },
            { k: "Reference", v: "Mountain engineering" },
          ],
        },
      ],
    },
    closing: { statement: "The absence of noise is the loudest statement.", button: "Shop the collection" },
  },
};

/** Saved content if it's valid, otherwise the default — the live page never breaks. */
export function resolvePage<K extends PageSlug>(slug: K, saved: unknown): PageContentMap[K] {
  if (saved == null) return DEFAULT_PAGES[slug];
  const parsed = PAGE_SCHEMAS[slug].safeParse(saved);
  return parsed.success ? parsed.data : DEFAULT_PAGES[slug];
}

/** Splits a title on line breaks for multi-line headings. */
export const lines = (s: string) => s.split(/\r?\n/);
