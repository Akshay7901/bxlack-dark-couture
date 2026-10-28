import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";
import { seo } from "@/lib/seo";
import { loadPage } from "@/lib/pages/pages";

export const Route = createFileRoute("/returns")({
  head: () =>
    seo({
      title: "Returns & Refunds — BXLACK",
      description:
        "How to return, exchange or cancel a BXLACK order, including refund timelines and the condition items must be in.",
      path: "/returns",
    }),
  // Copy is editable in Studio → Store → Pages; falls back to the default text.
  loader: () => loadPage("returns"),
  component: Page,
});

function Page() {
  const page = Route.useLoaderData();
  return (
    <InfoPage
      hideNewsletter
      eyebrow={page.eyebrow || undefined}
      title={page.title}
      italic={page.italic || undefined}
      intro={page.intro || undefined}
      blocks={page.blocks}
    />
  );
}