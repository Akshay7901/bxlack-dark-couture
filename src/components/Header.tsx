import { Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Heart, ShoppingBag, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/bxlack-logo.png.asset.json";
import { useWishlist } from "@/lib/wishlist";

const collectionTypes = ["All", "Tshirt", "Shirt", "Jeans"] as const;

export function Header({ onCart }: { onCart: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { ids: wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.length;

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
        scrolled ? "glass py-3 md:py-4" : "py-4 md:py-6"
      }`}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-6 md:px-10">
        {/* Left: Home + Collection dropdown */}
        <nav className="flex min-w-0 items-center gap-3 sm:gap-5 md:gap-8">
          <Link
            to="/"
            className="group relative whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white sm:text-[11px] sm:tracking-[0.2em] md:text-[13px]"
          >
            Home
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
          </Link>

          <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="group relative flex items-center gap-1 whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white sm:gap-1.5 sm:text-[11px] sm:tracking-[0.2em] md:text-[13px]"
            >
              Collection
              <ChevronDown size={11} className="shrink-0 transition-transform duration-300 group-hover:rotate-180" />
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25, ease: [0.7, 0, 0.2, 1] }}
                  className="absolute left-0 top-[calc(100%+1rem)] z-50 min-w-[140px] border border-light-grey/20 bg-noir/95 p-2 backdrop-blur-md sm:min-w-[160px]"
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
        <Link to="/" className="flex shrink-0 justify-center" data-cursor="Home">
          <img
            src={logo.url}
            alt="BXLACK"
            className="h-6 w-auto sm:h-8 md:h-11"
            width={1920}
            height={1065}
          />
        </Link>

        {/* Right: Wishlist, Cart, Profile */}
        <div className="flex items-center justify-end gap-3.5 text-white/80 sm:gap-5">
          <Link to="/wishlist" aria-label="Wishlist" data-cursor="Open" className="relative hover:text-white">
            <Heart className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            {wishlistCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-medium text-black">
                {wishlistCount}
              </span>
            ) : null}
          </Link>
          <button aria-label="Cart" onClick={onCart} data-cursor="Open" className="relative hover:text-white">
            <ShoppingBag className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-medium text-black">0</span>
          </button>
          <Link to="/admin" aria-label="Account" className="hover:text-white">
            <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}