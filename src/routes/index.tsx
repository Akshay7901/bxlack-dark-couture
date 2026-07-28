import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { Story } from "@/components/home/Story";
import { NewDrop } from "@/components/home/NewDrop";
import { Lookbook } from "@/components/home/Lookbook";
import { Pinned } from "@/components/home/Pinned";
import { FilmStrip } from "@/components/home/FilmStrip";
import { Numerals } from "@/components/home/Numerals";
import { Credits } from "@/components/home/Credits";
import { Campaign } from "@/components/home/Campaign";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <Pinned />
      <FilmStrip />
      <Campaign />
      <Story />
      <Numerals />
      <NewDrop />
      <Lookbook />
      <Credits />
    </AppShell>
  );
}
