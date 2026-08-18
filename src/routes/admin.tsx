import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Mail,
  Plus,
  Rocket,
  Shirt,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { AdminTeam } from "@/components/admin/AdminTeam";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { ListRow } from "@/components/admin/ListRow";
import {
  CATEGORIES,
  createProduct,
  deleteProduct,
  fetchCategoryImages,
  fetchProducts,
  removeCategoryImage,
  setCategoryImage,
  slugify,
  updateProduct,
  uploadProductImage,
  type CatalogProductWithUrls,
  type CategoryImage,
  type ProductInput,
} from "@/lib/catalog";
import {
  fetchSiteSettings,
  fetchWaitlist,
  removeWaitlistEntry,
  updateLaunchPassword,
  updateSiteSettings,
  type SiteSettings,
} from "@/lib/launch";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Studio — BXLACK Admin" },
      {
        name: "description",
        content: "Manage the BXLACK product catalogue: add pieces, edit prices and upload imagery.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Studio — BXLACK Admin" },
      { property: "og:description", content: "Manage the BXLACK product catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: AdminPage,
});

const emptyForm: ProductInput = {
  slug: "",
  name: "",
  category: "Tshirt",
  price: 4999,
  compare_at: null,
  badge: null,
  tag: null,
  description: null,
  card_image_path: null,
  image_path: null,
  back_image_path: null,
  gallery_paths: [],
  sort_order: 0,
  published: true,
};

const inputClass =
  "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-[12px] text-white outline-none transition-colors focus:border-white/60";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || (user && isAdmin === null)) {
    return (
      <Shell>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          Loading studio…
        </p>
      </Shell>
    );
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <Shell>
        <h1 className="font-display text-3xl uppercase tracking-[-0.02em]">Not authorised</h1>
        <p className="mt-3 max-w-md font-mono text-[11px] leading-relaxed text-white/50">
          This account ({user.email}) does not have studio access. Only an existing admin can create
          admin accounts.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="mt-6 border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 hover:border-white hover:text-white"
        >
          Sign out
        </button>
      </Shell>
    );
  }

  return <AdminDashboard email={user.email ?? ""} userId={user.id} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain min-h-screen bg-noir px-5 py-24 text-white sm:px-8 md:px-12">
      <div className="mx-auto max-w-[1100px]">{children}</div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em]">{title}</h2>
      {description ? (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          {description}
        </p>
      ) : null}
    </div>
  );
}

const NAV_GROUPS = [
  {
    label: "Catalog",
    items: [
      { key: "products", label: "Products", icon: Shirt },
      { key: "categories", label: "Category images", icon: ImageIcon },
    ],
  },
  {
    label: "Settings",
    items: [
      { key: "launch", label: "Launch", icon: Rocket },
      { key: "team", label: "Team", icon: Users },
    ],
  },
] as const;
type NavKey = (typeof NAV_GROUPS)[number]["items"][number]["key"];

