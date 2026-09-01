import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — BXLACK" },
      { name: "description", content: "The terms governing purchases from BXLACK, including pricing, orders and liability." },
      { property: "og:title", content: "Terms & Conditions — BXLACK" },
      { property: "og:description", content: "Terms governing purchases from BXLACK." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/terms" }],
  }),
  component: () => (
    <InfoPage
      eyebrow="Legal"
      title="Terms &"
      italic="conditions."
      intro="These terms apply to every order placed with BXLACK. They are a template and should be reviewed by your legal advisor before launch."
      blocks={[
        {
          heading: "Orders",
          body: [
            "An order is accepted when we issue an order confirmation. We may decline an order where a piece is unavailable or where a pricing error has occurred.",
          ],
        },
        {
          heading: "Pricing & payment",
          body: [
            "Prices are shown in euro and include VAT where applicable. Payment is taken at checkout through our payment provider.",
          ],
        },
        {
          heading: "Product presentation",
          body: [
            "Pieces are produced in small numbered runs. Slight variation in wash, fade and embroidery placement is inherent to the process and is not a defect.",
          ],
        },
        {
          heading: "Liability & law",
          body: [
            "Nothing in these terms limits liability that cannot be limited by law. These terms are governed by Belgian law.",
          ],
        },
      ]}
    />
  ),
});