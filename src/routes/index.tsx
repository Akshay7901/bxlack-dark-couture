import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { GraphicFeature } from "@/components/home/GraphicFeature";
import { HeritageFeature } from "@/components/home/HeritageFeature";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <ShopByCategory />
      <GraphicFeature />
      <HeritageFeature />
    </AppShell>
  );
}
