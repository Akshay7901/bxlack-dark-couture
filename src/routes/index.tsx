import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { LightsOutHero } from "@/components/home/LightsOutHero";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { GraphicFeature } from "@/components/home/GraphicFeature";
import { HeritageFeature } from "@/components/home/HeritageFeature";
import { CampaignFeature } from "@/components/home/CampaignFeature";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { seo } from "@/lib/seo";
import { loadHeroSettings } from "@/lib/hero";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: "BXLACK — Born To Stand Apart",
      description:
        "BXLACK is editorial luxury streetwear for those who refuse to blend in. Shop numbered, small-batch T-shirts, shirts and jeans.",
      path: "/",
    }),
  // Hero style and copy are editable in Studio → Store → Homepage hero.
  loader: () => loadHeroSettings(),
  component: Index,
});

function Index() {
  const hero = Route.useLoaderData();
  return (
    <AppShell hideNewsletter={false}>
      {hero.style === "classic" ? <Hero /> : <LightsOutHero hero={hero} />}
      <ShopByCategory />
      <GraphicFeature />
      <HeritageFeature />
      <CampaignFeature />
      <InstagramFeed />
    </AppShell>
  );
}
