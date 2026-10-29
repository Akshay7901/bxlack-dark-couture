import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { enter } from "@/lib/motion";

/** False until the first page has rendered: the very first page (server-rendered,
 * behind the intro loader) shows immediately; later navigations fade in. */
let hasNavigated = false;

/** True when this render comes from an in-app navigation rather than the first
 * server-rendered page, i.e. when it is safe to start content hidden and animate it in. */
export function useAnimateIn() {
  const [animateIn] = useState(() => hasNavigated);
  return animateIn;
}

export function AppShell({
  children,
  hideNewsletter = true,
  hideFooter,
}: {
  children: ReactNode;
  /** The newsletter block is homepage-only — every other page hides it by default. */
  hideNewsletter?: boolean;
  hideFooter?: boolean;
}) {
  const [cart, setCart] = useState(false);
  const { pathname } = useLocation();
  const animateIn = useAnimateIn();
  useEffect(() => {
    hasNavigated = true;
  }, []);
  useEffect(() => {
    const open = () => setCart(true);
    window.addEventListener("bxlack:open-cart", open);
    return () => window.removeEventListener("bxlack:open-cart", open);
  }, []);
  return (
    <div className="store grain relative min-h-screen bg-noir text-white">
      <Header onCart={() => setCart(true)} />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
      {/* Page transition: each page fades up softly on arrival. Enter only (no
          exit), so navigation is never held up waiting for an animation. */}
      <motion.main
        key={pathname}
        initial={animateIn ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={enter}
      >
        {children}
      </motion.main>
      {hideFooter ? null : <Footer hideNewsletter={hideNewsletter} />}
    </div>
  );
}
