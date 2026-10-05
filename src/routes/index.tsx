import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { GraphicFeature } from "@/components/home/GraphicFeature";
import { HeritageFeature } from "@/components/home/HeritageFeature";
import { CampaignFeature } from "@/components/home/CampaignFeature";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: "BXLACK — Born To Stand Apart",
      description:
        "BXLACK is editorial luxury streetwear for those who refuse to blend in. Shop numbered, small-batch T-shirts, shirts and jeans.",
      path: "/",
    }),
  component: Index,
});

function Index() {
  return (
    <AppShell hideNewsletter={false}>
      <Hero />
      <ShopByCategory />
      <GraphicFeature />
      <HeritageFeature />
      <CampaignFeature />
    </AppShell>
  );
}
