import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BXLACK" },
      { name: "description", content: "How BXLACK collects, uses and protects personal data, and the rights available to you." },
      { property: "og:title", content: "Privacy Policy — BXLACK" },
      { property: "og:description", content: "How BXLACK handles personal data and cookies." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/privacy" }],
  }),
  component: () => (
    <InfoPage
      eyebrow="Legal — 001"
      title="Privacy"
      italic="policy."
      intro="This notice describes the personal data BXLACK collects, why we collect it and the choices available to you. It is a template and should be reviewed by your legal advisor before launch."
      blocks={[
        {
          heading: "Data we collect",
          body: [
            "Order data: name, delivery and billing address, email, telephone and order history.",
            "Technical data: device, browser, IP address and pages viewed, collected through analytics.",
            "We do not store full card numbers. Payments are processed by our payment provider.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To process and deliver orders, handle returns, provide client care, prevent fraud and — where you have consented — send campaign and drop announcements.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use essential cookies to keep your cart and session working, and analytics cookies to understand how the site is used. You can refuse non-essential cookies in your browser settings.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may request access, correction, deletion or portability of your data, and withdraw marketing consent at any time by writing to privacy@bxlack.com.",
            "Data is retained only as long as needed for legal, accounting and client-care purposes.",
          ],
        },
      ]}
    />
  ),
});