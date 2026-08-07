import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";
import { CategorySlides } from "@/components/home/CategorySlides";
import { TrustBar } from "@/components/home/TrustBar";
import { ShopByCollection } from "@/components/home/ShopByCollection";
import { BrandPillars } from "@/components/home/BrandPillars";
import { Testimonials } from "@/components/home/Testimonials";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <NewArrivals />
      <CategorySlides />
      <TrustBar />
      <ShopByCollection />
      <BrandPillars />
      <Testimonials />
    </AppShell>
  );
}
