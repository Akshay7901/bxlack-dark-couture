import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Copy, Instagram, Play } from "lucide-react";
import {
  effectiveLayout,
  instagramUrl,
  useInstagramSection,
  type InstagramPost,
  type InstagramSettings,
} from "@/lib/instagram";

const EASE = [0.7, 0, 0.2, 1] as const;

type LayoutProps = { posts: InstagramPost[]; settings: InstagramSettings };

export function InstagramFeed() {
  const { settings, posts, isPending, hiddenSection } = useInstagramSection();

  if (hiddenSection) return null;

  if (isPending) {
    return (
      <Shell settings={settings}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-square animate-pulse bg-white/5" />
          ))}
        </div>
      </Shell>
    );
  }

  if (posts.length === 0) return null;

  switch (effectiveLayout(settings.layout, posts.length)) {
    case "slider":
      return <SliderLayout posts={posts} settings={settings} />;
    case "mosaic":
      return <MosaicLayout posts={posts} settings={settings} />;
    case "marquee":
      return <MarqueeLayout posts={posts} settings={settings} />;
    case "strip":
      return <StripLayout posts={posts} settings={settings} />;
    default:
      return <GridLayout posts={posts} settings={settings} />;
  }
}

/* ---------------------------------------------------------------- Grid --- */

// Up to one full row on desktop is padded with a "Follow" tile; past that we
// show whole rows of four so the grid never ends ragged.
const SMALL_GRID: Record<number, string> = {
  2: "grid-cols-2 max-w-3xl mx-auto",
  3: "grid-cols-2 sm:grid-cols-3 max-w-5xl mx-auto",
  4: "grid-cols-2 lg:grid-cols-4",
};

function GridLayout({ posts: all, settings }: LayoutProps) {
  const posts = all.length >= 4 ? all.slice(0, Math.floor(all.length / 4) * 4) : all;
  const withFollowTile = posts.length < 4;
  const gridClass = withFollowTile ? SMALL_GRID[posts.length + 1] : "grid-cols-2 lg:grid-cols-4";
  return (
    <Shell settings={settings}>
      <div className={`grid gap-2 sm:gap-3 ${gridClass}`}>
        {posts.map((p, i) => (
          <Reveal key={p.id} index={i}>
            <PostTile post={p} className="aspect-square" />
          </Reveal>
        ))}
        {withFollowTile ? <FollowTile settings={settings} className="aspect-square" /> : null}
      </div>
    </Shell>
  );
}

/* -------------------------------------------------------------- Slider --- */

function SliderLayout({ posts, settings }: LayoutProps) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: -1 | 1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const card = "w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[calc((100%-36px)/4)]";

  return (
    <Shell
      settings={settings}
      actions={
        <div className="hidden gap-2 sm:flex">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d)}
              aria-label={d < 0 ? "Previous posts" : "Next posts"}
              className="flex h-10 w-10 items-center justify-center border border-light-grey/20 text-foreground transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              {d < 0 ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      }
    >
      <div
        ref={track}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((p, i) => (
          <Reveal key={p.id} index={i} className={card}>
            <PostTile post={p} className="aspect-[4/5]" hoverCaption={false} />
            {p.caption ? (
              <p className="mt-3 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-light-grey/70">{p.caption}</p>
            ) : null}
            {p.timestamp ? (
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-light-grey/40">
                {formatDate(p.timestamp)}
              </p>
            ) : null}
          </Reveal>
        ))}
        <div className={card}>
          <FollowTile settings={settings} className="aspect-[4/5]" />
        </div>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------------------- Mosaic --- */

