import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, User } from "lucide-react";
import logo from "@/assets/bxlack-logo.png.asset.json";

export function Header({ onCart }: { onCart: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const leftNav = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Collection" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-4" : "py-6"
      }`}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-6 md:px-10">
        {/* Left: Home + Collection */}
        <nav className="flex items-center gap-8">
          {leftNav.map((n, i) => (
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

        {/* Center: Logo */}
        <Link to="/" className="flex justify-center" data-cursor="Home">
          <img
            src={logo.url}
            alt="BXLACK"
            className="h-6 w-auto md:h-7"
            width={1920}
            height={1065}
          />
        </Link>

        {/* Right: Wishlist, Cart, Profile */}
        <div className="flex items-center justify-end gap-5 text-white/80">
          <button aria-label="Wishlist" className="hover:text-white">
            <Heart size={18} />
          </button>
          <button aria-label="Cart" onClick={onCart} data-cursor="Open" className="relative hover:text-white">
            <ShoppingBag size={18} />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-medium text-black">0</span>
          </button>
          <button aria-label="Profile" className="hover:text-white">
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}