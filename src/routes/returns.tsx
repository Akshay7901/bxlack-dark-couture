import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Refunds — BXLACK" },
      { name: "description", content: "How to return, exchange or cancel a BXLACK order, refund timelines and condition requirements." },
      { property: "og:title", content: "Returns & Refunds — BXLACK" },
      { property: "og:description", content: "How to return, exchange or cancel a BXLACK order." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/returns" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/returns" }],
  }),
  component: () => (
    <InfoPage
      hideNewsletter
      eyebrow="Client Services"
      title="Returns &"
      italic="refunds."
      intro="Product photography is enhanced in post-production, so colour can read slightly differently in person. Beyond that, here's exactly how returns, exchanges and cancellations work."
      blocks={[
        {
          heading: "Before you send it back",
          body: [
            "A return must be postmarked within 7 days of delivery. Made-to-order pieces are final sale and can't be returned or exchanged.",
            "The item needs to come back new, unused and in its original condition, with brand tag and plastic seal still attached. Once either is removed, the piece is no longer eligible.",
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
            "Packaging (wooden boxes, brown boxes, gift wraps) is part of delivery, not the product, and isn't returnable or refundable under any circumstance.",
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
          body: ["Returns and exchanges aren't available outside India, so please choose sizing and pieces carefully before ordering internationally."],
        },
      ]}
    />
  ),
});
