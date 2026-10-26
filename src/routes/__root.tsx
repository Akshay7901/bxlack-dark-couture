import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Loader } from "@/components/Loader";
import { LaunchGate } from "@/components/LaunchGate";
import { seo } from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center bg-noir px-6 text-center text-white">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-mid-grey/70">
        Error · 404
      </p>
      <h1 className="mt-6 font-display text-[26vw] font-medium leading-[0.8] tracking-[-0.05em] md:text-[14vw]">
        Lost in <em className="font-editorial italic text-white/60">black.</em>
      </h1>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-light-grey/60">
        This page was never cut, or it has already sold out of the archive.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="border border-light-grey/25 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.3em] transition-colors hover:bg-white hover:text-noir"
        >
          Home
        </Link>
        <Link
          to="/shop"
          search={{ type: "All" }}
          className="border border-light-grey/25 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.3em] transition-colors hover:bg-white hover:text-noir"
        >
          Shop the collection
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "BXLACK" },
      { name: "theme-color", content: "#000000" },
      { name: "twitter:site", content: "@BXLACK" },
      // Site-wide defaults; each route's own seo() tags override these.
      ...seo({
        title: "BXLACK — Born To Stand Apart",
        description:
          "BXLACK is editorial luxury streetwear for those who refuse to blend in. Shop numbered, small-batch T-shirts, shirts and jeans.",
      }).meta,
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=clash-display@600,700,500,400&f[]=satoshi@400,500,700&f[]=general-sans@400,500,600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Loader />
      <LaunchGate>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </LaunchGate>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
