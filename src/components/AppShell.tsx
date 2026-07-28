import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { CartDrawer } from "./CartDrawer";

export function AppShell({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState(false);
  return (
    <div className="grain relative min-h-screen bg-noir text-white">
      <Loader />
      <Cursor />
      <Header onCart={() => setCart(true)} />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}