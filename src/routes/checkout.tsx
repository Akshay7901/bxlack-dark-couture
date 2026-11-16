import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { SilkBackdrop } from "@/components/SilkBackdrop";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart";
import { fetchProducts, toCardProduct } from "@/lib/catalog";
import { fetchAddresses, createAddress, type Address, type AddressInput } from "@/lib/account";
import { AddressForm } from "@/components/account/AddressForm";
import { placeGuestOrder, placeOrder, previewDiscount } from "@/lib/checkout.functions";
import { TURNSTILE_SITE_KEY, Turnstile } from "@/components/Turnstile";
import { seo } from "@/lib/seo";
import { enter, STAGGER } from "@/lib/motion";

/** Where a guest's email and address are remembered on this browser. */
const GUEST_KEY = "bxlack:guest-checkout";

export const Route = createFileRoute("/checkout")({
  head: () =>
    seo({
      title: "Checkout — BXLACK",
      description:
        "Complete your BXLACK order securely.",
      noindex: true,
    }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { lines, clear } = useCart();
  const { data, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: () => fetchAddresses(),
    enabled: !!user,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  // Guest checkout (no account): contact email, address and bot check.
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAddress, setGuestAddress] = useState<AddressInput | null>(null);
  const [editingGuestAddress, setEditingGuestAddress] = useState(true);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  // Shown after a guest places an order (their bag is empty by then).
  const [placed, setPlaced] = useState<{ orderNumber: number; email: string } | null>(null);

  // Prefill a returning guest's details from this browser.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(GUEST_KEY) ?? "null") as {
        email?: string;
        address?: AddressInput;
      } | null;
      if (saved?.email) setGuestEmail(saved.email);
      if (saved?.address) {
        setGuestAddress(saved.address);
        setEditingGuestAddress(false);
      }
    } catch {
      // nothing saved, or storage blocked
    }
  }, []);

  const all = (data ?? []).map(toCardProduct);
  const items = lines
    .map((l) => {
      const product = all.find((p) => p.id === l.id);
      return product ? { ...l, product } : null;
    })
    .filter(Boolean) as Array<
    (typeof lines)[number] & { product: ReturnType<typeof toCardProduct> }
  >;
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const total = Math.max(subtotal - (discount?.amount ?? 0), 0);

  // A code's value depends on the bag, so re-check it after the bag changes.
  useEffect(() => {
    setDiscount(null);
  }, [subtotal]);

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  const selected = addresses.find((a) => a.id === selectedId) ?? defaultAddress;

  if (authLoading) {
    return (
      <AppShell hideNewsletter>
        <div className="flex min-h-screen items-center justify-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (placed) {
    return <GuestOrderPlaced orderNumber={placed.orderNumber} email={placed.email} />;
  }

  if (lines.length === 0) {
    return (
      <AppShell hideNewsletter>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
          <h1 className="font-display text-3xl uppercase tracking-[-0.02em]">Your bag is empty</h1>
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 hover:border-white hover:text-white"
          >
            Browse the collection
          </Link>
        </div>
      </AppShell>
    );
  }

  const saveNewAddress = async (input: AddressInput) => {
    if (!user) return;
    setSavingAddress(true);
    try {
      await createAddress(user.id, input);
      toast.success("Address saved");
      setAddingNew(false);
      qc.invalidateQueries({ queryKey: ["addresses", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const cartLines = items.map((i) => ({ productId: i.id, size: i.size, qty: i.qty }));

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) return;
    setApplying(true);
    try {
      const result = await previewDiscount({ data: { code, lines: cartLines } });
      setDiscount({ code: result.code, amount: result.amount });
      toast.success(`${result.code} applied`);
    } catch (err) {
      setDiscount(null);
      toast.error(err instanceof Error ? err.message : "Could not apply code");
    } finally {
      setApplying(false);
    }
  };

  const guestEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
  const guestReady =
    guestEmailValid && !!guestAddress && !editingGuestAddress && (!TURNSTILE_SITE_KEY || !!captcha);

  const submitGuest = async () => {
    if (!guestEmailValid) return toast.error("Enter your email so we can send your order confirmation");
    if (!guestAddress || editingGuestAddress) return toast.error("Add your shipping address first");
    setPlacing(true);
    try {
      const email = guestEmail.trim().toLowerCase();
      const { orderNumber } = await placeGuestOrder({
        data: {
          email,
          address: {
            ...guestAddress,
            phone: guestAddress.phone?.trim() ?? "",
            line2: guestAddress.line2 || null,
            state: guestAddress.state || null,
          },
          lines: cartLines,
          discountCode: discount?.code ?? null,
          captcha,
        },
      });
      try {
        localStorage.setItem(GUEST_KEY, JSON.stringify({ email, address: guestAddress }));
      } catch {
        // storage blocked: details just won't be prefilled next time
      }
      clear();
      setPlaced({ orderNumber, email });
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      setCaptchaReset((n) => n + 1);
    } finally {
      setPlacing(false);
    }
  };

  const submit = async () => {
    if (!user) return submitGuest();
    if (!selected) return toast.error("Add a shipping address first");
    setPlacing(true);
    try {
      const { orderNumber } = await placeOrder({
        data: {
          address: {
            full_name: selected.full_name,
            phone: selected.phone,
            line1: selected.line1,
            line2: selected.line2,
            city: selected.city,
            state: selected.state,
            postal_code: selected.postal_code,
            country: selected.country,
          },
          lines: cartLines,
          discountCode: discount?.code ?? null,
        },
      });
      clear();
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order #${orderNumber} placed`);
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative mx-auto max-w-[1200px] px-5 pt-24 sm:px-6 md:px-8 md:pt-28">
        <h1 className="font-display text-[28px] uppercase leading-none tracking-[-0.01em] text-white md:text-[38px]">
          Checkout
        </h1>

        <div className="grid gap-12 py-10 lg:grid-cols-[1fr_360px] lg:gap-16">
          {!user ? (
            <GuestDetails
              email={guestEmail}
              onEmail={setGuestEmail}
              emailValid={guestEmailValid}
              address={guestAddress}
              editing={editingGuestAddress}
              onEdit={() => setEditingGuestAddress(true)}
              onSave={(a) => {
                setGuestAddress(a);
                setEditingGuestAddress(false);
              }}
              onCaptcha={setCaptcha}
              captchaReset={captchaReset}
            />
          ) : (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
              Shipping address
            </p>

            {addressesLoading ? (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
                Loading…
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {addresses.map((a) => (
                  <AddressOption
                    key={a.id}
                    address={a}
                    selected={selected?.id === a.id && !addingNew}
                    onSelect={() => {
                      setSelectedId(a.id);
                      setAddingNew(false);
                    }}
                  />
                ))}

                {addingNew ? (
                  <AddressForm
                    address={null}
                    saving={savingAddress}
                    onCancel={() => setAddingNew(false)}
                    onSave={saveNewAddress}
                  />
                ) : (
                  <button
                    onClick={() => setAddingNew(true)}
                    className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 underline underline-offset-4 hover:text-white"
                  >
                    + Add a new address
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          <aside className="h-fit border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm lg:sticky lg:top-28">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
              Order Summary
            </p>
            <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
              {productsLoading
                ? null
                : items.map((item, i) => (
                    <motion.div
                      key={`${item.id}-${item.size}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...enter, delay: i * STAGGER }}
                      className="flex justify-between font-mono text-[12px] text-white/70"
                    >
                      <span>
                        {item.product.name} · {item.size} × {item.qty}
                      </span>
                      <span className="text-white">
                        ₹{(item.product.price * item.qty).toLocaleString("en-IN")}
                      </span>
                    </motion.div>
                  ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCode();
              }}
              className="mt-6 flex gap-2"
            >
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Discount code"
                aria-label="Discount code"
                maxLength={40}
                className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2.5 font-mono text-[12px] uppercase tracking-[0.15em] text-white outline-none placeholder:text-white/30 focus:border-white/60"
              />
              <button
                type="submit"
                disabled={applying || !codeInput.trim() || items.length === 0}
                className="border border-white/25 px-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/70 transition-colors hover:border-white hover:text-white disabled:opacity-40"
              >
                {applying ? "…" : "Apply"}
              </button>
            </form>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between font-mono text-[12px] text-white/60">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount ? (
                <div className="flex justify-between font-mono text-[12px] text-white/60">
                  <span>
                    Discount · {discount.code}{" "}
                    <button
                      type="button"
                      onClick={() => setDiscount(null)}
                      className="ml-1 underline underline-offset-2 hover:text-white"
                    >
                      Remove
                    </button>
                  </span>
                  <span>−₹{discount.amount.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/60">
                Total
              </span>
              <span className="font-mono text-[16px] text-white">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
            <button
              onClick={submit}
              disabled={placing || items.length === 0 || (user ? !selected : !guestReady)}
              className="mt-6 w-full border border-white bg-white py-[14px] font-mono text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {placing ? "Placing order…" : "Place Order"}
            </button>
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
              Cash on delivery · Pay when it arrives
            </p>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function AddressOption({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`block w-full border p-4 text-left transition-colors ${
        selected ? "border-white bg-white/[0.04]" : "border-white/10 hover:border-white/30"
      }`}
    >
      <p className="font-sans text-[13px] text-white/90">{address.full_name}</p>
      <p className="mt-1 max-w-md font-editorial text-[13px] leading-relaxed text-white/60">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}, {address.city}
        {address.state ? `, ${address.state}` : ""} {address.postal_code}, {address.country}
      </p>
      {address.phone ? (
        <p className="mt-1 font-mono text-[11px] text-white/40">{address.phone}</p>
      ) : null}
    </button>
  );
}

const guestLabel = "font-mono text-[10px] uppercase tracking-[0.32em] text-white/45";

/** Contact + shipping details for checking out without an account. */
function GuestDetails({
  email,
  onEmail,
  emailValid,
  address,
  editing,
  onEdit,
  onSave,
  onCaptcha,
  captchaReset,
}: {
  email: string;
  onEmail: (v: string) => void;
  emailValid: boolean;
  address: AddressInput | null;
  editing: boolean;
  onEdit: () => void;
  onSave: (a: AddressInput) => void;
  onCaptcha: (token: string | null) => void;
  captchaReset: number;
}) {
  return (
    <div className="space-y-10">
      <p className="border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-white/50">
        Checking out as a guest · Have an account?{" "}
        <Link to="/account" className="text-white underline underline-offset-4 hover:text-white/70">
          Sign in
        </Link>
      </p>

      <div>
        <p className={guestLabel}>Contact</p>
        <label className="mt-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-base text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/60 sm:text-[12px]"
          />
          <span
            className={`mt-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] ${
              email && !emailValid ? "text-red-300/90" : "text-white/30"
            }`}
          >
            {email && !emailValid ? "Enter a valid email" : "Your order confirmation is sent here"}
          </span>
        </label>
      </div>

      <div>
        <p className={guestLabel}>Shipping address</p>
        <div className="mt-4">
          {address && !editing ? (
            <div className="border border-white bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-sans text-[13px] text-white/90">{address.full_name}</p>
                  <p className="mt-1 max-w-md font-editorial text-[13px] leading-relaxed text-white/60">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                    {address.state ? `, ${address.state}` : ""} {address.postal_code}, {address.country}
                  </p>
                  {address.phone ? <p className="mt-1 font-mono text-[11px] text-white/40">{address.phone}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={onEdit}
                  className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50 underline underline-offset-4 hover:text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <AddressForm
              address={address}
              saving={false}
              requirePhone
              submitLabel="Use this address"
              onCancel={address ? () => onSave(address) : undefined}
              onSave={onSave}
            />
          )}
        </div>
      </div>

      {TURNSTILE_SITE_KEY ? <Turnstile onToken={onCaptcha} resetKey={captchaReset} /> : null}
    </div>
  );
}

/** Thank-you screen after a guest order (the bag is already cleared). */
function GuestOrderPlaced({ orderNumber, email }: { orderNumber: number; email: string }) {
  return (
    <AppShell hideNewsletter>
      <SilkBackdrop />
      <section className="relative mx-auto flex min-h-[80vh] max-w-[640px] flex-col items-center justify-center px-5 pt-24 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/45">Order confirmed</p>
          <h1 className="mt-4 font-display text-[34px] uppercase leading-none tracking-[-0.01em] text-white md:text-[46px]">
            Order #{orderNumber}
          </h1>
          <p className="mx-auto mt-6 max-w-md font-editorial text-[15px] leading-relaxed text-white/60">
            Thank you. A confirmation is on its way to <span className="text-white">{email}</span>. Pay cash on delivery
            when your parcel arrives; we&apos;ll email you when it ships.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/shop"
              search={{ type: "All" }}
              className="border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white"
            >
              Continue shopping
            </Link>
            <Link
              to="/account"
              className="border border-white/25 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/70 transition-colors hover:border-white hover:text-white"
            >
              Create an account
            </Link>
          </div>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Questions about this order? Contact us with your order number.
          </p>
        </motion.div>
      </section>
    </AppShell>
  );
}
