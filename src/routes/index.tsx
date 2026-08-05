import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { ManifestoScroll } from "@/components/home/ManifestoScroll";
import { SplitCategories } from "@/components/home/SplitCategories";
import { AtelierMarquee } from "@/components/home/AtelierMarquee";
import { DropCountdown } from "@/components/home/DropCountdown";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <NewArrivals />
      <ManifestoScroll />
      <SplitCategories />
      <AtelierMarquee />
      <DropCountdown />
    </AppShell>
  );
}
