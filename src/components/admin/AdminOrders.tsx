import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Printer, Search } from "lucide-react";
import { ListRow } from "@/components/admin/ListRow";
import { TestDataControls } from "@/components/admin/TestDataControls";
import { ORDER_STATUSES, updateOrderStatus } from "@/lib/orders";
import { listOrdersForAdmin, updateOrderFulfillment, type AdminOrder } from "@/lib/orders.functions";

export const statusClass: Record<string, string> = {
  pending: "text-neutral-500",
  processing: "text-blue-600",
  shipped: "text-amber-600",
  delivered: "text-green-600",
  cancelled: "text-red-600",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2 font-mono text-[13px] text-neutral-900 outline-none focus:border-black/60";

export function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listOrdersForAdmin(),
  });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      toast.success("Order updated");
      ["admin-orders", "admin-dashboard"].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return orders.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (!q ||
          String(o.orderNumber).includes(q) ||
          [o.email, o.fullName, o.phone, o.trackingNumber].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [orders, status, query]);

  const viewing = orders.find((o) => o.id === viewingId) ?? null;
  if (viewing) {
    return (
      <OrderDetail
        order={viewing}
        onBack={() => setViewingId(null)}
        onStatusChange={(s) => statusMutation.mutate({ orderId: viewing.id, status: s })}
        busy={statusMutation.isPending}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Orders — {orders.length}</h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Every order placed by a customer, newest first
          </p>
        </div>
        <TestDataControls />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 border border-black/15 px-3 py-2 focus-within:border-black/60">
          <Search size={14} className="shrink-0 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order #, name, email, phone, tracking"
            className="w-full bg-transparent font-mono text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </label>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              status === s ? "bg-black text-white" : "bg-black/5 text-neutral-600 hover:bg-black/10"
            }`}
          >
            {s} {counts[s] ? `(${counts[s]})` : ""}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            {orders.length === 0 ? "No orders yet" : "No matching orders"}
          </p>
        ) : (
          filtered.map((o) => (
            <ListRow
              key={o.id}
              title={`#${o.orderNumber} · ${o.fullName || o.email}`}
              subtitle={new Date(o.createdAt).toLocaleString()}
              meta={
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-neutral-600">{inr(o.total)}</span>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.2em] ${statusClass[o.status] ?? "text-neutral-500"}`}
                  >
                    {o.status}
                  </span>
                </div>
              }
              onEdit={() => setViewingId(o.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  onBack,
  onStatusChange,
  busy,
}: {
  order: AdminOrder;
  onBack: () => void;
  onStatusChange: (status: string) => void;
  busy: boolean;
}) {
  const qc = useQueryClient();
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [note, setNote] = useState(order.note);

  useEffect(() => {
    setCourier(order.courier ?? "");
    setTracking(order.trackingNumber ?? "");
    setNote(order.note);
  }, [order.courier, order.trackingNumber, order.note]);

  const save = useMutation({
    mutationFn: () =>
      updateOrderFulfillment({
        data: {
          orderId: order.id,
          courier: courier.trim() || null,
          trackingNumber: tracking.trim() || null,
          note: note.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const address = [order.addressLine1, order.addressLine2].filter(Boolean).join(", ");
  const cityLine = [order.city, order.state, order.postalCode].filter(Boolean).join(", ");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Order #{order.orderNumber}</h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <button
            onClick={() => printInvoice(order)}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 hover:text-black"
          >
            <Printer size={13} /> Invoice
          </button>
          <button
            onClick={onBack}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400 hover:text-black"
          >
            Back to orders
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border border-black/12 p-5">
        <span className={labelClass}>Status</span>
        <select
          value={order.status}
          disabled={busy}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border border-black/15 bg-transparent px-3 py-2 font-mono text-[14px] uppercase tracking-[0.2em] text-neutral-900 outline-none focus:border-black/60 [&>option]:bg-white"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
          {order.shippedAt ? `Shipped ${new Date(order.shippedAt).toLocaleDateString()}` : null}
          {order.deliveredAt ? ` · Delivered ${new Date(order.deliveredAt).toLocaleDateString()}` : null}
        </span>
      </div>
      {order.status !== "cancelled" ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
          Cancelling puts this order's items back into stock.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 border border-black/12 p-5 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Customer</span>
          <p className="mt-2 font-sans text-[13px] text-neutral-900">{order.fullName || "Not provided"}</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-600">{order.email}</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-600">{order.phone || "No phone on file"}</p>
        </div>
        <div>
          <span className={labelClass}>Shipping address</span>
          {address ? (
            <p className="mt-2 font-sans text-[13px] leading-relaxed text-neutral-900">
              {address}
              <br />
              {cityLine}
              {order.country ? (
                <>
                  <br />
                  {order.country}
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 font-mono text-[11px] text-neutral-400">No address on file</p>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-6 grid gap-5 border border-black/12 p-5 sm:grid-cols-2"
      >
        <label className="block">
          <span className={labelClass}>Courier</span>
          <input
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="e.g. Delhivery"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Tracking number</span>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Internal note — only admins see this</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="border border-black bg-black px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:bg-transparent hover:text-black disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
          <span className="ml-4 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Courier and tracking are shown to the customer
          </span>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        {order.items.map((item) => (
          <ListRow
            key={item.id}
            thumbnail={null}
            title={item.productName}
            subtitle={item.size ? `Size ${item.size} · Qty ${item.quantity}` : `Qty ${item.quantity}`}
            meta={<span className="font-mono text-[11px] text-neutral-600">{inr(item.price)}</span>}
          />
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-black/10 pt-5 font-mono text-[12px] text-neutral-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{inr(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 ? (
          <div className="flex justify-between">
            <span>Discount{order.discountCode ? ` · ${order.discountCode}` : ""}</span>
            <span>−{inr(order.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between pt-2">
          <span className={labelClass}>Total</span>
          <span className="text-[14px] text-neutral-900">{inr(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function exportCsv(orders: AdminOrder[]) {
  const header = [
    "Order", "Date", "Status", "Customer", "Email", "Phone", "Address", "City", "State",
    "Postal code", "Country", "Items", "Subtotal", "Discount code", "Discount", "Total",
    "Payment", "Courier", "Tracking",
  ];
  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toISOString(),
    o.status,
    o.fullName,
    o.email,
    o.phone,
    [o.addressLine1, o.addressLine2].filter(Boolean).join(", "),
    o.city,
    o.state,
    o.postalCode,
    o.country,
    o.items.map((i) => `${i.quantity}x ${i.productName}${i.size ? ` (${i.size})` : ""}`).join("; "),
    o.subtotal,
    o.discountCode,
    o.discountAmount,
    o.total,
    o.paymentMethod,
    o.courier,
    o.trackingNumber,
  ]);
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `bxlack-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function printInvoice(o: AdminOrder) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return toast.error("Allow pop-ups to print the invoice");
  const rows = o.items
    .map(
      (i) =>
        `<tr><td>${esc(i.productName)}${i.size ? ` · ${esc(i.size)}` : ""}</td><td class="r">${i.quantity}</td><td class="r">${esc(inr(i.price))}</td><td class="r">${esc(inr(i.price * i.quantity))}</td></tr>`,
    )
    .join("");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice #${o.orderNumber}</title>
<style>
  body{font-family:Helvetica,Arial,sans-serif;color:#111;margin:40px;font-size:13px}
  h1{font-size:22px;letter-spacing:.3em;margin:0}
  .muted{color:#666}.r{text-align:right}
  .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  .cols{display:flex;gap:48px;margin-bottom:28px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:10px 0;border-bottom:1px solid #ddd;text-align:left}
  th{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#666}
  .totals{margin-left:auto;width:280px;margin-top:16px}
  .totals div{display:flex;justify-content:space-between;padding:4px 0}
  .grand{font-weight:bold;border-top:1px solid #111;margin-top:6px;padding-top:8px!important}
  @media print{body{margin:16mm}}
</style></head><body>
  <div class="head">
    <div><h1>BXLACK</h1><p class="muted">clients@bxlack.com</p></div>
    <div class="r"><strong>Invoice #${o.orderNumber}</strong><br><span class="muted">${esc(new Date(o.createdAt).toLocaleDateString("en-IN"))}</span><br><span class="muted">${o.paymentMethod === "cod" ? "Cash on delivery" : esc(o.paymentMethod)}</span></div>
  </div>
  <div class="cols">
    <div><p class="muted">Bill / ship to</p><p>${esc(o.fullName)}<br>${esc([o.addressLine1, o.addressLine2].filter(Boolean).join(", "))}<br>${esc([o.city, o.state, o.postalCode].filter(Boolean).join(", "))}<br>${esc(o.country)}</p></div>
    <div><p class="muted">Contact</p><p>${esc(o.email)}<br>${esc(o.phone)}</p></div>
  </div>
  <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div><span>Subtotal</span><span>${esc(inr(o.subtotal))}</span></div>
    ${o.discountAmount > 0 ? `<div><span>Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}</span><span>−${esc(inr(o.discountAmount))}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${esc(inr(o.total))}</span></div>
  </div>
  <p class="muted" style="margin-top:48px">Thank you for shopping with BXLACK.</p>
  <script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}
