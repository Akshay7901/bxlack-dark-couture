import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listReturnRequestsForAdmin,
  updateReturnRequest,
  type AdminReturnRequest,
} from "@/lib/returns.functions";
import { RETURN_STATUSES, RETURN_STATUS_LABELS, type ReturnStatus } from "@/lib/returns";

const statusClass: Record<string, string> = {
  requested: "text-amber-600",
  approved: "text-sky-600",
  rejected: "text-red-600",
  picked_up: "text-violet-600",
  completed: "text-emerald-600",
};

const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";

export function AdminReturns() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["admin-returns"],
    queryFn: () => listReturnRequestsForAdmin(),
  });

  const open = requests.filter((r) => r.status === "requested").length;

  return (
    <section>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">
        Returns — {requests.length}
      </h2>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
        {open > 0 ? `${open} awaiting review` : "Return and exchange requests from customers"}
      </p>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            Loading…
          </p>
        ) : error ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-red-600">
            {(error as Error).message}
          </p>
        ) : requests.length === 0 ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            No return requests yet
          </p>
        ) : (
          requests.map((r) => {
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} className="border border-black/10 bg-black/[0.02]">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.04]"
                >
                  <div className="min-w-[160px] flex-1">
                    <p className="truncate font-sans text-[14px] text-neutral-900">
                      {r.type === "exchange" ? "Exchange" : "Return"} · {r.fullName || r.email}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500">
                      Order #{r.orderId.slice(0, 8)} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] ${statusClass[r.status] ?? "text-neutral-500"}`}
                  >
                    {RETURN_STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </button>
                {expanded ? <ReturnDetail request={r} /> : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function ReturnDetail({ request: r }: { request: AdminReturnRequest }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ReturnStatus>(r.status as ReturnStatus);
  const [note, setNote] = useState(r.adminNote ?? "");

  useEffect(() => {
    setStatus(r.status as ReturnStatus);
    setNote(r.adminNote ?? "");
  }, [r.status, r.adminNote]);

  const save = useMutation({
    mutationFn: () =>
      updateReturnRequest({ data: { id: r.id, status, adminNote: note.trim() || null } }),
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["admin-returns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 border-t border-black/10 px-4 py-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Customer</span>
          <p className="mt-2 font-sans text-[13px] text-neutral-900">{r.fullName || "Not provided"}</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-600">{r.email}</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-600">{r.phone || "No phone on file"}</p>
        </div>
        <div>
          <span className={labelClass}>Pickup address</span>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-neutral-900">
            {r.address || "No address on file"}
          </p>
        </div>
      </div>

      <div>
        <span className={labelClass}>Items</span>
        <div className="mt-2 space-y-1.5">
          {r.items.map((i) => (
            <p key={i.orderItemId} className="font-sans text-[13px] text-neutral-800">
              {i.quantity}× {i.productName}
              {i.size ? ` (${i.size})` : ""}
              {i.exchangeSize ? ` → exchange for ${i.exchangeSize}` : ""}
            </p>
          ))}
        </div>
      </div>

      <div>
        <span className={labelClass}>Reason</span>
        <p className="mt-2 font-sans text-[13px] text-neutral-900">{r.reason}</p>
        {r.details ? (
          <p className="mt-1 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-neutral-600">
            {r.details}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 border border-black/12 p-4 sm:grid-cols-[180px_1fr]">
        <label className="block">
          <span className={labelClass}>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReturnStatus)}
            className="mt-2 w-full border border-black/15 bg-transparent px-3 py-2 font-mono text-[12px] uppercase tracking-[0.15em] text-neutral-900 outline-none focus:border-black/60 [&>option]:bg-white"
          >
            {RETURN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {RETURN_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Note to customer (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="e.g. Pickup scheduled for Monday"
            className="mt-2 w-full border border-black/15 bg-transparent px-3 py-2 font-mono text-[13px] text-neutral-900 outline-none focus:border-black/60"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="border border-black bg-black px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
