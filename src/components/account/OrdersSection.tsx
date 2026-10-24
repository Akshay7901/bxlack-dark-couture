import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, type Order } from "@/lib/account";
import { cancelMyOrder, createReturnRequest } from "@/lib/returns.functions";
import {
  PACKING_TUBE_CHARGE,
  RETURN_REASONS,
  RETURN_STATUS_LABELS,
  RETURN_WINDOW_DAYS,
  isCancellable,
  returnEligibility,
  type ReturnType,
} from "@/lib/returns";
import { useConfirm } from "@/components/admin/ConfirmDialog";

// Union of every size offered across styles (generic chart is S–XXL, some tees start at XS).
const EXCHANGE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const actionClass =
  "font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 underline underline-offset-4 transition-colors hover:text-white disabled:opacity-40";
const fieldClass =
  "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-[13px] text-white outline-none transition-colors focus:border-white/60 [&>option]:bg-noir";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

export function OrdersSection() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const cancel = useMutation({
    mutationFn: (orderId: string) => cancelMyOrder({ data: { orderId } }),
    onSuccess: () => {
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      {dialog}
      <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Orders</h2>

      {isLoading ? (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          Loading…
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 border border-white/10 py-16 text-center">
          <Package size={22} className="text-white/25" />
          <p className="max-w-xs font-mono text-[11px] uppercase leading-relaxed tracking-[0.24em] text-white/40">
            No orders yet. Once you place an order it'll show up here
          </p>
          <Link
            to="/shop"
            search={{ type: "All" }}
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/70 underline underline-offset-4 hover:text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => {
            const eligibility = returnEligibility(o);
            return (
              <div key={o.id} className="border border-white/10 bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                    Order #{o.id.slice(0, 8)}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {new Date(o.created_at).toLocaleDateString()} · {o.status}
                  </p>
                </div>
                <div className="mt-3 space-y-1.5">
                  {o.items.map((item) => (
                    <p key={item.id} className="font-editorial text-[14px] text-white/60">
                      {item.quantity}× {item.product_name}
                      {item.size ? ` (${item.size})` : ""} · ₹{item.price}
                    </p>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[12px] text-white/80">Total: ₹{o.total}</p>

                <div className="mt-4 border-t border-white/10 pt-4">
                  {o.returnRequest ? (
                    <ReturnStatus request={o.returnRequest} />
                  ) : isCancellable(o.status) ? (
                    <button
                      type="button"
                      disabled={cancel.isPending}
                      onClick={() =>
                        confirm({
                          title: "Cancel order",
                          message: `Cancel order #${o.id.slice(0, 8)}? This can't be undone.`,
                          confirmLabel: "Cancel order",
                          destructive: true,
                          onConfirm: () => cancel.mutate(o.id),
                        })
                      }
                      className={actionClass}
                    >
                      Cancel order
                    </button>
                  ) : eligibility.eligible ? (
                    returnFor === o.id ? (
                      <ReturnRequestForm order={o} onClose={() => setReturnFor(null)} />
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <button type="button" onClick={() => setReturnFor(o.id)} className={actionClass}>
                          Return or exchange
                        </button>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Until {eligibility.endsAt.toLocaleDateString()}
                        </span>
                      </div>
                    )
                  ) : o.status === "delivered" ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                      {eligibility.reason}
                    </p>
                  ) : o.status === "shipped" ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                      Shipped — returns open for {RETURN_WINDOW_DAYS} days after delivery
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReturnStatus({ request }: { request: NonNullable<Order["returnRequest"]> }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">
        {request.type === "exchange" ? "Exchange" : "Return"} ·{" "}
        {RETURN_STATUS_LABELS[request.status] ?? request.status}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
        Requested {new Date(request.created_at).toLocaleDateString()}
      </p>
      {request.admin_note ? (
        <p className="mt-2 font-editorial text-[14px] text-white/60">{request.admin_note}</p>
      ) : null}
    </div>
  );
}

function ReturnRequestForm({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const [type, setType] = useState<ReturnType>("return");
  const [selected, setSelected] = useState<Record<string, string | null>>(() =>
    // Single-item orders start with that item selected.
    order.items.length === 1 ? { [order.items[0].id]: null } : {},
  );
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [tubeConfirmed, setTubeConfirmed] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      createReturnRequest({
        data: {
          orderId: order.id,
          type,
          items: Object.entries(selected).map(([orderItemId, exchangeSize]) => ({
            orderItemId,
            exchangeSize,
          })),
          reason: reason as (typeof RETURN_REASONS)[number],
          details: details.trim() || null,
          tubeAcknowledged: true,
        },
      }),
    onSuccess: () => {
      toast.success(type === "exchange" ? "Exchange requested" : "Return requested");
      qc.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedIds = Object.keys(selected);
  const missingSize = type === "exchange" && selectedIds.some((id) => !selected[id]);
  const canSubmit =
    selectedIds.length > 0 && reason && confirmed && tubeConfirmed && !missingSize;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit.mutate();
      }}
      className="space-y-5"
    >
      <div className="flex gap-2">
        {(["return", "exchange"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] transition-colors ${
              type === t
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <span className={labelClass}>Which items?</span>
        <div className="mt-2 space-y-2">
          {order.items.map((item) => {
            const checked = item.id in selected;
            return (
              <div key={item.id} className="flex flex-wrap items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3 font-editorial text-[14px] text-white/70">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSelected((s) => {
                        const next = { ...s };
                        if (e.target.checked) next[item.id] = null;
                        else delete next[item.id];
                        return next;
                      })
                    }
                    className="h-4 w-4 accent-white"
                  />
                  {item.quantity}× {item.product_name}
                  {item.size ? ` (${item.size})` : ""}
                </label>
                {type === "exchange" && checked ? (
                  <select
                    value={selected[item.id] ?? ""}
                    onChange={(e) => setSelected((s) => ({ ...s, [item.id]: e.target.value || null }))}
                    className="border border-white/15 bg-transparent px-2 py-1.5 font-mono text-[12px] text-white outline-none focus:border-white/60 [&>option]:bg-noir"
                    aria-label={`New size for ${item.product_name}`}
                  >
                    <option value="">New size…</option>
                    {EXCHANGE_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className={labelClass}>Reason</span>
        <select value={reason} onChange={(e) => setReason(e.target.value)} required className={fieldClass}>
          <option value="">Choose a reason</option>
          {RETURN_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Details (optional)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={1000}
          rows={3}
          className={fieldClass}
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 font-mono text-[11px] leading-relaxed text-white/55">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
        />
        <span>
          The piece is unworn with the brand tag and plastic seal still attached. I understand each
          order gets one return or exchange, and a ₹100 logistics charge is deducted from refunds.{" "}
          <Link to="/returns" className="underline underline-offset-4 hover:text-white">
            Full policy
          </Link>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 font-mono text-[11px] leading-relaxed text-white/55">
        <input
          type="checkbox"
          checked={tubeConfirmed}
          onChange={(e) => setTubeConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
        />
        <span>
          I'll send the piece back in its original BXLACK packing tube. If the tube isn't returned,
          ₹{PACKING_TUBE_CHARGE} will be deducted.
        </span>
      </label>

      <div className="flex items-center gap-5">
        <button
          type="submit"
          disabled={!canSubmit || submit.isPending}
          className="border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-40"
        >
          {submit.isPending ? "Submitting…" : `Request ${type}`}
        </button>
        <button type="button" onClick={onClose} className={actionClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}
