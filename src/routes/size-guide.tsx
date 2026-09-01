import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";
import { SIZE_ROWS } from "@/lib/sizing";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Size Guide — BXLACK" },
      {
        name: "description",
        content:
          "BXLACK measurements in centimetres for t-shirts, shirts and denim, plus fit and measuring guidance.",
      },
      { property: "og:title", content: "Size Guide — BXLACK" },
      {
        property: "og:description",
        content: "Measurements, fit notes and how to measure for BXLACK pieces.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bxlack-dark-couture.lovable.app/size-guide" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bxlack-dark-couture.lovable.app/size-guide" }],
  }),
  component: SizeGuidePage,
});

function SizeGuidePage() {
  return (
    <InfoPage
      eyebrow="Client Services"
      title="Size"
      italic="guide."
      intro="All measurements are taken flat, in centimetres, with a tolerance of ±1cm. Our silhouettes are cut oversized, so size down for a closer line."
      blocks={[
        {
          heading: "How to measure",
          body: [
            "Chest: measure across the garment 2cm below the armhole and double the value.",
            "Length: measure from the highest point of the shoulder straight down to the hem.",
            "Waist (denim): measure across the top of the waistband and double the value.",
          ],
        },
        {
          heading: "Fit notes",
          body: [
            "T-shirts: boxy, dropped shoulder, heavyweight 260 GSM cotton with minimal shrinkage.",
            "Shirts: relaxed camp collar, straight body, intended to be worn open.",
            "Denim: mid-rise, straight leg through the knee with a slight break at the hem.",
          ],
        },
      ]}
    >
      <div className="mt-4 overflow-x-auto border-t border-light-grey/10 pt-10">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-[0.3em] text-mid-grey/70">
              <th className="py-4 font-normal">Size</th>
              <th className="py-4 font-normal">Chest</th>
              <th className="py-4 font-normal">Length</th>
              <th className="py-4 font-normal">Shoulder</th>
              <th className="py-4 font-normal">Waist</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((r) => (
              <tr key={r.size} className="border-t border-light-grey/10 text-sm text-light-grey/80">
                <td className="py-4 font-mono text-white">{r.size}</td>
                <td className="py-4">{r.chest} cm</td>
                <td className="py-4">{r.length} cm</td>
                <td className="py-4">{r.shoulder} cm</td>
                <td className="py-4">{r.waist} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoPage>
  );
}