function MosaicLayout({ posts: all, settings }: LayoutProps) {
  // One large tile (2×2) plus rows of four small ones: 5, 9, 13… posts.
  const posts = all.slice(0, 5 + Math.floor((all.length - 5) / 4) * 4);
  return (
    <Shell settings={settings}>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {posts.map((p, i) => (
          <Reveal key={p.id} index={i} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <PostTile post={p} className="aspect-square h-full" large={i === 0} />
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------- Marquee --- */

function MarqueeLayout({ posts, settings }: LayoutProps) {
  // Repeat until the strip is wider than any screen, then render it twice so
  // the -50% loop in `animate-marquee` is seamless.
  const loop: InstagramPost[] = [];
  while (loop.length < 10) loop.push(...posts);
  const tiles = [...loop, ...loop];

  return (
    <Shell settings={settings} fullBleed>
      <div className="group/marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto">
        <div
          className="flex w-max animate-marquee group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]"
          style={{ animationDuration: `${loop.length * 5}s` }}
        >
          {tiles.map((p, i) => (
            <div key={`${p.id}-${i}`} className="mr-2 w-52 shrink-0 sm:mr-3 sm:w-72" aria-hidden={i >= loop.length || undefined}>
              <PostTile post={p} className="aspect-square" tabIndex={i >= posts.length ? -1 : undefined} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-center sm:mt-10">
        <FollowButton settings={settings} />
      </div>
    </Shell>
  );
}

/* --------------------------------------------------------------- Strip --- */

function StripLayout({ posts: all, settings }: LayoutProps) {
  const posts = all.slice(0, 6);
  return (
    <section className="relative bg-noir text-foreground">
      <div
        className="grid grid-cols-3 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": posts.length } as React.CSSProperties}
      >
        {posts.map((p, i) => (
          // Phones: two rows of three when there are six, else one row.
          <PostTile
            key={p.id}
            post={p}
            className={`aspect-square ${i >= 3 && posts.length < 6 ? "hidden sm:block" : ""}`}
            hoverCaption={false}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="glass pointer-events-auto flex flex-col items-center gap-3 px-6 py-5 text-center sm:gap-4 sm:px-12 sm:py-8"
        >
          <h2 className="font-display text-base font-medium uppercase tracking-[0.2em] sm:text-2xl">{settings.heading}</h2>
          <FollowButton settings={settings} />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Shared --- */

function Shell({
  settings,
  actions,
  fullBleed,
  children,
}: {
  settings: InstagramSettings;
  actions?: React.ReactNode;
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  const heading = (
    <div className={`mb-8 flex items-end gap-4 sm:mb-12 md:mb-16 ${actions ? "justify-between" : "justify-center"}`}>
      <div className={`flex flex-col gap-3 ${actions ? "items-start text-left" : "items-center text-center"}`}>
        <h2 className="font-display text-xl font-medium uppercase tracking-[0.2em] sm:text-2xl">{settings.heading}</h2>
        <a
          href={instagramUrl(settings.handle)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-light-grey/60 transition-colors hover:text-white"
        >
          <Instagram className="h-3.5 w-3.5" />@{settings.handle}
        </a>
      </div>
      {actions}
    </div>
  );
  return (
    <section className="bg-noir py-14 text-foreground sm:py-20 md:py-28">
      {fullBleed ? (
        <>
          <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">{heading}</div>
          {children}
        </>
      ) : (
        <div className="mx-auto max-w-[1600px] px-5 sm:px-6 md:px-10">
          {heading}
          {children}
        </div>
      )}
    </section>
  );
}

function Reveal({ index, className = "", children }: { index: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ delay: (index % 4) * 0.08, duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function PostTile({
  post: p,
  className = "",
  hoverCaption = true,
  large = false,
  tabIndex,
}: {
  post: InstagramPost;
  className?: string;
  hoverCaption?: boolean;
  large?: boolean;
  tabIndex?: number;
}) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      aria-label={p.caption ? `Instagram post: ${p.caption.slice(0, 80)}` : "Open post on Instagram"}
      className={`group relative block overflow-hidden bg-card ${className}`}
    >
      <img
        src={p.image}
        alt=""
        width={700}
        height={700}
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
        <Instagram className={large ? "h-7 w-7 text-white" : "h-5 w-5 text-white"} />
        {hoverCaption && p.caption ? (
          <p
            className={`whitespace-pre-line leading-relaxed text-light-grey/80 ${
              large ? "line-clamp-6 max-w-md text-sm" : "line-clamp-4 text-xs"
            }`}
          >
            {p.caption}
          </p>
        ) : null}
      </div>
    </a>
  );
}

function FollowTile({ settings, className = "" }: { settings: InstagramSettings; className?: string }) {
  return (
    <a
      href={instagramUrl(settings.handle)}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col items-center justify-center gap-4 border border-light-grey/15 bg-card p-6 text-center transition-colors hover:border-light-grey/40 ${className}`}
    >
      <Instagram className="h-7 w-7 text-white transition-transform duration-500 group-hover:scale-110" />
      <span className="font-display text-sm uppercase tracking-[0.2em] text-foreground">{settings.followText}</span>
      <span className="font-mono text-xs text-light-grey/60">@{settings.handle}</span>
    </a>
  );
}

function FollowButton({ settings }: { settings: InstagramSettings }) {
  return (
    <a
      href={instagramUrl(settings.handle)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 border border-white bg-white px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-black transition-colors hover:bg-transparent hover:text-white sm:px-7"
    >
      <Instagram className="h-3.5 w-3.5" />
      Follow @{settings.handle}
    </a>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
