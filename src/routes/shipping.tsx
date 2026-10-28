import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";
import { seo } from "@/lib/seo";
import { loadPage } from "@/lib/pages/pages";

export const Route = createFileRoute("/shipping")({
  head: () =>
    seo({
      title: "Shipping & Delivery — BXLACK",
      description:
        "BXLACK shipping methods, delivery timelines, charges and information on international duties and taxes.",
      path: "/shipping",
    }),
  // Copy is editable in Studio → Store → Pages; falls back to the default text.
  loader: () => loadPage("shipping"),
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