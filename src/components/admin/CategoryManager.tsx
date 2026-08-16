import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchProducts,
  slugify,
  updateCategory,
  uploadCategoryImage,
  type CatalogCategoryWithUrl,
  type CategoryInput,
} from "@/lib/catalog";
import wreckTee from "@/assets/wreck-tee-back.png.asset.json";

const emptyForm: CategoryInput = {
  name: "",
  slug: "",
  image_path: null,
  sort_order: 0,
};

const inputClass =
  "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-[12px] text-white outline-none transition-colors focus:border-white/60";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

export function CategoryManager() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchCategories(),
  });

  const [editing, setEditing] = useState<CatalogCategoryWithUrl | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-16 border-t border-white/10 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-[-0.01em]">Categories</h2>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
            Upload an image for each category shown on the homepage and shop filters.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="border border-white bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white"
        >
          Add category
        </button>
      </div>

      {creating || editing ? (
        <CategoryForm
          key={editing?.id ?? "new"}
          category={editing}
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

      <div className="mt-8 overflow-x-auto border-t border-white/10">
        {isLoading ? (
          <p className="py-8 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="py-8 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">No categories yet.</p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">
                <th className="py-3 pr-4">Image</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Slug</th>
                <th className="py-3 pr-4">Order</th>
                <th className="py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.07]">
                  <td className="py-3 pr-4">
                    <div className="h-14 w-11 overflow-hidden bg-white/5">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-sans text-[13px] text-white/90">{c.name}</td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-white/55">{c.slug}</td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-white/55">{c.sort_order}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => {
                        setCreating(false);
                        setEditing(c);
                      }}
                      className="mr-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/70 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${c.name}"? Products in this category will remain but lose their category image.`))
                          removeMutation.mutate(c.id);
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
    </section>
  );
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: CatalogCategoryWithUrl | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial: CategoryInput = useMemo(
    () =>
      category
        ? {
            name: category.name,
            slug: category.slug,
            image_path: category.image_path,
            sort_order: category.sort_order,
          }
        : emptyForm,
    [category],
  );

  const [form, setForm] = useState<CategoryInput>(initial);
  const [preview, setPreview] = useState<string | null>(category?.imageUrl ?? null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const path = await uploadCategoryImage(file);
      set("image_path", path);
      setPreview(URL.createObjectURL(file));
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
    const payload: CategoryInput = { ...form, slug: form.slug.trim() || slugify(form.name) };
    setBusy(true);
    try {
      if (category) await updateCategory(category.id, payload);
      else await createCategory(payload);
      toast.success(category ? "Category updated" : "Category added");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save category");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-6 border border-white/12 p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg uppercase tracking-[-0.01em]">
          {category ? "Edit category" : "New category"}
        </h3>
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
          <span className={labelClass}>Slug (URL key)</span>
          <input
            className={inputClass}
            value={form.slug}
            placeholder={slugify(form.name) || "auto-generated"}
            onChange={(e) => set("slug", e.target.value)}
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

        <div>
          <span className={labelClass}>Category image</span>
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
                  if (file) handleUpload(file);
                }}
                className="block w-full font-mono text-[10px] text-white/50 file:mr-3 file:border file:border-white/20 file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.24em] file:text-white/80"
              />
              {preview ? (
                <button
                  type="button"
                  onClick={() => {
                    set("image_path", null);
                    setPreview(null);
                  }}
                  className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 hover:text-white"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Shown on the homepage category tiles · 800 × 1000px recommended
          </p>
        </div>
      </div>

      <div className="mt-7 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : category ? "Save changes" : "Create category"}
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
