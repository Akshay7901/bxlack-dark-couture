import { Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Heart, ShoppingBag, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/bxlack-logo.png.asset.json";

const collectionTypes = ["All", "Tshirt", "Shirt", "Jeans"] as const;

export function Header({ onCart }: { onCart: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };
  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-4" : "py-6"
      }`}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-6 md:px-10">
        {/* Left: Home + Collection dropdown */}
        <nav className="flex items-center gap-8">
          <Link
            to="/"
            className="group relative font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
          >
            Home
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
          </Link>

          <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <Link
              to="/shop"
              className="group relative flex items-center gap-1.5 font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
            >
              Collection
              <ChevronDown size={12} className="transition-transform duration-300 group-hover:rotate-180" />
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
            </Link>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25, ease: [0.7, 0, 0.2, 1] }}
                  className="absolute left-0 top-[calc(100%+1rem)] min-w-[160px] border border-light-grey/20 bg-noir/95 p-2 backdrop-blur-md"
                >
                  {collectionTypes.map((t) => (
                    <Link
                      key={t}
                      to="/shop"
                      search={{ type: t }}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 font-sans text-[12px] uppercase tracking-[0.15em] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {t}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Center: Logo */}
        <Link to="/" className="flex justify-center" data-cursor="Home">
          <img
            src={logo.url}
            alt="BXLACK"
            className="h-8 w-auto md:h-11"
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