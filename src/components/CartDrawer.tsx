import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, count, setQty, remove } = useCart();
  const { data } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts() });
  const all = (data ?? []).map(toCardProduct);

  const items = lines
    .map((l) => {
      const product = all.find((p) => p.id === l.id);
      return product ? { ...l, product } : null;
    })
    .filter(Boolean) as Array<(typeof lines)[number] & { product: ReturnType<typeof toCardProduct> }>;

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[oklch(0.07_0_0)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
                Your Bag — {String(count).padStart(2, "0")}
              </p>
              <button onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="font-editorial text-3xl italic text-white/80">The bag is empty.</p>
                <p className="mt-3 max-w-xs text-sm text-white/50">
                  Curated pieces you add will appear here — waiting for their moment.
                </p>
                <Link
                  to="/shop"
                  search={{ type: "All" }}
                  onClick={onClose}
                  className="mt-8 border border-white/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black"
                >
                  Discover the Drop
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                  <ul className="space-y-6">
                    {items.map((item) => (
                      <li key={`${item.id}-${item.size}`} className="flex gap-4">
                        <Link
                          to="/product/$id"
                          params={{ id: item.id }}
                          onClick={onClose}
                          className="h-28 w-20 shrink-0 overflow-hidden bg-[#0A0A0A]"
                        >
                          <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <p className="truncate font-sans text-[13px] text-white/90">{item.product.name}</p>
                              <button
                                aria-label="Remove"
                                onClick={() => remove(item.id, item.size)}
                                className="text-white/40 hover:text-white"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
                              Size {item.size}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-white/20">
                              <button
                                aria-label="Decrease quantity"
                                onClick={() => setQty(item.id, item.size, item.qty - 1)}
                                className="px-2 py-1.5 text-white/60 hover:text-white"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="min-w-[26px] text-center font-mono text-[11px] text-white">{item.qty}</span>
                              <button
                                aria-label="Increase quantity"
                                onClick={() => setQty(item.id, item.size, item.qty + 1)}
                                className="px-2 py-1.5 text-white/60 hover:text-white"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-mono text-[12px] text-white">
                              ₹{(item.product.price * item.qty).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-white/10 px-6 py-6 sm:px-8">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Subtotal</span>
                    <span className="font-mono text-[14px] text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                    Taxes and shipping calculated at checkout
                  </p>
                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="mt-5 block w-full border border-white bg-white py-[14px] text-center font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white"
                  >
                    View Bag
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
