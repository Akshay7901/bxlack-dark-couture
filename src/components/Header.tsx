import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Heart, ShoppingBag } from "lucide-react";
import logo from "@/assets/bxlack-logo.png.asset.json";

export function Header({ onCart }: { onCart: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { to: "/", label: "Home" },
    { to: "/new-drop", label: "New Drop" },
    { to: "/shop", label: "Collection" },
    { to: "/lookbook", label: "Lookbook" },
    { to: "/about", label: "About" },
    { to: "/journal", label: "Journal" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-4" : "py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 md:px-10">
        <Link to="/" className="font-display text-xl font-medium tracking-[-0.03em] text-white" data-cursor="Home">
          BXLACK<span className="text-white/40">®</span>
        </Link>
        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              className="group relative font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-white/80">
          <button aria-label="Search" className="hover:text-white"><Search size={18} /></button>
          <button aria-label="Wishlist" className="hidden hover:text-white sm:block"><Heart size={18} /></button>
          <button aria-label="Cart" onClick={onCart} data-cursor="Open" className="relative hover:text-white">
            <ShoppingBag size={18} />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-medium text-black">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}