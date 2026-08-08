import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === "string" ? search.type : "All",
  }),
  head: () => ({
    meta: [
      { title: "Shop — BXLACK" },
      { name: "description", content: "The BXLACK SS26 collection. Numbered, small-batch luxury streetwear." },
      { property: "og:title", content: "Shop — BXLACK" },
      { property: "og:description", content: "The SS26 collection. Numbered, small-batch." },
    ],
  }),
  component: ShopPage,
});

const types = ["All", "Tshirt", "Shirt", "Jeans"] as const;
const typeLabels: Record<string, string> = { All: "All", Tshirt: "T-Shirt", Shirt: "Shirt", Jeans: "Jeans" };
const sizes = ["S", "M", "L", "XL", "XXL"] as const;
const sorts = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "name", label: "Alphabetical" },
] as const;

function Dropdown({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 transition-colors hover:text-white"
      >
        {label}
        {value ? <span className="text-white">{value}</span> : null}
        <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-3 min-w-[190px] border border-white/10 bg-[#111111] p-2 shadow-2xl">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function Option({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ShopPage() {
  const { type } = Route.useSearch();
  const navigate = useNavigate();
  const [sort] = useState<string>("featured");
  const [dense] = useState(false);

  const selectedType: (typeof types)[number] =
    types.includes(type as (typeof types)[number]) ? (type as (typeof types)[number]) : "All";

  const filtered = useMemo(() => {
    const base = selectedType === "All" ? products : products.filter((p) => p.category === selectedType);
    const sorted = [...base];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [selectedType, sort]);

  return (
    <AppShell hideNewsletter>
      <section className="pt-28 md:pt-40">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
          {filtered.length === 0 ? (
            <div className="flex h-[40vh] items-center justify-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">No pieces in this category.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:gap-x-6 md:gap-y-14 ${dense ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
              {filtered.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
                  className="group"
                >
                  <Link to="/product/$id" params={{ id: p.id }} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#141414]">
                      <img
                        src={p.image}
                        alt={p.name}
                        className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1.2s] ease-[cubic-bezier(0.7,0,0.2,1)] ${
                          p.backImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                        }`}
                        loading="lazy"
                      />
                      {p.backImage ? (
                        <img
                          src={p.backImage}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[1.2s] ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:opacity-100"
                          loading="lazy"
                        />
                      ) : null}
                      {p.badge ? (
                        <span className="absolute left-3 top-3 border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.25em] text-white backdrop-blur-md sm:text-[9px]">
                          {p.badge}
                        </span>
                      ) : null}
                      <span className="absolute right-3 top-3 font-mono text-[8px] uppercase tracking-[0.25em] text-white/45 sm:text-[9px]">
                        {p.tag}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h2 className="font-sans text-[13px] leading-snug text-white/90 sm:text-sm">{p.name}</h2>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-xs text-white sm:text-[13px]">€{p.price}</span>
                        {p.compareAt ? (
                          <span className="font-mono text-[10px] text-white/35 line-through sm:text-[11px]">€{p.compareAt}</span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {sizes.map((s) => (
                          <span
                            key={s}
                            className="border border-white/12 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-white/40"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="h-32" />
    </AppShell>
  );
}