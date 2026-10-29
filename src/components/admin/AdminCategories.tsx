import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Reorder } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { fetchProducts } from "@/lib/catalog";
import {
  CategoriesTableMissing,
  SIZE_TYPE_LABELS,
  categoryKeyFrom,
  createCategory,
  deleteCategory,
  fetchCategoriesStrict,
  removeCategoryImage,
  saveCategoryOrder,
  setCategoryImage,
  updateCategory,
  type Category,
  type CategoryInput,
  type SizeType,
} from "@/lib/categories";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { ListRow } from "@/components/admin/ListRow";
import { SortableRow } from "@/components/admin/SortableRow";

const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2.5 font-mono text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";
const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";

export function AdminCategories() {
  const qc = useQueryClient();
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories", "admin"],
    queryFn: fetchCategoriesStrict,
    retry: (count, e) => !(e instanceof CategoriesTableMissing) && count < 2,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts(true),
  });
  const productCount = (key: string) => products.filter((p) => p.category === key).length;

  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm("light");

  // Drag order, saved on drop.
  const [order, setOrder] = useState<string[]>([]);
  const orderRef = useRef(order);
  orderRef.current = order;
  const categoriesKey = categories.map((c) => `${c.key}:${c.sort_order}`).join(",");
  useEffect(() => setOrder(categories.map((c) => c.key)), [categoriesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const byKey = new Map(categories.map((c) => [c.key, c]));

  // Every storefront category query starts with "categories".
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const run = async (key: string, action: () => Promise<void>, success?: string) => {
    setBusy(key);
    try {
      await action();
      if (success) toast.success(success);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
      invalidate();
    }
  };

  const saveOrder = (keys: string[]) => {
    if (keys.every((k, i) => byKey.get(k)?.sort_order === (i + 1) * 10)) return;
    void run("order", () => saveCategoryOrder(keys), "Order saved");
  };

  const moveBy = (key: string, direction: -1 | 1) => {
    const from = order.indexOf(key);
    const to = from + direction;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    saveOrder(next);
  };

  if (error instanceof CategoriesTableMissing) {
    return (
      <div>
        <Heading />
        <div className="mt-6 border border-amber-500/30 bg-amber-50 p-5 font-sans text-[13px] leading-relaxed text-amber-900">
          Categories aren't set up in the database yet. Open the Supabase SQL Editor, run{" "}
          <code className="font-mono">apply-categories.sql</code>, then reload this page. Until then
          the store keeps showing T-Shirt, Shirt and Jeans.
        </div>
      </div>
    );
  }

  return (
    <div>
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading />
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 border border-black bg-black px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white transition-colors hover:bg-transparent hover:text-black"
        >
          <Plus size={13} />
          Add category
        </button>
      </div>

      {editing ? (
        <CategoryForm
          key={editing === "new" ? "new" : editing.key}
          category={editing === "new" ? null : editing}
          existingKeys={categories.map((c) => c.key)}
          onClose={() => setEditing(null)}
          onSave={async (input, newKey) => {
            if (editing === "new") {
              const last = categories.at(-1)?.sort_order ?? 0;
              await createCategory(newKey, input, last + 10);
              toast.success(`${input.label} added`);
            } else {
              await updateCategory(editing.key, input);
              toast.success(`${input.label} saved`);
            }
            invalidate();
            setEditing(null);
          }}
        />
      ) : isLoading ? (
        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
          Loading…
        </p>
      ) : error ? (
        <p className="mt-6 font-sans text-[13px] text-red-600">
          {error instanceof Error ? error.message : "Could not load categories"}
        </p>
      ) : (
        <>
          <p className="mb-3 mt-6 font-sans text-[12px] text-neutral-500">
            Drag the handle to set the order in the navbar, footer and homepage. Click a thumbnail
            to change its homepage image.
          </p>
          <Reorder.Group
            as="div"
            axis="y"
            values={order}
            onReorder={setOrder}
            className="space-y-2"
          >
            {order.map((key, i) => {
              const c = byKey.get(key);
              if (!c) return null;
              const count = productCount(key);
              const busyHere = busy === key;
              return (
                <SortableRow
                  key={key}
                  value={key}
                  label={c.label}
                  onDragEnd={() => saveOrder(orderRef.current)}
                  onMove={(d) => moveBy(key, d)}
                >
                  {(handle) => (
                    <ListRow
                      handle={handle}
                      index={i + 1}
                      thumbnail={
                        <label
                          title="Change homepage image"
                          className={`flex h-full w-full items-center justify-center ${
                            busyHere ? "cursor-wait opacity-50" : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            disabled={busyHere}
                            className="sr-only"
                            aria-label={`Upload ${c.label} image`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file)
                                void run(
                                  key,
                                  () => setCategoryImage(key, file),
                                  `${c.label} image updated`,
                                );
                            }}
                          />
                          {busyHere ? (
                            <Loader2 size={14} className="animate-spin text-neutral-400" />
                          ) : c.imageUrl ? (
                            <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-mono text-[15px] text-neutral-300">+</span>
                          )}
                        </label>
                      }
                      title={c.label}
                      subtitle={`/shop?type=${c.key} · ${SIZE_TYPE_LABELS[c.size_type]}`}
                      meta={
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                            {count} {count === 1 ? "product" : "products"}
                          </span>
                          <button
                            type="button"
                            disabled={busyHere}
                            onClick={() =>
                              void run(
                                key,
                                () => updateCategory(key, { visible: !c.visible }),
                                c.visible
                                  ? `${c.label} hidden from the store`
                                  : `${c.label} is live`,
                              )
                            }
                            title={c.visible ? "Hide from the store" : "Show on the store"}
                            className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-black ${
                              c.visible ? "text-neutral-600" : "text-neutral-400"
                            }`}
                          >
                            {c.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                            {c.visible ? "Live" : "Hidden"}
                          </button>
                          {c.imageUrl ? (
                            <button
                              type="button"
                              disabled={busyHere}
                              onClick={() =>
                                void run(
                                  key,
                                  () => removeCategoryImage(key),
                                  `${c.label} image removed`,
                                )
                              }
                              className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-red-600"
                            >
                              Remove image
                            </button>
                          ) : null}
                        </div>
                      }
                      onEdit={() => setEditing(c)}
                      onDelete={() =>
                        count > 0
                          ? toast.error(
                              `${c.label} still has ${count} ${count === 1 ? "product" : "products"}. Move or delete them first, or hide the category instead.`,
                            )
                          : confirm({
                              title: "Delete category",
                              message: `"${c.label}" will be removed from the store. This cannot be undone.`,
                              confirmLabel: "Delete",
                              destructive: true,
                              onConfirm: () =>
                                void run(key, () => deleteCategory(key), `${c.label} deleted`),
                            })
                      }
                      deleteLabel={`Delete ${c.label}`}
                    />
                  )}
                </SortableRow>
              );
            })}
          </Reorder.Group>
        </>
      )}
    </div>
  );
}

function Heading() {
  return (
    <div>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Categories</h2>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        Navbar, collection page, footer and homepage tiles
      </p>
    </div>
  );
}

function CategoryForm({
  category,
  existingKeys,
  onClose,
  onSave,
}: {
  category: Category | null;
  existingKeys: string[];
  onClose: () => void;
  onSave: (input: CategoryInput, newKey: string) => Promise<void>;
}) {
  const [form, setForm] = useState<CategoryInput>({
    label: category?.label ?? "",
    page_title: category?.page_title ?? null,
    size_type: category?.size_type ?? "top",
    visible: category?.visible ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const newKey = category ? category.key : categoryKeyFrom(form.label);
  const keyTaken = !category && existingKeys.some((k) => k.toLowerCase() === newKey.toLowerCase());
  const canSave = form.label.trim().length > 0 && newKey.length > 0 && !keyTaken && !saving;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSave) return;
        setSaving(true);
        try {
          await onSave(
            {
              ...form,
              label: form.label.trim(),
              page_title: form.page_title?.trim() || null,
            },
            newKey,
          );
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not save");
          setSaving(false);
        }
      }}
      className="mt-6 grid gap-5 border border-black/10 bg-white p-6 md:grid-cols-2"
    >
      <h3 className="font-display text-lg uppercase md:col-span-2">
        {category ? `Edit ${category.label}` : "New category"}
      </h3>

      <label className="block">
        <span className={labelClass}>Name</span>
        <input
          autoFocus
          required
          className={inputClass}
          value={form.label}
          placeholder="e.g. Sweatshirt"
          onChange={(e) => set("label", e.target.value)}
        />
        <span
          className={`mt-1.5 block font-mono text-[11px] ${keyTaken ? "text-red-600" : "text-neutral-400"}`}
        >
          {keyTaken
            ? "A category with this name already exists"
            : newKey
              ? `Link: /shop?type=${newKey}${category ? " (fixed)" : ""}`
              : "Shown in the navbar, footer and homepage"}
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>Collection page title (optional)</span>
        <input
          className={inputClass}
          value={form.page_title ?? ""}
          placeholder={form.label.trim() || "e.g. Sweatshirts"}
          onChange={(e) => set("page_title", e.target.value)}
        />
        <span className="mt-1.5 block font-mono text-[11px] text-neutral-400">
          Heading on the collection page. Leave empty to use the name.
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>Sizes</span>
        <select
          className={`${inputClass} [&>option]:bg-white`}
          value={form.size_type}
          onChange={(e) => set("size_type", e.target.value as SizeType)}
        >
          {(Object.keys(SIZE_TYPE_LABELS) as SizeType[]).map((t) => (
            <option key={t} value={t}>
              {SIZE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block font-mono text-[11px] text-neutral-400">
          {form.size_type === "one_size"
            ? "One option, no size chart (caps, bags, accessories)"
            : form.size_type === "denim"
              ? "Size chart shows waist, rise and inseam"
              : "Size chart shows chest, length, shoulder and sleeve"}
        </span>
      </label>

      <label className="flex items-center gap-3 self-start pt-7">
        <input
          type="checkbox"
          checked={form.visible}
          onChange={(e) => set("visible", e.target.checked)}
          className="h-4 w-4 accent-black"
        />
        <span className="font-sans text-[13px] text-neutral-700">Show on the store</span>
      </label>

      <div className="flex items-center gap-4 md:col-span-2">
        <button
          type="submit"
          disabled={!canSave}
          className="flex items-center gap-2 border border-black bg-black px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          {category ? "Save changes" : "Add category"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 hover:text-black"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