function AdminDashboard({ email, userId }: { email: string; userId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [active, setActive] = useState<NavKey>("products");

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
            BXLACK · Studio
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
            {email}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60 hover:text-white"
          >
            View shop
          </Link>
          <button
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[190px_1fr] md:gap-12">
        <nav className="flex gap-5 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="shrink-0 md:shrink">
              <p className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-white/25 md:mb-1.5 md:block md:px-3">
                {group.label}
              </p>
              <div className="flex gap-2 md:flex-col md:gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActive(item.key)}
                      className={`flex shrink-0 items-center gap-2.5 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:bg-white/5 hover:text-white/70"
                      }`}
                    >
                      <Icon size={13} className={isActive ? "text-white" : "text-white/35"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          {active === "products" ? <ProductsSection /> : null}
          {active === "categories" ? <CategoriesSection /> : null}
          {active === "launch" ? <LaunchSection /> : null}
          {active === "team" ? <AdminTeam currentUserId={userId} /> : null}
        </div>
      </div>
    </Shell>
  );
}

function ProductsSection() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts(true),
  });

  const [editing, setEditing] = useState<CatalogProductWithUrls | null>(null);
  const [creating, setCreating] = useState(false);
  const { confirm, dialog } = useConfirm();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Products" />
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="flex items-center gap-2 border border-white bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white"
        >
          <Plus size={13} />
          Add product
        </button>
      </div>

      {creating || editing ? (
        <ProductForm
          key={editing?.id ?? "new"}
          product={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            invalidate();
          }}
        />
      ) : (
        <div className="mt-6 space-y-2">
          {isLoading ? (
            <p className="py-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              Loading…
            </p>
          ) : products.length === 0 ? (
            <p className="py-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              No products yet
            </p>
          ) : (
            products.map((p, i) => (
              <ListRow
                key={p.id}
                index={i + 1}
                thumbnail={
                  (p.cardImageUrl ?? p.imageUrl) ? (
                    <img
                      src={p.cardImageUrl ?? p.imageUrl ?? ""}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null
                }
                title={p.name}
                subtitle={p.category}
                meta={
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] text-white/70">₹{p.price}</span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.2em] ${
                        p.published ? "text-white/50" : "text-white/25"
                      }`}
                    >
                      {p.published ? "Live" : "Hidden"}
                    </span>
                  </div>
                }
                onEdit={() => {
                  setCreating(false);
                  setEditing(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={() =>
                  confirm({
                    title: "Delete product",
                    message: `"${p.name}" will be permanently removed. This cannot be undone.`,
                    confirmLabel: "Delete",
                    destructive: true,
                    onConfirm: () => removeMutation.mutate(p.id),
                  })
                }
                deleteLabel={`Delete ${p.name}`}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoriesSection() {
  const qc = useQueryClient();
  const { data: images = [], isLoading } = useQuery({
    queryKey: ["category-images"],
    queryFn: () => fetchCategoryImages(),
  });
  const [busy, setBusy] = useState<string | null>(null);

  const byCategory = new Map(images.map((i) => [i.category, i]));

  const upload = async (category: string, file: File) => {
    setBusy(category);
    try {
      await setCategoryImage(category, file);
      qc.invalidateQueries({ queryKey: ["category-images"] });
      toast.success(`${category} image updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (category: string) => {
    setBusy(category);
    try {
      await removeCategoryImage(category);
      qc.invalidateQueries({ queryKey: ["category-images"] });
      toast.success(`${category} image removed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SectionHeading
        title="Category images"
        description="Shown in Shop by Category on the homepage"
      />

      {isLoading ? (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          Loading…
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {CATEGORIES.map((category) => {
            const img: CategoryImage | undefined = byCategory.get(category);
            const busyHere = busy === category;
            return (
              <div
                key={category}
                className="flex items-center gap-4 border border-white/10 bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <label
                  className={`h-12 w-12 shrink-0 overflow-hidden border border-white/10 bg-white/5 ${
                    busyHere ? "cursor-wait opacity-50" : "cursor-pointer hover:border-white/30"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busyHere}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void upload(category, file);
                    }}
                  />
                  {img?.imageUrl ? (
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center font-mono text-[15px] text-white/25">
                      +
                    </span>
                  )}
                </label>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[13px] text-white/90">{category}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Click thumbnail to change
                  </p>
                </div>
                {img?.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => void remove(category)}
                    disabled={busyHere}
                    aria-label={`Remove ${category} image`}
                    className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/50 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Converts an ISO timestamp to the value a <input type="datetime-local"> expects, in local time. */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function LaunchSection() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
  });
  const { data: waitlist = [], isLoading: waitlistLoading } = useQuery({
    queryKey: ["waitlist"],
    queryFn: fetchWaitlist,
  });

  const [form, setForm] = useState<SiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const active: SiteSettings = form ??
    settings ?? {
      coming_soon_enabled: false,
      launch_at: null,
      headline: "",
      subheading: "",
    };

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm({ ...active, [key]: value });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWaitlistEntry(id),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["waitlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateSiteSettings(active);
      toast.success(active.coming_soon_enabled ? "Coming soon mode is live" : "Settings saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) return toast.error("Password must be at least 4 characters");
    setSavingPassword(true);
    try {
      await updateLaunchPassword(password);
      toast.success("Access code updated");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update access code");
    } finally {
      setSavingPassword(false);
    }
  };

  const copyEmails = async () => {
    await navigator.clipboard.writeText(waitlist.map((w) => w.email).join("\n"));
    toast.success("Emails copied");
  };

  if (isLoading) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
    );
  }

  return (
    <div>
      {dialog}
      <SectionHeading
        title="Launch"
        description="Gate the whole storefront behind a coming-soon page until you're ready to drop"
      />

      <form
        onSubmit={saveSettings}
        className="mt-6 max-w-xl space-y-5 border border-white/12 p-5 sm:p-7"
      >
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={active.coming_soon_enabled}
            onChange={(e) => set("coming_soon_enabled", e.target.checked)}
            className="h-4 w-4 accent-white"
          />
          <span className={labelClass}>Lock the site behind the coming-soon page</span>
        </label>
        {active.coming_soon_enabled ? (
          <p className="border-l border-white/20 pl-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-white/45">
            Live visitors will see the gate. Admins and anyone with the access code still get
            through.
          </p>
        ) : null}

        <label className="block">
          <span className={labelClass}>Headline</span>
          <input
            className={inputClass}
            value={active.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Subheading</span>
          <input
            className={inputClass}
            value={active.subheading}
            onChange={(e) => set("subheading", e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Launch date &amp; time (optional — shows a countdown)</span>
          <input
            type="datetime-local"
            className={`${inputClass} [color-scheme:dark]`}
            value={toDatetimeLocal(active.launch_at)}
            onChange={(e) =>
              set("launch_at", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </label>

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={savingSettings}
            className="border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
          >
            {savingSettings ? "Saving…" : "Save"}
          </button>
          {form ? (
            <button
              type="button"
              onClick={() => setForm(null)}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
            >
              Discard changes
            </button>
          ) : null}
        </div>
      </form>

      <form onSubmit={savePassword} className="mt-8 max-w-xl border border-white/12 p-5 sm:p-7">
        <span className={labelClass}>Access code</span>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
          Anyone with this code can browse the full site early — share it with press, friends or
          your team
        </p>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="text"
            placeholder="New access code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} mt-0 max-w-[220px]`}
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 transition-colors hover:border-white hover:text-white disabled:opacity-50"
          >
            {savingPassword ? "Saving…" : "Update code"}
          </button>
        </div>
      </form>

      <div className="mt-10 border-t border-white/10 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading title={`Waitlist — ${waitlist.length}`} />
          {waitlist.length > 0 ? (
            <button
              onClick={copyEmails}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60 hover:text-white"
            >
              Copy all emails
            </button>
          ) : null}
        </div>

        <div className="mt-6 space-y-2">
          {waitlistLoading ? (
            <p className="py-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              Loading…
            </p>
          ) : waitlist.length === 0 ? (
            <p className="py-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              No signups yet
            </p>
          ) : (
            waitlist.map((w) => (
              <ListRow
                key={w.id}
                thumbnail={
                  <div className="flex h-full w-full items-center justify-center text-white/25">
                    <Mail size={16} />
                  </div>
                }
                title={w.name || w.email}
                subtitle={w.email}
                meta={
                  <div className="text-right">
                    {w.instagram ? (
                      <p className="font-mono text-[10px] text-white/50">@{w.instagram.replace(/^@/, "")}</p>
                    ) : null}
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                      {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                }
                onDelete={() =>
                  confirm({
                    title: "Remove signup",
                    message: `Remove ${w.email} from the waitlist?`,
                    confirmLabel: "Remove",
                    destructive: true,
                    onConfirm: () => removeMutation.mutate(w.id),
                  })
                }
                deleteLabel={`Remove ${w.email}`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: CatalogProductWithUrls | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial: ProductInput = useMemo(
    () =>
      product
        ? {
            slug: product.slug,
            name: product.name,
            category: product.category,
            price: product.price,
            compare_at: product.compare_at,
            badge: product.badge,
            tag: product.tag,
            description: product.description,
            card_image_path: product.card_image_path,
            image_path: product.image_path,
            back_image_path: product.back_image_path,
            gallery_paths: product.gallery_paths ?? [],
            sort_order: product.sort_order,
            published: product.published,
          }
        : emptyForm,
    [product],
  );

  const [form, setForm] = useState<ProductInput>(initial);
  const [cardPreview, setCardPreview] = useState<string | null>(product?.cardImageUrl ?? null);
  const [frontPreview, setFrontPreview] = useState<string | null>(product?.imageUrl ?? null);
  const [backPreview, setBackPreview] = useState<string | null>(product?.backImageUrl ?? null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(product?.galleryUrls ?? []);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (file: File, side: "card" | "front" | "back") => {
    setBusy(true);
    try {
      const path = await uploadProductImage(file);
      if (side === "card") {
        set("card_image_path", path);
        setCardPreview(URL.createObjectURL(file));
      } else if (side === "front") {
        set("image_path", path);
        setFrontPreview(URL.createObjectURL(file));
      } else {
        set("back_image_path", path);
        setBackPreview(URL.createObjectURL(file));
      }
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGalleryUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadProductImage(f)));
      setForm((f) => ({ ...f, gallery_paths: [...f.gallery_paths, ...uploaded] }));
      setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const removeGalleryAt = (i: number) => {
    setForm((f) => ({ ...f, gallery_paths: f.gallery_paths.filter((_, idx) => idx !== i) }));
    setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (form.price <= 0) return toast.error("Price must be greater than zero");
    const payload: ProductInput = { ...form, slug: form.slug.trim() || slugify(form.name) };
    setBusy(true);
    try {
      if (product) await updateProduct(product.id, payload);
      else await createProduct(payload);
      toast.success(product ? "Product updated" : "Product added");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-6 border border-white/12 p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg uppercase tracking-[-0.01em]">
          {product ? "Edit product" : "New product"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Slug (URL)</span>
              <input
                className={inputClass}
                value={form.slug}
                placeholder={slugify(form.name) || "auto-generated"}
                onChange={(e) => set("slug", e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Category</span>
              <select
                className={`${inputClass} [&>option]:bg-noir`}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Collection tag</span>
              <input
                className={inputClass}
                value={form.tag ?? ""}
                onChange={(e) => set("tag", e.target.value || null)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Price (₹)</span>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Compare-at price (₹)</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.compare_at ?? ""}
                onChange={(e) => set("compare_at", e.target.value ? Number(e.target.value) : null)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Badge</span>
              <input
                className={inputClass}
                value={form.badge ?? ""}
                onChange={(e) => set("badge", e.target.value || null)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Sort order</span>
              <input
                type="number"
                className={inputClass}
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass}>Description</span>
              <textarea
                rows={3}
                className={inputClass}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value || null)}
              />
            </label>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <span className={labelClass}>Images</span>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              Card = shop grid, cart &amp; wishlist · Front/Back/Gallery = product page only · 1600
              × 2000px
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
                  Card
                </span>
                <ThumbField
                  className="mt-1.5"
                  preview={cardPreview}
                  onFile={(file) => handleUpload(file, "card")}
                  onClear={() => {
                    set("card_image_path", null);
                    setCardPreview(null);
                  }}
                />
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
                  Front
                </span>
                <ThumbField
                  className="mt-1.5"
                  preview={frontPreview}
                  onFile={(file) => handleUpload(file, "front")}
                  onClear={() => {
                    set("image_path", null);
                    setFrontPreview(null);
                  }}
                />
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
                  Back
                </span>
                <ThumbField
                  className="mt-1.5"
                  preview={backPreview}
                  onFile={(file) => handleUpload(file, "back")}
                  onClear={() => {
                    set("back_image_path", null);
                    setBackPreview(null);
                  }}
                />
              </div>
              {galleryPreviews.map((src, i) => (
                <div key={`${src}-${i}`}>
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
                    Gallery
                  </span>
                  <div className="relative mt-1.5 h-24 w-20 overflow-hidden border border-white/12 bg-white/5">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryAt(i)}
                      className="absolute right-0 top-0 bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-white/80 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
                  Gallery
                </span>
                <label className="mt-1.5 flex h-24 w-20 cursor-pointer items-center justify-center border border-white/12 bg-white/5 font-mono text-[16px] text-white/35 hover:text-white/70">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = "";
                      void handleGalleryUpload(files);
                    }}
                  />
                  +
                </label>
              </div>
            </div>
          </div>

          <label className="mt-6 flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="h-4 w-4 accent-white"
            />
            <span className={labelClass}>Visible on the storefront</span>
          </label>

          <div className="mt-7 flex items-center gap-4">
            <button
              type="submit"
              disabled={busy}
              className="border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>

        <ProductPreview form={form} image={cardPreview ?? frontPreview} />
      </div>
    </form>
  );
}

/** Live read-only preview of how these field values will render as a shop-grid card. */
function ProductPreview({ form, image }: { form: ProductInput; image: string | null }) {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <span className={labelClass}>Preview</span>
      <div className="mt-2 border border-white/12 p-4">
        <div className="aspect-[4/5] w-full overflow-hidden bg-[#0A0A0A]">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
              No image yet
            </div>
          )}
        </div>
        <div className="mt-4">
          {form.badge ? (
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
              {form.badge}
            </p>
          ) : null}
          <h4 className="mt-1 font-sans text-sm leading-snug text-white/90">
            {form.name || "Untitled product"}
          </h4>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-[13px] text-white">₹{form.price || 0}</span>
            {form.compare_at ? (
              <span className="font-mono text-[11px] text-white/35 line-through">
                ₹{form.compare_at}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
        How this card looks on the shop grid
      </p>
    </aside>
  );
}

/** Small clickable thumbnail: click to upload, "Remove" link appears once set. */
function ThumbField({
  preview,
  onFile,
  onClear,
  disabled,
  className,
}: {
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        className={`block h-24 w-20 overflow-hidden border border-white/12 bg-white/5 ${
          disabled ? "cursor-wait opacity-50" : "cursor-pointer hover:border-white/30"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center font-mono text-[16px] text-white/25">
            +
          </span>
        )}
      </label>
      {preview ? (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35 hover:text-white"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}
