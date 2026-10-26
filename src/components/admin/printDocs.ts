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
  // Make it scalable: CSS sets the printed size instead of JsBarcode's fixed pixels.
  const w = svg.getAttribute("width");
  const h = svg.getAttribute("height");
  if (w && h) {
    svg.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.removeAttribute("style");
  }
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
// Borders and black text only (no filled backgrounds), so it prints the same
// whether or not "Background graphics" is ticked in the print dialog.

/** Absolute URL: the print window is about:blank, so relative paths don't resolve. */
const logoUrl = () => `${window.location.origin}/label-signature.png`;

const LABEL_CSS = `
  @page{size:4in 6in;margin:0}
  .label{width:4in;height:6in;padding:0.13in 0.15in;display:flex;flex-direction:column;gap:0.075in;overflow:hidden}
  .hd{display:flex;justify-content:space-between;align-items:center;padding-bottom:0.06in;border-bottom:2.5px solid #000}
  .hd img{height:0.5in;width:auto;display:block;margin:-0.04in 0}
  .hd .r{text-align:right;line-height:1.1}
  .k{font-size:7.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
  .hd .num{font-size:19px;font-weight:800;letter-spacing:.02em}
  .bc{text-align:center}
  .bc svg{width:88%;height:0.5in;display:block;margin:0 auto}
  .bc .code{font-family:"Courier New",monospace;font-size:10px;font-weight:700;letter-spacing:.35em;margin-top:2px}
  .to{border:2.5px solid #000;border-radius:7px;padding:0.08in 0.11in;display:flex;flex-direction:column}
  .awb{flex:1;border:1.5px dashed #000;border-radius:7px;display:flex;align-items:center;justify-content:center;text-align:center;min-height:0.5in}
  .awb span{font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#555}
  .to .name{font-size:18px;font-weight:800;line-height:1.15;margin:3px 0 4px}
  .to .addr{font-size:12.5px;line-height:1.38}
  .to .row{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;padding-top:7px}
  .pin{border:2px solid #000;border-radius:5px;padding:2px 8px;font-size:22px;font-weight:800;letter-spacing:.12em}
  .phone{font-size:13px;font-weight:700;text-align:right}
  .grid{display:grid;grid-template-columns:1.15fr 1fr;gap:0.07in}
  .pay{border:3px solid #000;border-radius:7px;padding:0.06in 0.09in;display:flex;flex-direction:column;justify-content:center}
  .pay .mode{font-size:13px;font-weight:800;letter-spacing:.06em}
  .pay .amt{font-size:24px;font-weight:900;line-height:1.1}
  .pay .hint{font-size:8px;font-weight:600}
  .info{border:1.5px solid #000;border-radius:7px;padding:0.06in 0.09in;font-size:9.5px;line-height:1.55}
  .info b{font-weight:700}
  .contents{font-size:9px;line-height:1.4}
  .ret{border-top:1.5px dashed #000;padding-top:0.05in;font-size:8.5px;line-height:1.4;display:flex;justify-content:space-between;gap:8px}
  .ret .site{text-align:right;white-space:nowrap}
`;

function labelHtml(o: AdminOrder): string {
  const cod = o.paymentMethod === "cod";
  const count = itemCount(o);
  const items = o.items
    .slice(0, 5)
    .map((i) => `${i.quantity}× ${esc(i.productName)}${i.size ? ` (${esc(i.size)})` : ""}`)
    .join(" · ");
  const more = o.items.length > 5 ? ` · +${o.items.length - 5} more` : "";
  const ret = [STORE.name, ...STORE.returnAddress, STORE.phone].filter(Boolean).map(esc).join(", ");
  const abroad = o.country && !/^india$/i.test(o.country) ? `<div>${esc(o.country)}</div>` : "";

  return `<section class="page label">
  <div class="hd">
    <img src="${logoUrl()}" alt="${esc(STORE.name)}">
    <div class="r"><div class="k">Shipping label</div><div class="num">#${o.orderNumber}</div></div>
  </div>

  <div class="bc">${barcodeSvg(String(o.orderNumber))}<div class="code">${o.orderNumber}</div></div>

  <div class="to">
    <div class="k">Deliver to</div>
    <div class="name">${esc(o.fullName || "Customer")}</div>
    <div class="addr">${addressLines(o).map(esc).join("<br>")}${abroad}</div>
    <div class="row">
      <span class="pin">${esc(o.postalCode)}</span>
      ${o.phone ? `<span class="phone">☎ ${esc(o.phone)}</span>` : ""}
    </div>
  </div>

  <div class="awb"><span>${o.trackingNumber ? `AWB ${esc(o.trackingNumber)}` : "Paste courier AWB sticker here"}</span></div>

  <div class="grid">
    <div class="pay">
      ${
        cod
          ? `<div class="mode">COD · COLLECT</div><div class="amt">${inr(o.total)}</div><div class="hint">Collect cash on delivery</div>`
          : `<div class="mode">PREPAID</div><div class="amt">PAID</div><div class="hint">Do not collect cash</div>`
      }
    </div>
    <div class="info">
      <div><b>Date</b> ${date(o.createdAt)}</div>
      <div><b>Items</b> ${count} pc${count === 1 ? "" : "s"}</div>
      ${o.courier ? `<div><b>Courier</b> ${esc(o.courier)}</div>` : ""}
      ${o.trackingNumber ? `<div><b>AWB</b> ${esc(o.trackingNumber)}</div>` : ""}
    </div>
  </div>

  <div class="contents"><span class="k">Contents</span> ${items}${more}</div>

  <div class="ret">
    <div><span class="k">If undelivered, return to</span><br>${ret || esc(STORE.name)}</div>
    <div class="site">${esc(STORE.email)}</div>
  </div>
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
  .logo{height:42px;width:auto;display:block;margin-bottom:4px}
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
    <div><img class="logo" src="${logoUrl()}" alt="${esc(STORE.name)}"><div class="muted">${esc(STORE.email)}</div></div>
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
