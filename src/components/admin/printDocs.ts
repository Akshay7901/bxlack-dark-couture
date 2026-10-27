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
// 4×6" shipping label — "Index" design
// ---------------------------------------------------------------------------
// Black spine and header band, numbered sections 01–06, handling strip.
// Every solid black area is drawn with a thick border instead of a
// background, because borders still print when "Background graphics" is
// unticked in the print dialog (backgrounds don't).

/** Absolute URLs: the print window is about:blank, so relative paths don't resolve. */
const logoUrl = () => `${window.location.origin}/label-signature.png`;
const whiteLogoUrl = () => `${window.location.origin}/email-signature.png`;

const ICON = {
  up: `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M5 11l7-7 7 7"/></svg>`,
  fragile: `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l-1 7a4 4 0 0 1-8 0L7 3zM12 14v7M8 21h8"/></svg>`,
  dry: `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 18 0H3zM12 12v7a2 2 0 0 0 4 0"/></svg>`,
};

const LABEL_CSS = `
  @page{size:4in 6in;margin:0}
  .label{width:4in;height:6in;padding:0.1in}
  .frame{position:relative;height:100%;border:2px solid #000;border-left:0.28in solid #000;display:flex;flex-direction:column}
  .spine{position:absolute;left:-0.28in;top:0;bottom:0;width:0.28in;display:flex;align-items:center;justify-content:center}
  .spine span{writing-mode:vertical-rl;transform:rotate(180deg);color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.32em;white-space:nowrap}
  /* Solid black header band via a thick top border; content is laid over it. */
  .band{position:relative;height:0;border-top:0.5in solid #000;flex:none}
  .band .in{position:absolute;left:0;right:0;top:-0.5in;height:0.5in;display:flex;justify-content:space-between;align-items:center;padding:0 0.1in;color:#fff}
  .band img{height:0.36in;width:auto;display:block}
  .band .r{text-align:right;line-height:1.15}
  .band .t{font-size:8px;font-weight:800;letter-spacing:.18em}
  .band .num{font-size:14px;font-weight:800;letter-spacing:.03em}
  .sec{border-top:1.5px solid #000;padding:0.06in 0.1in;flex:none}
  .sec:first-of-type{border-top:0}
  .h{display:flex;align-items:center;gap:6px;margin-bottom:3px}
  .h b{font-size:8.5px;font-weight:800;letter-spacing:.16em}
  /* Numbered badge: a black square from a thick border, number laid on top. */
  .n{position:relative;display:inline-block;width:17px;height:0;border-top:14px solid #000}
  .n span{position:absolute;left:0;top:-14px;width:17px;line-height:14px;text-align:center;color:#fff;font-size:8.5px;font-weight:800}
  .pin{font-size:36px;font-weight:900;letter-spacing:.04em;line-height:1}
  .name{font-size:14px;font-weight:800;margin-top:3px}
  .addr{font-size:9.5px;line-height:1.38;margin-top:1px}
  .row2{display:grid;grid-template-columns:1fr 1fr;border-top:1.5px solid #000;flex:none}
  .row2 > div{padding:0.06in 0.1in}
  .row2 > div + div{border-left:1.5px solid #000}
  .big{font-size:17px;font-weight:800;line-height:1.15}
  .small{font-size:8.5px;font-weight:600;margin-top:2px}
  /* Solid black COD pill (border technique again). */
  .cod{position:relative;display:inline-block;vertical-align:top;height:0;border-top:22px solid #000;border-radius:4px;padding:0 8px;margin-bottom:-22px}
  .cod span{position:relative;top:-22px;display:block;line-height:22px;color:#fff;font-size:14px;font-weight:900;white-space:nowrap}
  .awb{border:1.5px dashed #000;border-radius:3px;height:0.48in;display:flex;align-items:center;justify-content:center;padding:4px 8px}
  .awb svg{width:100%;height:100%}
  .awb em{font-style:normal;font-size:8px;font-weight:700;letter-spacing:.16em;color:#444}
  .awbno{text-align:center;font-size:10px;font-weight:800;letter-spacing:.14em;margin-top:3px}
  .grow{flex:1}
  .items{font-size:9px;line-height:1.5}
  .items .li{display:flex;justify-content:space-between;gap:6px}
  .items .li span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .items .tot{display:flex;justify-content:space-between;font-weight:800;font-size:10px;border-top:1px solid #000;margin-top:2px;padding-top:2px}
  .ret{font-size:8.5px;line-height:1.4}
  .strip{display:grid;grid-template-columns:repeat(3,1fr);border-top:1.5px solid #000;flex:none}
  .strip div{display:flex;align-items:center;justify-content:center;gap:4px;padding:4px 0;font-size:7.5px;font-weight:800;letter-spacing:.12em}
  .strip div + div{border-left:1.5px solid #000}
`;

