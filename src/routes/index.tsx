import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { Story } from "@/components/home/Story";
import { NewDrop } from "@/components/home/NewDrop";
import { Lookbook } from "@/components/home/Lookbook";
import { Marquee } from "@/components/Marquee";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <Marquee items={["Born to stand apart", "SS26 · Chapter 001", "Made in silence", "Numbered · Not repeated"]} />
      <Story />
      <NewDrop />
      <Lookbook />
    </AppShell>
  );
}
