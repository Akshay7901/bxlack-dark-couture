import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Heart, ShoppingBag, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/bxlack-logo.webp";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useCategories } from "@/lib/categories";
import { DURATION, EASE_IN, STAGGER, enter } from "@/lib/motion";

export function Header({ onCart }: { onCart: () => void }) {
  const { categories } = useCategories();
  const collectionTypes = [
    { key: "All", label: "All" },
    ...categories.map((c) => ({ key: c.key, label: c.label })),
  ];
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { ids: wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.length;
  const { count: cartCount } = useCart();

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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 [view-transition-name:site-header] ${
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { ...enter, duration: 0.3 } }}
                  exit={{ opacity: 0, y: 6, transition: { duration: DURATION.fast * 0.75, ease: EASE_IN } }}
                  className="absolute left-0 top-[calc(100%+1rem)] z-50 min-w-[140px] border border-light-grey/20 bg-noir/95 p-2 backdrop-blur-md sm:min-w-[160px]"
                >
                  {collectionTypes.map((t, i) => (
                    <motion.div
                      key={t.key}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...enter, duration: 0.4, delay: 0.05 + i * STAGGER }}
                    >
                      <Link
                        to="/shop"
                        search={{ type: t.key }}
                        onClick={() => setDropdownOpen(false)}
                        className="group/item flex items-center gap-2 px-4 py-2.5 font-sans text-[12px] uppercase tracking-[0.15em] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/item:translate-x-1">
                          {t.label}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Center: Logo */}
        <Link
          to="/"
          onClick={(e) => {
            // Already home: glide back to the top instead of a no-op click.
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex shrink-0 justify-center transition-opacity duration-300 hover:opacity-80"
          data-cursor="Home"
        >
          <img
            src={logo}
            alt="BXLACK"
            className="h-6 w-auto sm:h-8 md:h-11"
            width={480}
            height={266}
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
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-medium text-black">
                {cartCount}
              </span>
            ) : null}
          </button>
          <Link to="/account" aria-label="Account" className="hover:text-white">
            <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}