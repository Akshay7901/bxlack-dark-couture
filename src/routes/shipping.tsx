import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — BXLACK" },
      { name: "description", content: "BXLACK shipping methods, delivery timelines, charges and international duties information." },
      { property: "og:title", content: "Shipping & Delivery — BXLACK" },
      { property: "og:description", content: "Delivery timelines, charges and duties for every BXLACK order." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/shipping" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/shipping" }],
  }),
  component: () => (
    <InfoPage
      eyebrow="Client Services — 001"
      title="Shipping &"
      italic="delivery."
      intro="Every piece leaves the atelier numbered, wrapped in unbleached tissue and sealed by hand. Dispatch takes 1–2 working days."
      blocks={[
        {
          heading: "Domestic delivery",
          body: [
            "Standard: 3–5 working days — €8, complimentary above €250.",
            "Express: 1–2 working days — €18, dispatched the same day when ordered before 13:00 CET.",
          ],
        },
        {
          heading: "International delivery",
          body: [
            "Europe: 4–7 working days — €18. Rest of world: 6–12 working days — €35.",
            "Tracking is issued by email as soon as the parcel is scanned by the carrier.",
          ],
        },
        {
          heading: "Duties & taxes",
          body: [
            "Orders within the EU are shipped duty paid, with VAT included in the displayed price.",
            "Orders outside the EU may attract import duties collected by the carrier on delivery. These charges are set by the destination country and are the responsibility of the recipient.",
          ],
        },
        {
          heading: "Order tracking",
          body: [
            "You will receive a shipping confirmation with a tracking link. Allow up to 24 hours for the first carrier scan to appear.",
            "For anything unclear, write to clients@bxlack.com with your order number.",
          ],
        },
      ]}
    />
  ),
});