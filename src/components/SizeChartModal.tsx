import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { sizeRowsFor, diagramFor, formatMeasurement, garmentKindFor, type Unit } from "@/lib/sizing";
import { ImageZoomModal } from "@/components/ImageZoomModal";

function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g stroke="white" strokeOpacity={0.55} strokeWidth={1}>
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <text
        x={(x1 + x2) / 2}
        y={y - 9}
        textAnchor="middle"
        stroke="none"
        fill="white"
        fillOpacity={0.65}
        fontSize="8"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.05em"
      >
        {label}
      </text>
    </g>
  );
}

function DimV({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  return (
    <g stroke="white" strokeOpacity={0.55} strokeWidth={1}>
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <text
        x={x + 9}
        y={(y1 + y2) / 2}
        dominantBaseline="middle"
        stroke="none"
        fill="white"
        fillOpacity={0.65}
        fontSize="8"
        fontFamily="ui-monospace, monospace"
        letterSpacing="0.05em"
        transform={`rotate(90 ${x + 9} ${(y1 + y2) / 2})`}
      >
        {label}
      </text>
    </g>
  );
}

function TopDiagram({ shirt }: { shirt?: boolean }) {
  return (
    <svg viewBox="0 0 260 340" className="h-full w-full">
      <path
        d="M110,22 L150,22 L182,30 L220,55 L214,95 L180,85 L190,290 L70,290 L80,85 L46,95 L40,55 L78,30 Z"
        fill="none"
        stroke="white"
        strokeOpacity={0.85}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      {shirt ? (
        <>
          <path
            d="M110,22 L118,34 L130,26"
            fill="none"
            stroke="white"
            strokeOpacity={0.85}
            strokeWidth={1}
          />
          <path
            d="M150,22 L142,34 L130,26"
            fill="none"
            stroke="white"
            strokeOpacity={0.85}
            strokeWidth={1}
          />
          <line
            x1={130}
            y1={26}
            x2={130}
            y2={288}
            stroke="white"
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        </>
      ) : null}
      <DimH x1={78} x2={182} y={44} label="Shoulder" />
      <DimH x1={70} x2={190} y={200} label="Chest" />
      <DimV x={230} y1={22} y2={290} label="Length" />
    </svg>
  );
}

function DenimDiagram() {
  return (
    <svg viewBox="0 -14 260 354" className="h-full w-full">
      <path
        d="M70,20 L190,20 L185,50 L200,320 L165,320 L130,150 L95,320 L60,320 L75,50 Z"
        fill="none"
        stroke="white"
        strokeOpacity={0.85}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      <line
        x1={130}
        y1={20}
        x2={130}
        y2={150}
        stroke="white"
        strokeOpacity={0.35}
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <DimH x1={70} x2={190} y={10} label="Waist" />
      <DimV x={20} y1={20} y2={150} label="Rise" />
      <DimV x={220} y1={150} y2={320} label="Inseam" />
    </svg>
  );
}

export function SizeChartModal({
  open,
  onClose,
  category,
  productId,
  selectedSize,
  onSelectSize,
}: {
  open: boolean;
  onClose: () => void;
  category: string;
  productId?: string;
  selectedSize: string;
  onSelectSize: (size: string) => void;
}) {
  const [unit, setUnit] = useState<Unit>("cm");
  const [zoomOpen, setZoomOpen] = useState(false);
  if (!open) return null;

  const kind = garmentKindFor(category);
  const rows = sizeRowsFor(productId);
  const diagramImage = diagramFor(productId);
  const row = rows.find((r) => r.size === selectedSize) ?? rows[Math.min(1, rows.length - 1)];

  const fields = (
    kind === "denim"
      ? [
          { label: "Waist", value: row.waist },
          { label: "Rise", value: row.rise },
          { label: "Inseam", value: row.inseam },
        ]
      : [
          { label: "Shoulder", value: row.shoulder },
          { label: "Chest", value: row.chest },
          { label: "Length", value: row.length },
          { label: "Sleeve", value: row.sleeve },
        ]
  ).filter((f): f is { label: string; value: number } => f.value !== undefined);

  return (
    <>
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 px-5 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`grain relative flex max-h-[90vh] w-full flex-col border border-white/15 bg-noir text-white ${diagramImage ? "max-w-6xl" : "max-w-3xl"}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">BXLACK</p>
            <h2 className="mt-1 font-display text-lg uppercase tracking-[-0.01em]">Measurements</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center text-white/50 transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-8 overflow-y-auto p-6 sm:p-8 md:grid-cols-[1fr_260px]">
          <div className="flex items-center justify-center bg-white/[0.02] p-6">
            {diagramImage ? (
              <button type="button" onClick={() => setZoomOpen(true)} className="group relative">
                <img
                  src={diagramImage}
                  alt="Construction diagram"
                  className="max-h-[50vh] w-auto max-w-full object-contain"
                />
                <span className="absolute bottom-0 right-0 flex items-center gap-1.5 bg-noir/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 transition-colors group-hover:text-white">
                  <ZoomIn size={11} />
                  Zoom
                </span>
              </button>
            ) : (
              <div className="aspect-[13/17] w-full max-w-[260px]">
                {kind === "denim" ? <DenimDiagram /> : <TopDiagram shirt={category === "Shirt"} />}
              </div>
            )}
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">Size</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {rows.map((r) => (
                <button
                  key={r.size}
                  onClick={() => onSelectSize(r.size)}
                  className={`flex h-8 min-w-[38px] items-center justify-center border px-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                    r.size === selectedSize
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-white/55 hover:border-white/60 hover:text-white"
                  }`}
                >
                  {r.size}
                </button>
              ))}
            </div>

            <div className="mt-6 flex border border-white/15">
              {(["cm", "in"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors ${
                    unit === u ? "bg-white text-black" : "text-white/50 hover:text-white"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5">
              {fields.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                    {f.label}
                  </dt>
                  <dd className="font-mono text-[12px] text-white">
                    {formatMeasurement(f.value, unit)}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 font-editorial text-[12px] leading-relaxed text-white/50">
              Measured flat, tolerance ±1cm. Model is 186cm and wears M.
            </p>
          </div>
        </div>
      </div>
    </div>

    {zoomOpen && diagramImage ? (
      <ImageZoomModal
        images={[diagramImage]}
        index={0}
        alt="Construction diagram"
        onClose={() => setZoomOpen(false)}
        onIndexChange={() => {}}
      />
    ) : null}
    </>
  );
}
