import { motion } from "framer-motion";
import { Copy, Instagram, Play } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, useInstagramPosts } from "@/lib/instagram";

// Up to one full row on desktop is padded with a "Follow" tile; past that we
// show whole rows of four so the grid never ends ragged.
const SMALL_GRID: Record<number, string> = {
  2: "grid-cols-2 max-w-3xl mx-auto",
  3: "grid-cols-2 sm:grid-cols-3 max-w-5xl mx-auto",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function InstagramFeed() {
  const { data, isPending } = useInstagramPosts();

  if (isPending) {
    return (
      <Shell>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-square animate-pulse bg-white/5" />
          ))}
        </div>
      </Shell>
    );
  }

  const all = data ?? [];
  if (all.length === 0) return null;

  const posts = all.length >= 8 ? all.slice(0, 8) : all.length >= 4 ? all.slice(0, 4) : all;
  const withFollowTile = posts.length < 4;
  const gridClass = withFollowTile ? SMALL_GRID[posts.length + 1] : "grid-cols-2 lg:grid-cols-4";

  return (
    <Shell>
      <div className={`grid gap-2 sm:gap-3 ${gridClass}`}>
        {posts.map((p, i) => (
          <motion.a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.caption ? `Instagram post: ${p.caption.slice(0, 80)}` : "Open post on Instagram"}
            className="group relative block aspect-square overflow-hidden bg-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ delay: (i % 4) * 0.08, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          >
            <img
              src={p.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover grayscale-[15%] transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-105"
            />
            {p.type !== "IMAGE" ? (
              <span className="absolute right-3 top-3 text-white drop-shadow">
                {p.type === "VIDEO" ? <Play className="h-4 w-4 fill-current" /> : <Copy className="h-4 w-4" />}
              </span>
            ) : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-5 text-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              <Instagram className="h-5 w-5 text-white" />
              {p.caption ? (
                <p className="line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-light-grey/80">{p.caption}</p>
              ) : null}
            </div>
          </motion.a>
        ))}

        {withFollowTile ? (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex aspect-square flex-col items-center justify-center gap-4 border border-light-grey/15 bg-card p-6 text-center transition-colors hover:border-light-grey/40"
          >
            <Instagram className="h-7 w-7 text-white transition-transform duration-500 group-hover:scale-110" />
            <span className="font-display text-sm uppercase tracking-[0.2em] text-foreground">Follow the darkness</span>
            <span className="font-mono text-xs text-light-grey/60">@{INSTAGRAM_HANDLE}</span>
          </a>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-noir py-14 text-foreground sm:py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-12 md:mb-16">
          <h2 className="font-display text-xl font-medium uppercase tracking-[0.2em] sm:text-2xl">On Instagram</h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-light-grey/60 transition-colors hover:text-white"
          >
            <Instagram className="h-3.5 w-3.5" />@{INSTAGRAM_HANDLE}
          </a>
        </div>
        {children}
      </div>
    </section>
  );
}
