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
      hideNewsletter
      title="Shipping &"
      italic="delivery."
      intro="Every piece is packed and dispatched by hand. Below is exactly what to expect from confirmation to your door, however you choose to pay."
      blocks={[
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
          heading: "Cash on delivery",
          body: [
            "COD orders are dispatched within 3–4 business days, with tracking sent the same way: email and WhatsApp.",
            "A flat ₹150 COD handling fee is added at checkout. Like the express fee above, it's non-refundable regardless of what happens to the order afterward.",
          ],
        },
        {
          heading: "Returns & shipping costs",
          body: [
            "Returning a prepaid order? A flat ₹100 is held back from your refund to cover the cost of return shipping.",
            "The same ₹100 applies to COD returns, on top of the original COD handling fee, which stays non-refundable either way.",
          ],
        },
        {
          heading: "Shipping outside India",
          body: [
            "International orders are charged shipping at actual cost, calculated at checkout for your destination.",
            "Any customs duties or import taxes levied on arrival are set by your local authorities, not by us, and remain the recipient's responsibility.",
          ],
        },
      ]}
    />
  ),
});
