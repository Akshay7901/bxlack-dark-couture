import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { GraphicFeature } from "@/components/home/GraphicFeature";
import { HeritageFeature } from "@/components/home/HeritageFeature";
import { CampaignFeature } from "@/components/home/CampaignFeature";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { BRAND_FAQ, HomeFaq } from "@/components/home/HomeFaq";
import { loadPage } from "@/lib/pages/pages";
import { SITE_URL, jsonLd, seo } from "@/lib/seo";

/** How many questions from the FAQ page to show after "What is BXLACK?". */
const HOME_FAQ_COUNT = 4;

export const Route = createFileRoute("/")({
  // The homepage FAQ reuses the FAQ page's questions (editable in Studio → Store → Pages).
  loader: async () => {
    const faq = await loadPage("faq");
    return { faqs: [BRAND_FAQ, ...faq.faqs.slice(0, HOME_FAQ_COUNT)] };
  },
  head: ({ loaderData }) => ({
    ...seo({
      title: "BXLACK — Luxury Black Streetwear | T-Shirts, Shirts & Jeans",
      description:
        "BXLACK is editorial luxury streetwear for those who refuse to blend in. Shop numbered, small-batch T-shirts, shirts and jeans.",
      path: "/",
    }),
    scripts: [
      // Marks the headline and the "What is BXLACK?" answer as read-aloud summaries.
      jsonLd({
        "@type": "WebPage",
        name: "BXLACK — Luxury Black Streetwear",
        url: `${SITE_URL}/`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "[data-speakable]"] },
      }),
      jsonLd({
        "@type": "FAQPage",
        description: "Common questions about BXLACK: what the brand is, drops, restocks, fit and delivery.",
        mainEntity: (loaderData?.faqs ?? [BRAND_FAQ]).map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    ],
  }),
  component: Index,
});

function Index() {
  const { faqs } = Route.useLoaderData();
  return (
    <AppShell hideNewsletter={false}>
      <Hero />
      <ShopByCategory />
      <GraphicFeature />
      <HeritageFeature />
      <CampaignFeature />
      <InstagramFeed />
      <HomeFaq items={faqs} />
    </AppShell>
  );
}
