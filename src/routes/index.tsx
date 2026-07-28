import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Hero } from "@/components/home/Hero";
import { Story } from "@/components/home/Story";
import { NewDrop } from "@/components/home/NewDrop";
import { Lookbook } from "@/components/home/Lookbook";
import { Marquee } from "@/components/Marquee";
import { Pinned } from "@/components/home/Pinned";
import { FilmStrip } from "@/components/home/FilmStrip";
import { Numerals } from "@/components/home/Numerals";
import { Credits } from "@/components/home/Credits";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <Hero />
      <Marquee items={["Born to stand apart", "SS26 · Chapter 001", "Made in silence", "Numbered · Not repeated"]} />
      <Pinned />
      <FilmStrip />
      <Story />
      <Marquee items={["One garment · one owner", "No colour grade", "No restock", "Cut in Antwerp · Finished in Tokyo"]} />
      <Numerals />
      <NewDrop />
      <Lookbook />
      <Credits />
    </AppShell>
  );
}