const badge = (n: string) => `<span class="n"><span>${n}</span></span>`;

function labelHtml(o: AdminOrder): string {
  const cod = o.paymentMethod === "cod";
  const count = itemCount(o);
  const shown = o.items.slice(0, 4);
  const more = o.items.length - shown.length;
  const ret = [...STORE.returnAddress, STORE.phone ? `Ph: ${STORE.phone}` : ""].filter(Boolean).map(esc).join(", ");
  const abroad = o.country && !/^india$/i.test(o.country) ? `, ${esc(o.country)}` : "";

  return `<section class="page label"><div class="frame">
  <div class="spine"><span>${esc(STORE.name)} · HANDLE WITH CARE · ${esc(STORE.name)}</span></div>

  <div class="band"><div class="in">
    <img src="${whiteLogoUrl()}" alt="${esc(STORE.name)}">
    <div class="r"><div class="t">SHIPMENT</div><div class="num">#${o.orderNumber}</div></div>
  </div></div>

  <div class="sec grow">
    <div class="h">${badge("01")}<b>DELIVER TO</b></div>
    <div class="pin">${esc(o.postalCode)}</div>
    <div class="name">${esc(o.fullName || "Customer")}</div>
    <div class="addr">${addressLines(o).map(esc).join("<br>")}${abroad}${o.phone ? ` · Ph: ${esc(o.phone)}` : ""}</div>
  </div>

  <div class="row2">
    <div>
      <div class="h">${badge("02")}<b>PAYMENT</b></div>
      ${
        cod
          ? `<div style="height:22px"><span class="cod"><span>COD ${inr(o.total)}</span></span></div><div class="small">Collect cash on delivery</div>`
          : `<div class="big">PREPAID</div><div class="small">Do not collect cash</div>`
      }
    </div>
    <div>
      <div class="h">${badge("03")}<b>PARCEL</b></div>
      <div class="big">____ kg</div>
      <div class="small">Inv. #${o.orderNumber} · ${count} pc${count === 1 ? "" : "s"}</div>
    </div>
  </div>

  <div class="sec" style="border-top:1.5px solid #000">
    <div class="h">${badge("04")}<b>TRACKING</b></div>
    <div class="awb">${o.trackingNumber ? barcodeSvg(o.trackingNumber, 40) : "<em>PASTE COURIER AWB STICKER HERE</em>"}</div>
    <div class="awbno">AWB ${o.trackingNumber ? esc(o.trackingNumber) : "________________"}${o.courier ? ` · ${esc(o.courier)}` : ""}</div>
  </div>

  <div class="sec">
    <div class="h">${badge("05")}<b>CONTENTS</b></div>
    <div class="items">
      ${shown
        .map(
          (i) =>
            `<div class="li"><span>${i.quantity} × ${esc(i.productName)}${i.size ? ` · ${esc(i.size)}` : ""}</span><span>${inr(
              i.price * i.quantity,
            )}</span></div>`,
        )
        .join("")}
      ${more > 0 ? `<div class="li"><span>+ ${more} more item${more === 1 ? "" : "s"}</span><span></span></div>` : ""}
      ${o.discountAmount > 0 ? `<div class="li"><span>Discount${o.discountCode ? ` (${esc(o.discountCode)})` : ""}</span><span>−${inr(o.discountAmount)}</span></div>` : ""}
      <div class="tot"><span>Total</span><span>${inr(o.total)}</span></div>
    </div>
  </div>

  <div class="sec">
    <div class="h">${badge("06")}<b>RETURN TO</b></div>
    <div class="ret"><strong>${esc(STORE.name)}</strong>${ret ? ` · ${ret}` : ""}<br>${esc(STORE.email)} · Ordered ${date(o.createdAt)}</div>
  </div>

  <div class="strip">
    <div>${ICON.up} THIS SIDE UP</div>
    <div>${ICON.fragile} FRAGILE</div>
    <div>${ICON.dry} KEEP DRY</div>
  </div>
</div></section>`;
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
