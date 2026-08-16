import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

import { CartDrawer } from "./CartDrawer";

export function AppShell({
  children,
  hideNewsletter,
  hideFooter,
}: {
  children: ReactNode;
  hideNewsletter?: boolean;
  hideFooter?: boolean;
}) {
  const [cart, setCart] = useState(false);
  useEffect(() => {
    const open = () => setCart(true);
    window.addEventListener("bxlack:open-cart", open);
    return () => window.removeEventListener("bxlack:open-cart", open);
  }, []);
  return (
    <div className="grain relative min-h-screen bg-noir text-white">
      <Header onCart={() => setCart(true)} />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
      <main>{children}</main>
      {hideFooter ? null : <Footer hideNewsletter={hideNewsletter} />}
    </div>
  );
}
