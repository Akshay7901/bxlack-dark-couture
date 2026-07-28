import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { NewArrivals } from "@/components/home/NewArrivals";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <NewArrivals />
    </AppShell>
  );
}
