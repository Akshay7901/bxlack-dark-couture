import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { AdminTeam } from "@/components/admin/AdminTeam";
import {
  CATEGORIES,
  createProduct,
  deleteProduct,
  fetchProducts,
  slugify,
  updateProduct,
  uploadProductImage,
  type CatalogProductWithUrls,
  type ProductInput,
} from "@/lib/catalog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Studio — BXLACK Admin" },
      { name: "description", content: "Manage the BXLACK product catalogue: add pieces, edit prices and upload imagery." },
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
  image_path: null,
  back_image_path: null,
  sort_order: 0,
  published: true,
};

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || (user && isAdmin === null)) {
    return <Shell><p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading studio…</p></Shell>;
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <Shell>
        <h1 className="font-display text-3xl uppercase tracking-[-0.02em]">Not authorised</h1>
        <p className="mt-3 max-w-md font-mono text-[11px] leading-relaxed text-white/50">
          This account ({user.email}) does not have studio access. Only an existing admin can create admin accounts.
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
      <div className="mx-auto max-w-[1400px]">{children}</div>
    </div>
  );
}

function AdminDashboard({ email, userId }: { email: string; userId: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts(true),
  });

  const [editing, setEditing] = useState<CatalogProductWithUrls | null>(null);
  const [creating, setCreating] = useState(false);

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
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">BXLACK · Studio</p>
          <h1 className="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.02em] sm:text-4xl">Products</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="border border-white/20 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 hover:border-white hover:text-white"
          >
            View shop
          </Link>
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="border border-white bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white"
          >
            Add product
          </button>
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
      ) : null}

      <div className="mt-10 overflow-x-auto border-t border-white/10">
        {isLoading ? (
          <p className="py-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">
                <th className="py-3 pr-4">Image</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.07]">
                  <td className="py-3 pr-4">
                    <div className="h-14 w-11 overflow-hidden bg-white/5">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" /> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-sans text-[13px] text-white/90">{p.name}</td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-white/55">{p.category}</td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-white/80">₹{p.price}</td>
                  <td className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                    {p.published ? "Live" : "Hidden"}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => {
                        setCreating(false);
                        setEditing(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="mr-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/70 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) removeMutation.mutate(p.id);
                      }}
                      className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 hover:text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminTeam currentUserId={userId} />
    </Shell>
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
            image_path: product.image_path,
            back_image_path: product.back_image_path,
            sort_order: product.sort_order,
            published: product.published,
          }
        : emptyForm,
    [product],
  );

  const [form, setForm] = useState<ProductInput>(initial);
  const [frontPreview, setFrontPreview] = useState<string | null>(product?.imageUrl ?? null);
  const [backPreview, setBackPreview] = useState<string | null>(product?.backImageUrl ?? null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (file: File, side: "front" | "back") => {
    setBusy(true);
    try {
      const path = await uploadProductImage(file);
      if (side === "front") {
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

  const inputClass =
    "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-[12px] text-white outline-none transition-colors focus:border-white/60";
  const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

  return (
    <form onSubmit={save} className="mt-10 border border-white/12 p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase tracking-[-0.01em]">
          {product ? "Edit product" : "New product"}
        </h2>
        <button type="button" onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white">
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name</span>
          <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} required />
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
          <input className={inputClass} value={form.tag ?? ""} onChange={(e) => set("tag", e.target.value || null)} />
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
          <input className={inputClass} value={form.badge ?? ""} onChange={(e) => set("badge", e.target.value || null)} />
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

        <ImageField
          label="Front image"
          preview={frontPreview}
          onFile={(file) => handleUpload(file, "front")}
          onClear={() => {
            set("image_path", null);
            setFrontPreview(null);
          }}
        />
        <ImageField
          label="Back image (hover)"
          preview={backPreview}
          onFile={(file) => handleUpload(file, "back")}
          onClear={() => {
            set("back_image_path", null);
            setBackPreview(null);
          }}
        />
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
    </form>
  );
}

function ImageField({
  label,
  preview,
  onFile,
  onClear,
}: {
  label: string;
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-24 w-20 shrink-0 overflow-hidden border border-white/12 bg-white/5">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
            className="block w-full font-mono text-[10px] text-white/50 file:mr-3 file:border file:border-white/20 file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.24em] file:text-white/80"
          />
          {preview ? (
            <button type="button" onClick={onClear} className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 hover:text-white">
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}