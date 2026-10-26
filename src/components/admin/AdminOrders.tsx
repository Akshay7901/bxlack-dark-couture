import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Printer, Search } from "lucide-react";
import { ListRow } from "@/components/admin/ListRow";
import { Badge, ORDER_STATUS_TONE, statusLabel } from "@/components/admin/Badge";
import { printPackingSlips, printShippingLabels } from "@/components/admin/printDocs";
import { TestDataControls } from "@/components/admin/TestDataControls";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import {
  listOrdersForAdmin,
  setOrderStatus,
  updateOrderFulfillment,
  type AdminOrder,
} from "@/lib/orders.functions";

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

export function AdminOrders({ initialQuery = "" }: { initialQuery?: string }) {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listOrdersForAdmin(),
  });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      setOrderStatus({ data: { orderId, status: status as OrderStatus } }),
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
            {s === "all" ? "All" : statusLabel(s)} {counts[s] ? `(${counts[s]})` : ""}
          </button>
        ))}
      </div>

      <BulkPrintBar
        filtered={filtered}
        selected={selected}
        setSelected={setSelected}
        selectedOrders={orders.filter((o) => selected.has(o.id))}
      />

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            {orders.length === 0 ? "No orders yet" : "No matching orders"}
          </p>
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(o.id)}
                onChange={() => toggle(o.id)}
                aria-label={`Select order #${o.orderNumber}`}
                className="h-4 w-4 shrink-0 accent-black"
              />
              <div className="min-w-0 flex-1">
                <ListRow
                  title={`#${o.orderNumber} · ${o.fullName || o.email}`}
                  subtitle={new Date(o.createdAt).toLocaleString()}
                  meta={
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-neutral-600">{inr(o.total)}</span>
                      <Badge tone={ORDER_STATUS_TONE[o.status]}>{statusLabel(o.status)}</Badge>
                      <button
                        type="button"
                        onClick={() => printShippingLabels([o])}
                        aria-label={`Print shipping label for order #${o.orderNumber}`}
                        title="Print shipping label"
                        className="flex h-8 w-8 items-center justify-center border border-black/15 text-neutral-500 transition-colors hover:border-black/50 hover:text-black"
                      >
                        <Printer size={13} />
                      </button>
                    </div>
                  }
                  onEdit={() => setViewingId(o.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Select orders on the list and print their labels or packing slips together. */
function BulkPrintBar({
  filtered,
  selected,
  setSelected,
  selectedOrders,
}: {
  filtered: AdminOrder[];
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  selectedOrders: AdminOrder[];
}) {
  const allShown = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const toShip = filtered.filter((o) => o.status === "pending" || o.status === "processing");
  const button =
    "border border-black/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-700 hover:border-black hover:text-black disabled:opacity-40";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border border-black/12 px-4 py-3">
      <label className="mr-2 flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={allShown}
          onChange={() => setSelected(allShown ? new Set() : new Set(filtered.map((o) => o.id)))}
          className="h-4 w-4 accent-black"
          aria-label="Select all shown orders"
        />
        {selected.size ? `${selected.size} selected` : "Select all"}
      </label>
      <button
        type="button"
        className={button}
        disabled={toShip.length === 0}
        onClick={() => setSelected(new Set(toShip.map((o) => o.id)))}
      >
        Select to-ship ({toShip.length})
      </button>
      <div className="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!selectedOrders.length}
          onClick={() => printShippingLabels(selectedOrders)}
          className="flex items-center gap-2 border border-black bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-40"
        >
          <Printer size={13} /> Print labels{selectedOrders.length ? ` (${selectedOrders.length})` : ""}
        </button>
        <button
          type="button"
          className={button}
          disabled={!selectedOrders.length}
          onClick={() => printPackingSlips(selectedOrders)}
        >
          Packing slips{selectedOrders.length ? ` (${selectedOrders.length})` : ""}
        </button>
        {selected.size ? (
          <button type="button" className={button} onClick={() => setSelected(new Set())}>
            Clear
          </button>
        ) : null}
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
          <h2 className="flex flex-wrap items-center gap-2 font-display text-xl uppercase tracking-[-0.01em]">
            Order #{order.orderNumber}
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{statusLabel(order.status)}</Badge>
            {order.paymentMethod === "cod" ? <Badge tone="attention">Payment pending · COD</Badge> : null}
          </h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => printShippingLabels([order])}
            className="flex items-center gap-2 border border-black bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white"
          >
            <Printer size={13} /> Shipping label
          </button>
          <button
            onClick={() => printPackingSlips([order])}
            className="flex items-center gap-2 border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-700 hover:border-black hover:text-black"
          >
            Packing slip
          </button>
          <button
            onClick={() => printInvoice(order)}
            className="flex items-center gap-2 border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-700 hover:border-black hover:text-black"
          >
            Invoice
          </button>
          <button
            onClick={onBack}
            className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 hover:text-black"
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
      <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-neutral-400">
        The customer is emailed when you mark it shipped, delivered or cancelled — save the
        tracking number below before marking it shipped so it's included.
        {order.status !== "cancelled" ? " Cancelling puts the items back into stock." : ""}
      </p>

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
    <div><img src="${window.location.origin}/label-signature.png" alt="BXLACK" style="height:44px;width:auto;display:block;margin-bottom:6px"><p class="muted" style="margin:0">clients@bxlack.com</p></div>
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
