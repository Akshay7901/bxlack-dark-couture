import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Refunds — BXLACK" },
      { name: "description", content: "How to return or exchange a BXLACK piece, refund timelines and condition requirements." },
      { property: "og:title", content: "Returns & Refunds — BXLACK" },
      { property: "og:description", content: "Return and exchange a BXLACK piece within 14 days." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/returns" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/returns" }],
  }),
  component: () => (
    <InfoPage
      eyebrow="Client Services — 002"
      title="Returns &"
      italic="refunds."
      intro="Pieces may be returned within 14 days of delivery, unworn, unwashed and with all labels and the numbered tag attached."
      blocks={[
        {
          heading: "How to return",
          body: [
            "Email clients@bxlack.com with your order number and the piece you wish to return. We issue a prepaid label for domestic returns.",
            "Repack the piece in its original tissue and mailer. Parcels received damaged or without their tag cannot be accepted.",
          ],
        },
        {
          heading: "Exchanges",
          body: [
            "Size exchanges are free within Europe, subject to availability. Because runs are numbered and limited, we recommend confirming stock before returning.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "Refunds are issued to the original payment method within 5–10 working days of the return being received and inspected.",
            "Original shipping charges are refunded only where the piece is faulty or incorrectly supplied.",
          ],
        },
        {
          heading: "Final sale",
          body: [
            "Archive pieces, one-of-one samples and items marked final sale are not eligible for return unless faulty.",
          ],
        },
      ]}
    />
  ),
});