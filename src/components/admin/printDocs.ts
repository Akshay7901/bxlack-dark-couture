/**
 * Printable fulfilment documents for the admin Orders screen: 4×6" courier
 * shipping labels and A4 packing slips, for one order or many at once. Each
 * opens a print-ready window (one page per order) and triggers the print
 * dialog, so it works with any printer, including thermal label printers.
 */
import JsBarcode from "jsbarcode";
import { toast } from "sonner";
import type { AdminOrder } from "@/lib/orders.functions";
import { STORE } from "@/lib/store";

const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Code 128 barcode of the order number as inline SVG markup. */
function barcodeSvg(value: string, height = 56): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: "CODE128",
    height,
    width: 2,
    margin: 0,
    displayValue: false,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return svg.outerHTML;
}

/** A complete printable HTML document; `autoPrint` opens the print dialog on load. */
function printDocument(title: string, css: string, body: string, autoPrint: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{break-after:page;page-break-after:always}
  .page:last-child{break-after:auto;page-break-after:auto}
  ${css}
</style></head><body>${body}
${autoPrint ? "<script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>" : ""}
</body></html>`;
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    toast.error("Allow pop-ups for this site to print");
    return;
  }
  win.document.write(html);
  win.document.close();
}

const addressLines = (o: AdminOrder) =>
  [
    [o.addressLine1, o.addressLine2].filter(Boolean).join(", "),
    [o.city, o.state].filter(Boolean).join(", "),
  ].filter(Boolean);

const itemCount = (o: AdminOrder) => o.items.reduce((n, i) => n + i.quantity, 0);

// ---------------------------------------------------------------------------
// 4×6" shipping label
// ---------------------------------------------------------------------------

const LABEL_CSS = `
  @page{size:4in 6in;margin:0}
  .label{width:4in;height:6in;padding:0.14in;display:flex;flex-direction:column;gap:0.08in;overflow:hidden}
  .box{border:2px solid #000;border-radius:4px;padding:0.08in 0.1in}
  .k{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#000}
  .from{font-size:10px;line-height:1.35}
  .to{flex:1;font-size:14px;line-height:1.35}
  .to .name{font-size:19px;font-weight:700;margin:2px 0 3px}
  .to .pin{font-size:24px;font-weight:800;letter-spacing:.06em;margin-top:3px}
  .to .phone{font-size:14px;font-weight:700;margin-top:4px}
  .pay{display:flex;justify-content:space-between;align-items:center;background:#000;color:#fff;border-radius:4px;padding:0.07in 0.1in}
  .pay.prepaid{background:#fff;color:#000;border:2px solid #000}
  .pay .mode{font-size:18px;font-weight:800;letter-spacing:.04em}
  .pay .amt{font-size:22px;font-weight:800}
  .order{display:flex;justify-content:space-between;align-items:flex-end;gap:8px}
  .order .num{font-size:22px;font-weight:800}
  .order .meta{font-size:10px;text-align:right;line-height:1.4}
  .bar{text-align:center}
  .bar svg{width:100%;height:0.6in}
  .items{font-size:9.5px;line-height:1.35;border-top:1px dashed #000;padding-top:0.05in}
`;

function labelHtml(o: AdminOrder): string {
  const cod = o.paymentMethod === "cod";
  const items = o.items
    .slice(0, 6)
    .map((i) => `${i.quantity}× ${esc(i.productName)}${i.size ? ` (${esc(i.size)})` : ""}`)
    .join(" · ");
  const more = o.items.length > 6 ? ` · +${o.items.length - 6} more` : "";
  const from = [STORE.name, ...STORE.returnAddress, STORE.phone].filter(Boolean).map(esc).join("<br>");
  return `<section class="page label">
  <div class="box from"><div class="k">From (return to)</div>${from}</div>
  <div class="box to">
    <div class="k">Ship to</div>
    <div class="name">${esc(o.fullName || "Customer")}</div>
    ${addressLines(o).map((l) => `<div>${esc(l)}</div>`).join("")}
    <div class="pin">${esc(o.postalCode)}</div>
    ${o.country && !/^india$/i.test(o.country) ? `<div>${esc(o.country)}</div>` : ""}
    ${o.phone ? `<div class="phone">☎ ${esc(o.phone)}</div>` : ""}
  </div>
  <div class="pay ${cod ? "" : "prepaid"}">
    <span class="mode">${cod ? "COD — COLLECT" : "PREPAID"}</span>
    <span class="amt">${cod ? inr(o.total) : "₹0"}</span>
  </div>
  <div class="order">
    <div><div class="k">Order</div><div class="num">#${o.orderNumber}</div></div>
    <div class="meta">${date(o.createdAt)}<br>${itemCount(o)} item${itemCount(o) === 1 ? "" : "s"}${
      o.courier ? `<br>${esc(o.courier)}` : ""
    }${o.trackingNumber ? `<br>AWB ${esc(o.trackingNumber)}` : ""}</div>
  </div>
  <div class="bar">${barcodeSvg(String(o.orderNumber))}</div>
  <div class="items">${items}${more}</div>
</section>`;
}

export function shippingLabelsDocument(orders: AdminOrder[], autoPrint = true): string {
  const title = orders.length === 1 ? `Label #${orders[0].orderNumber}` : `${orders.length} shipping labels`;
  return printDocument(title, LABEL_CSS, orders.map(labelHtml).join(""), autoPrint);
}

export function printShippingLabels(orders: AdminOrder[]) {
  if (orders.length) openPrintWindow(shippingLabelsDocument(orders));
}

// ---------------------------------------------------------------------------
// A4 packing slip
// ---------------------------------------------------------------------------

const SLIP_CSS = `
  @page{size:A4;margin:14mm}
  .slip{font-size:12.5px;line-height:1.45}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:18px}
  .brand{font-size:22px;font-weight:800;letter-spacing:.3em}
  .muted{color:#555}
  .title{text-align:right}
  .title .t{font-size:16px;font-weight:700}
  .cols{display:flex;gap:40px;margin-bottom:20px}
  .cols > div{flex:1}
  .k{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#555;margin-bottom:4px}
  table{width:100%;border-collapse:collapse}
  th{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#555;text-align:left;border-bottom:1.5px solid #000;padding:6px 4px}
  td{border-bottom:1px solid #ddd;padding:9px 4px;vertical-align:top}
  .c{text-align:center}
  .tick{display:inline-block;width:14px;height:14px;border:1.5px solid #000;border-radius:2px}
  .bar svg{height:44px;width:auto}
  .foot{margin-top:28px;border-top:1px solid #ddd;padding-top:12px}
`;

function slipHtml(o: AdminOrder): string {
  const rows = o.items
    .map(
      (i) => `<tr><td class="c"><span class="tick"></span></td><td>${esc(i.productName)}</td><td class="c">${esc(
        i.size ?? "—",
      )}</td><td class="c"><strong>${i.quantity}</strong></td></tr>`,
    )
    .join("");
  return `<section class="page slip">
  <div class="head">
    <div><div class="brand">${esc(STORE.name)}</div><div class="muted">${esc(STORE.email)}</div></div>
    <div class="title"><div class="t">Packing slip · Order #${o.orderNumber}</div><div class="muted">${date(o.createdAt)}</div>
      <div class="bar">${barcodeSvg(String(o.orderNumber), 40)}</div></div>
  </div>
  <div class="cols">
    <div><div class="k">Ship to</div><strong>${esc(o.fullName || "Customer")}</strong><br>${addressLines(o)
      .map(esc)
      .join("<br>")}<br>${esc(o.postalCode)}${o.country ? `, ${esc(o.country)}` : ""}${
      o.phone ? `<br>${esc(o.phone)}` : ""
    }</div>
    <div><div class="k">Order</div>${itemCount(o)} item${itemCount(o) === 1 ? "" : "s"}<br>Payment: ${
      o.paymentMethod === "cod" ? `Cash on delivery (${inr(o.total)})` : "Prepaid"
    }${o.courier ? `<br>Courier: ${esc(o.courier)}` : ""}${o.trackingNumber ? `<br>Tracking: ${esc(o.trackingNumber)}` : ""}</div>
  </div>
  <table><thead><tr><th class="c" style="width:44px">Packed</th><th>Item</th><th class="c" style="width:70px">Size</th><th class="c" style="width:50px">Qty</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="foot">
    <strong>Thank you for shopping with ${esc(STORE.name)}.</strong><br>
    <span class="muted">Need a return or exchange? Request it from your account within 7 days of delivery. Keep the brand tag and seal attached and send it back in the original packing tube.</span>
  </div>
</section>`;
}

export function packingSlipsDocument(orders: AdminOrder[], autoPrint = true): string {
  const title = orders.length === 1 ? `Packing slip #${orders[0].orderNumber}` : `${orders.length} packing slips`;
  return printDocument(title, SLIP_CSS, orders.map(slipHtml).join(""), autoPrint);
}

export function printPackingSlips(orders: AdminOrder[]) {
  if (orders.length) openPrintWindow(packingSlipsDocument(orders));
}
