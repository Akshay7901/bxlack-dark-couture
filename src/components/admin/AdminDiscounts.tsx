import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Tag } from "lucide-react";
import { ListRow } from "@/components/admin/ListRow";
import { Badge, type BadgeTone } from "@/components/admin/Badge";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  deleteDiscountCode,
  listDiscountCodes,
  saveDiscountCode,
  type DiscountCode,
} from "@/lib/discounts.functions";

const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2.5 font-mono text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";

type FormState = {
  id: string | null;
  code: string;
  type: "percent" | "fixed";
  value: string;
  minOrder: string;
  maxUses: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const emptyForm: FormState = {
  id: null,
  code: "",
  type: "percent",
  value: "",
  minOrder: "",
  maxUses: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

/** ISO timestamp → value for <input type="datetime-local">, in local time. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

function describe(d: DiscountCode) {
  const amount = d.type === "percent" ? `${d.value}% off` : `₹${d.value.toLocaleString("en-IN")} off`;
  const min = d.minOrder > 0 ? ` over ₹${d.minOrder.toLocaleString("en-IN")}` : "";
  const uses = d.maxUses ? `${d.usedCount}/${d.maxUses} used` : `${d.usedCount} used`;
  return `${amount}${min} · ${uses}`;
}

function state(d: DiscountCode): { label: string; tone: BadgeTone } {
  const now = Date.now();
  if (!d.active) return { label: "Off", tone: "neutral" };
  if (d.endsAt && new Date(d.endsAt).getTime() < now) return { label: "Expired", tone: "critical" };
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return { label: "Scheduled", tone: "info" };
  if (d.maxUses && d.usedCount >= d.maxUses) return { label: "Used up", tone: "warning" };
  return { label: "Active", tone: "success" };
}

export function AdminDiscounts() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm("light");
  const [form, setForm] = useState<FormState | null>(null);
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: () => listDiscountCodes(),
  });

  const save = useMutation({
    mutationFn: (f: FormState) =>
      saveDiscountCode({
        data: {
          id: f.id,
          code: f.code.trim(),
          type: f.type,
          value: Number(f.value),
          minOrder: f.minOrder ? Number(f.minOrder) : 0,
          maxUses: f.maxUses ? Number(f.maxUses) : null,
          startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
          endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
          active: f.active,
        },
      }),
    onSuccess: () => {
      toast.success("Discount saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDiscountCode({ data: { id } }),
    onSuccess: () => {
      toast.success("Discount deleted");
      qc.invalidateQueries({ queryKey: ["admin-discounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <section>
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">
            Discounts — {codes.length}
          </h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Codes customers enter at checkout
          </p>
        </div>
        <button
          onClick={() => setForm(form ? null : emptyForm)}
          className="flex items-center gap-2 border border-black/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-700 transition-colors hover:border-black hover:text-black"
        >
          {form ? null : <Plus size={13} />}
          {form ? "Cancel" : "Create discount"}
        </button>
      </div>

      {form ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.code.trim() || !Number(form.value)) return toast.error("Add a code and a value");
            save.mutate(form);
          }}
          className="mt-6 grid gap-5 border border-black/12 p-5 sm:p-6 md:grid-cols-2"
        >
          <label className="block">
            <span className={labelClass}>Code</span>
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
              placeholder="WELCOME10"
              maxLength={40}
              required
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <label className="block">
              <span className={labelClass}>Type</span>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as FormState["type"])}
                className={`${inputClass} [&>option]:bg-white`}
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount (₹) off</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>{form.type === "percent" ? "%" : "₹"}</span>
              <input
                type="number"
                min={1}
                max={form.type === "percent" ? 100 : undefined}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                required
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Minimum order (₹, optional)</span>
            <input
              type="number"
              min={0}
              value={form.minOrder}
              onChange={(e) => set("minOrder", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Usage limit (optional)</span>
            <input
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
              placeholder="Unlimited"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Starts (optional)</span>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Ends (optional)</span>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-3 font-mono text-[12px] text-neutral-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Active
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="border border-black bg-black px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : form.id ? "Save changes" : "Create discount"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-8 space-y-2">
        {isLoading ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">Loading…</p>
        ) : codes.length === 0 ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            No discount codes yet
          </p>
        ) : (
          codes.map((d) => {
            const s = state(d);
            return (
              <ListRow
                key={d.id}
                thumbnail={
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <Tag size={16} />
                  </div>
                }
                title={d.code}
                subtitle={describe(d)}
                meta={<Badge tone={s.tone}>{s.label}</Badge>}
                onEdit={() =>
                  setForm({
                    id: d.id,
                    code: d.code,
                    type: d.type,
                    value: String(d.value),
                    minOrder: d.minOrder ? String(d.minOrder) : "",
                    maxUses: d.maxUses ? String(d.maxUses) : "",
                    startsAt: toLocalInput(d.startsAt),
                    endsAt: toLocalInput(d.endsAt),
                    active: d.active,
                  })
                }
                onDelete={() =>
                  confirm({
                    title: "Delete discount",
                    message: `Delete ${d.code}? Customers won't be able to use it any more.`,
                    confirmLabel: "Delete",
                    destructive: true,
                    onConfirm: () => remove.mutate(d.id),
                  })
                }
                deleteLabel={`Delete ${d.code}`}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
