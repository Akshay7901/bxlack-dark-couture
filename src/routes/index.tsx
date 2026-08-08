import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { FirstDrop } from "@/components/home/FirstDrop";
import { NewArrivals } from "@/components/home/NewArrivals";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { GraphicFeature } from "@/components/home/GraphicFeature";
import { HeritageFeature } from "@/components/home/HeritageFeature";
import { Campaign } from "@/components/home/Campaign";
import { Story } from "@/components/home/Story";
import { Lookbook } from "@/components/home/Lookbook";
import { BestSellers } from "@/components/home/BestSellers";
import { SocialSection } from "@/components/home/SocialSection";

const TITLE = "BXLACK — Born To Stand Apart";
const DESC =
  "BXLACK: one colour, every occasion, zero compromise. Explore the SS26 first drop — limited, hand-numbered luxury streetwear.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <FirstDrop />
      <NewArrivals />
      <ShopByCategory />
      <GraphicFeature />
      <HeritageFeature />
      <Campaign />
      <Story />
      <Lookbook />
      <BestSellers />
      <SocialSection />
    </AppShell>
  );
}
