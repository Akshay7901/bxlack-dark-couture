/**
 * BXLACK transactional email templates, in the dark design from the
 * "Bxlack Email Templates" canvas: black ground, #111 card with a hairline
 * border, logo + uppercase label header, Space Grotesk headlines, grey body
 * copy, white buttons. Pure functions (no I/O) returning subject, HTML and
 * plain-text bodies, so they render the same in the sender and the preview.
 *
 * Email HTML is deliberately old-school: tables, inline styles and fallback
 * fonts, because Gmail/Outlook strip <style> blocks, flexbox, grid and most
 * web fonts (Space Grotesk/Inter load in Apple Mail; others fall back to Arial).
 */
import { SITE_URL } from "@/lib/seo";
import { PACKING_TUBE_CHARGE, RETURN_WINDOW_DAYS } from "@/lib/returns";
import { fillHtml, fillText, resolveCopy, type TemplateCopy, type TemplateId } from "@/lib/email/copy";

export type Email = { subject: string; html: string; text: string };

export type EmailOrderItem = {
  name: string;
  size: string | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
};

export type EmailOrder = {
  orderNumber: number;
  createdAt?: string;
  customerName: string | null;
  customerEmail: string;
  phone: string | null;
  items: EmailOrderItem[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  address: string[];
  courier?: string | null;
  trackingNumber?: string | null;
  deliveredAt?: string | null;
};

export type EmailReturn = {
  orderNumber: number;
  type: string;
  status: string;
  reason: string;
  details: string | null;
  note: string | null;
  items: { productName: string; size: string | null; quantity: number; exchangeSize: string | null }[];
  customerName: string | null;
  customerEmail: string;
};

export type EmailContact = {
  name: string;
  email: string;
  orderNumber: string | null;
  message: string;
};

// ---------------------------------------------------------------------------
// Design tokens (from the canvas)
// ---------------------------------------------------------------------------

const C = {
  ground: "#000000",
  card: "#111111",
  panel: "#0A0A0A",
  thumb: "#1C1C1C",
  border: "#262626",
  track: "#333333",
  text: "#F5F5F5",
  muted: "#A1A1A1",
  faint: "#8A8A8A",
  accent: "#FFFFFF",
};
const BODY = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const DISPLAY = "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LOGO_URL = `${SITE_URL}/email-signature.png`;

export const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const paymentLabel = (m: string) => (m === "cod" ? "Cash on delivery" : m);
const dateLabel = (iso?: string | null) =>
  new Date(iso ?? Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ---------------------------------------------------------------------------
// Building blocks — each returns one block with its own bottom spacing
// ---------------------------------------------------------------------------

const block = (html: string, gap = 28) => `<div style="margin:0 0 ${gap}px;">${html}</div>`;

const eyebrow = (text: string) =>
  `<span style="font-family:${BODY};font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${C.muted};">${esc(text)}</span>`;

/** Takes already-escaped HTML (from fillHtml), since both lines are editable copy. */
function heading(titleHtml: string, sub?: string) {
  return block(
    `<h1 style="margin:0 0 12px;font-family:${DISPLAY};font-weight:700;font-size:34px;line-height:1.1;letter-spacing:-0.5px;color:${C.text};">${titleHtml}</h1>` +
      (sub ? `<p style="margin:0;font-family:${BODY};font-size:16px;line-height:1.6;color:${C.muted};">${sub}</p>` : ""),
  );
}

const paragraph = (html: string, size = 16) =>
  block(`<p style="margin:0;font-family:${BODY};font-size:${size}px;line-height:1.6;color:${C.muted};">${html}</p>`, 20);

function button(text: string, href: string) {
  return block(
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.accent};border-radius:4px;">
<a href="${esc(href)}" style="display:inline-block;padding:16px 28px;font-family:${BODY};font-size:15px;font-weight:600;color:#000000;text-decoration:none;border-radius:4px;">${esc(text)}</a>
</td></tr></table>`,
  );
}

/** A row of label/value facts between hairlines (Order · Date · Payment). */
function facts(cells: [string, string][]) {
  const width = Math.floor(100 / cells.length);
  const tds = cells
    .map(
      ([k, v]) =>
        `<td width="${width}%" valign="top" style="padding:20px 8px 20px 0;">${eyebrow(k)}<br><span style="font-family:${BODY};font-size:14px;line-height:1.8;color:${C.text};">${esc(v)}</span></td>`,
    )
    .join("");
  return block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};"><tr>${tds}</tr></table>`,
  );
}

/** A dark inset panel, used for tracking details and notices. */
const panel = (html: string) =>
  block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.panel};border:1px solid ${C.border};border-radius:4px;padding:22px 24px;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.muted};">${html}</td></tr></table>`,
  );

function panelFacts(cells: [string, string][]) {
  const tds = cells
    .map(
      ([k, v], i) =>
        `<td valign="top" style="padding-right:12px;">${eyebrow(k)}<br><span style="font-family:${i === 0 ? DISPLAY : BODY};font-size:${i === 0 ? 18 : 14}px;font-weight:${i === 0 ? 700 : 400};line-height:1.8;color:${C.text};">${esc(v)}</span></td>`,
    )
    .join("");
  return panel(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${tds}</tr></table>`);
}

/** Ordered → Shipped → Out for delivery → Delivered, with `done` steps lit. */
function progress(done: number) {
  const steps = ["Ordered", "Shipped", "Out for delivery", "Delivered"];
  const bars = steps
    .map(
      (_, i) =>
        `<td width="25%" style="padding:0 ${i < 3 ? 6 : 0}px 0 0;"><div style="height:6px;line-height:6px;font-size:1px;border-radius:3px;background:${i < done ? C.accent : C.track};">&nbsp;</div></td>`,
    )
    .join("");
  const labels = steps
    .map(
      (s, i) =>
        `<td width="25%" valign="top" style="padding:10px 6px 0 0;font-family:${BODY};font-size:13px;line-height:1.4;color:${i < done ? C.text : C.faint};${i === done - 1 ? "font-weight:600;" : ""}">${s}</td>`,
    )
    .join("");
  return block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${bars}</tr><tr>${labels}</tr></table>`,
  );
}

function thumb(url?: string | null) {
  return url
    ? `<img src="${esc(url)}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;object-fit:cover;border:1px solid ${C.border};border-radius:4px;background:${C.thumb};">`
    : `<div style="width:72px;height:72px;background:${C.thumb};border:1px solid ${C.border};border-radius:4px;"></div>`;
}

function itemsList(items: EmailOrderItem[], showPrice = true) {
  const rows = items
    .map(
      (i) => `<tr>
<td width="88" valign="middle" style="padding:0 16px 16px 0;">${thumb(i.imageUrl)}</td>
<td valign="middle" style="padding:0 0 16px;font-family:${BODY};"><strong style="font-size:15px;font-weight:600;color:${C.text};">${esc(i.name)}</strong><br><span style="font-size:13px;line-height:1.8;color:${C.muted};">${i.size ? `Size ${esc(i.size)} · ` : ""}Qty ${i.quantity}</span></td>
${showPrice ? `<td align="right" valign="middle" style="padding:0 0 16px 12px;font-family:${BODY};font-size:15px;color:${C.text};white-space:nowrap;">${inr(i.price * i.quantity)}</td>` : ""}
</tr>`,
    )
    .join("");
  return block(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`, 12);
}

function totals(o: EmailOrder) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:5px 0;font-family:${BODY};font-size:14px;color:${C.muted};">${esc(k)}</td><td align="right" style="padding:5px 0;font-family:${BODY};font-size:14px;color:${C.muted};">${esc(v)}</td></tr>`;
  return block(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.border};">
<tr><td colspan="2" style="height:14px;line-height:14px;font-size:1px;">&nbsp;</td></tr>
${row("Subtotal", inr(o.subtotal))}
${o.discountAmount > 0 ? row(`Discount${o.discountCode ? ` (${o.discountCode})` : ""}`, `−${inr(o.discountAmount)}`) : ""}
${row("Shipping", "Free")}
<tr><td style="padding:14px 0 0;border-top:1px solid ${C.border};font-family:${BODY};font-size:18px;font-weight:600;color:${C.text};">Total</td><td align="right" style="padding:14px 0 0;border-top:1px solid ${C.border};font-family:${BODY};font-size:18px;font-weight:600;color:${C.text};">${inr(o.total)}</td></tr>
</table>`,
  );
}

function addressBlock(title: string, o: EmailOrder) {
  return block(
    `${eyebrow(title)}<p style="margin:6px 0 0;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.text};">${[o.customerName, ...o.address, o.phone].filter(Boolean).map(esc).join("<br>")}</p>`,
  );
}

/** Shared frame: hidden preheader, logo + label header, body, centred footer. */
function layout({ preheader, tag, body, footerNote }: { preheader: string; tag: string; body: string; footerNote: string }) {
  const link = (text: string, path: string) =>
    `<a href="${SITE_URL}${path}" style="color:${C.muted};text-decoration:underline;">${text}</a>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Space+Grotesk:wght@500;700&amp;display=swap">
<title>BXLACK</title></head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground};"><tr><td align="center" style="padding:40px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="padding:28px 40px;border-bottom:1px solid ${C.border};"><a href="${SITE_URL}"><img src="${LOGO_URL}" width="111" height="44" alt="BXLACK" style="display:block;width:111px;height:44px;border:0;"></a></td>
<td align="right" style="padding:28px 40px;border-bottom:1px solid ${C.border};">${eyebrow(tag)}</td>
</tr>
<tr><td colspan="2" style="padding:48px 40px 20px;">${body}</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:24px 8px 0;font-family:${BODY};font-size:12px;line-height:1.7;color:${C.faint};">
<p style="margin:0 0 10px;">${footerNote}</p>
<p style="margin:0;">© ${new Date().getFullYear()} BXLACK · ${link("Shop", "/shop")} · ${link("Returns", "/returns")} · ${link("Contact", "/contact")} · ${link("Privacy", "/privacy")}</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

const textFooter = `\n\n—\nBXLACK · ${SITE_URL}\nQuestions? Reply to this email or visit ${SITE_URL}/contact`;
const textItems = (items: EmailOrderItem[]) =>
  items.map((i) => `- ${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}: ${inr(i.price * i.quantity)}`).join("\n");

type Overrides = Partial<TemplateCopy> | null | undefined;

/** Resolves a template's wording (defaults + admin edits) and fills variables. */
function wording(id: TemplateId, overrides: Overrides, vars: Record<string, string>) {
  const c = resolveCopy(id, overrides);
  return {
    subject: fillText(c.subject, vars),
    headingHtml: fillHtml(c.heading, vars),
    headingText: fillText(c.heading, vars),
    introHtml: fillHtml(c.intro, vars),
    introText: fillText(c.intro, vars),
    button: fillText(c.button, vars),
    footerHtml: fillHtml(c.footer, vars),
  };
}

const orderVars = (o: EmailOrder) => ({
  first_name: o.customerName?.trim().split(/\s+/)[0] || "there",
  order_number: String(o.orderNumber),
  total: inr(o.total),
  tracking_number: o.trackingNumber ?? "",
  courier: o.courier ?? "",
  customer_name: o.customerName ?? "A customer",
  customer_email: o.customerEmail,
});

const returnVars = (r: EmailReturn) => ({
  first_name: r.customerName?.trim().split(/\s+/)[0] || "there",
  order_number: String(r.orderNumber),
  request_type: r.type === "exchange" ? "exchange" : "return",
  customer_name: r.customerName ?? "A customer",
  customer_email: r.customerEmail,
});

// ---------------------------------------------------------------------------
// Customer emails
// ---------------------------------------------------------------------------

export function orderConfirmationEmail(o: EmailOrder, overrides?: Overrides): Email {
  const w = wording("order-confirmed", overrides, orderVars(o));
  const body = [
    heading(w.headingHtml, w.introHtml),
    facts([
      ["Order", `#${o.orderNumber}`],
      ["Date", dateLabel(o.createdAt)],
      ["Payment", paymentLabel(o.paymentMethod)],
    ]),
    itemsList(o.items),
    totals(o),
    addressBlock("Shipping to", o),
    o.paymentMethod === "cod" ? paragraph(`Please keep <span style="color:${C.text};">${inr(o.total)}</span> ready at delivery.`, 14) : "",
    button(w.button, `${SITE_URL}/account`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: "Thanks for your order — here are the details.", tag: `Order #${o.orderNumber}`, body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}\n\n${textItems(o.items)}\n\nTotal: ${inr(o.total)} (${paymentLabel(o.paymentMethod)})\n\nShipping to:\n${[o.customerName, ...o.address].filter(Boolean).join("\n")}\n\nView your order: ${SITE_URL}/account${textFooter}`,
  };
}

export function orderShippedEmail(o: EmailOrder, overrides?: Overrides): Email {
  const w = wording("order-shipped", overrides, orderVars(o));
  const body = [
    heading(w.headingHtml, w.introHtml),
    progress(2),
    o.trackingNumber
      ? panelFacts([
          ["Tracking no.", o.trackingNumber],
          ["Carrier", o.courier || "Courier"],
        ])
      : panel("Tracking details will follow as soon as the courier confirms them."),
    addressBlock("Delivering to", o),
    itemsList(o.items, false),
    button(w.button, `${SITE_URL}/account`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({
      preheader: o.trackingNumber ? `Order #${o.orderNumber} has shipped — tracking ${o.trackingNumber}.` : `Order #${o.orderNumber} has shipped.`,
      tag: "Shipping",
      body,
      footerNote: w.footerHtml,
    }),
    text: `${w.headingText}\n\n${w.introText}${o.trackingNumber ? `\nTracking: ${o.trackingNumber}${o.courier ? ` (${o.courier})` : ""}` : ""}\n\n${textItems(o.items)}\n\nView your order: ${SITE_URL}/account${textFooter}`,
  };
}

export function orderDeliveredEmail(o: EmailOrder, overrides?: Overrides): Email {
  const delivered = o.deliveredAt ? new Date(o.deliveredAt) : new Date();
  const windowEnds = new Date(delivered.getTime() + RETURN_WINDOW_DAYS * 86_400_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  });
  const w = wording("order-delivered", overrides, { ...orderVars(o), return_deadline: windowEnds });
  const body = [
    heading(w.headingHtml, w.introHtml),
    progress(4),
    itemsList(o.items, false),
    panel(
      `<strong style="font-size:14px;font-weight:600;color:${C.text};">Not quite right?</strong><br>Request a return or exchange from your account until <span style="color:${C.text};">${esc(windowEnds)}</span>. Keep the brand tag and plastic seal attached and send it back in the original packing tube — ${inr(PACKING_TUBE_CHARGE)} is deducted if the tube is missing.`,
    ),
    button(w.button, `${SITE_URL}/account`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: `Delivered. Returns and exchanges are open until ${windowEnds}.`, tag: "Delivered", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}\n\nNeed a return or exchange? Request it from your account until ${windowEnds}: ${SITE_URL}/account\nKeep the tag and seal attached and return the original packing tube (${inr(PACKING_TUBE_CHARGE)} charge if missing).${textFooter}`,
  };
}

export function orderCancelledEmail(o: EmailOrder, overrides?: Overrides): Email {
  const w = wording("order-cancelled", overrides, orderVars(o));
  const body = [
    heading(w.headingHtml, w.introHtml),
    facts([
      ["Order", `#${o.orderNumber}`],
      ["Placed", dateLabel(o.createdAt)],
      ["Total", inr(o.total)],
    ]),
    itemsList(o.items),
    button(w.button, `${SITE_URL}/shop`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: `Order #${o.orderNumber} has been cancelled.`, tag: "Cancelled", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}\n\n${textItems(o.items)}${textFooter}`,
  };
}

const returnItems = (r: EmailReturn) =>
  itemsList(
    r.items.map((i) => ({
      name: i.exchangeSize ? `${i.productName} → size ${i.exchangeSize}` : i.productName,
      size: i.size,
      quantity: i.quantity,
      price: 0,
    })),
    false,
  );

const reasonBlock = (r: EmailReturn) =>
  block(
    `${eyebrow("Reason")}<p style="margin:6px 0 0;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.text};">${esc(r.reason)}${r.details ? `<br><span style="color:${C.muted};">${esc(r.details)}</span>` : ""}</p>`,
  );

export function returnReceivedEmail(r: EmailReturn, overrides?: Overrides): Email {
  const w = wording("return-received", overrides, returnVars(r));
  const body = [
    heading(w.headingHtml, w.introHtml),
    returnItems(r),
    reasonBlock(r),
    panel(
      `<strong style="font-size:14px;font-weight:600;color:${C.text};">Until pickup</strong><br>Keep the piece unworn with the brand tag and plastic seal attached, packed in its original tube. ${inr(PACKING_TUBE_CHARGE)} is deducted if the tube is missing.`,
    ),
    button(w.button, `${SITE_URL}/account`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({
      preheader: `Your ${r.type} request for order #${r.orderNumber} is being reviewed.`,
      tag: r.type === "exchange" ? "Exchange" : "Return",
      body,
      footerNote: w.footerHtml,
    }),
    text: `${w.headingText}\n\n${w.introText}\n\nReason: ${r.reason}\n\nKeep the tag and seal attached and pack it in the original tube.${textFooter}`,
  };
}

const RETURN_TEMPLATE: Record<string, TemplateId> = {
  approved: "return-approved",
  rejected: "return-rejected",
  picked_up: "return-picked-up",
  completed: "return-completed",
};

/** The template a return/exchange status change sends, if any. */
export const returnTemplateFor = (status: string): TemplateId | null => RETURN_TEMPLATE[status] ?? null;

export function returnUpdateEmail(r: EmailReturn, overrides?: Overrides): Email {
  const id = returnTemplateFor(r.status) ?? "return-approved";
  const w = wording(id, overrides, returnVars(r));
  const body = [
    heading(w.headingHtml, w.introHtml),
    r.note ? panel(`${eyebrow("Note from BXLACK")}<br><span style="color:${C.text};">${esc(r.note)}</span>`) : "",
    returnItems(r),
    button(w.button, `${SITE_URL}/account`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: w.introText.slice(0, 110), tag: `Order #${r.orderNumber}`, body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}${r.note ? `\n\nNote from BXLACK: ${r.note}` : ""}\n\n${SITE_URL}/account${textFooter}`,
  };
}

/** Auto-reply to the contact form. The form is public and anyone can type any
 * address into it, so this deliberately repeats none of what was submitted —
 * otherwise it could be abused to send arbitrary text from our domain. */
export function contactReceivedEmail(overrides?: Overrides): Email {
  const w = wording("contact-received", overrides, {});
  const body = [heading(w.headingHtml, w.introHtml), button(w.button, `${SITE_URL}/faq`)].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: "A member of our team will reply shortly.", tag: "Client services", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}${textFooter}`,
  };
}

// ---------------------------------------------------------------------------
// Supabase Auth templates — pasted into Supabase → Authentication → Email
// Templates. Supabase substitutes {{ .ConfirmationURL }} when sending.
// ---------------------------------------------------------------------------

const CONFIRMATION_URL = "{{ .ConfirmationURL }}";

export function authConfirmSignupEmail(overrides?: Overrides): Email {
  const w = wording("confirm-signup", overrides, {});
  const body = [heading(w.headingHtml, w.introHtml), button(w.button, CONFIRMATION_URL)].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: "Confirm your email to finish setting up.", tag: "Verification", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}\n\n${CONFIRMATION_URL}`,
  };
}

export function authResetPasswordEmail(overrides?: Overrides): Email {
  const w = wording("reset-password", overrides, {});
  const body = [
    heading(w.headingHtml, w.introHtml),
    button(w.button, CONFIRMATION_URL),
    panel(
      `<strong style="font-size:14px;font-weight:600;color:${C.text};">Didn't ask for this?</strong><br>Your password hasn't changed. You can ignore this email, or <a href="${SITE_URL}/contact" style="color:${C.text};">contact us</a> if you think someone is trying to access your account.`,
    ),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: "Use this link to choose a new password.", tag: "Security", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n\n${w.introText}\n\n${CONFIRMATION_URL}\n\nDidn't ask for this? Ignore this email and your password stays the same.`,
  };
}

// ---------------------------------------------------------------------------
// Admin alerts
// ---------------------------------------------------------------------------

const studio = `${SITE_URL}/admin`;

export function adminNewOrderEmail(o: EmailOrder, overrides?: Overrides): Email {
  const w = wording("admin-new-order", overrides, orderVars(o));
  const body = [
    heading(w.headingHtml, w.introHtml),
    facts([
      ["Order", `#${o.orderNumber}`],
      ["Items", String(o.items.reduce((n, i) => n + i.quantity, 0))],
      ["Payment", paymentLabel(o.paymentMethod)],
    ]),
    itemsList(o.items),
    totals(o),
    addressBlock("Ship to", o),
    button(w.button, studio),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: `${o.customerName ?? o.customerEmail} · ${o.items.length} item(s)`, tag: "New order", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n${w.introText}\n\n${textItems(o.items)}\n\n${studio}`,
  };
}

export function adminNewReturnEmail(r: EmailReturn, overrides?: Overrides): Email {
  const w = wording("admin-new-return", overrides, returnVars(r));
  const body = [heading(w.headingHtml, w.introHtml), returnItems(r), reasonBlock(r), button(w.button, studio)].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: `${r.customerName ?? r.customerEmail}: ${r.reason}`, tag: "Returns", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n${w.introText}\nReason: ${r.reason}${r.details ? `\n${r.details}` : ""}\n\n${studio}`,
  };
}

export function adminNewMessageEmail(c: EmailContact, overrides?: Overrides): Email {
  const w = wording("admin-new-message", overrides, { sender_name: c.name, sender_email: c.email });
  const body = [
    heading(w.headingHtml, w.introHtml + (c.orderNumber ? ` · Order ${esc(c.orderNumber)}` : "")),
    panel(`<span style="white-space:pre-wrap;color:${C.text};">${esc(c.message)}</span>`),
    button(w.button, `mailto:${c.email}`),
  ].join("");
  return {
    subject: w.subject,
    html: layout({ preheader: c.message.slice(0, 90), tag: "Message", body, footerNote: w.footerHtml }),
    text: `${w.headingText}\n${w.introText}${c.orderNumber ? ` (order ${c.orderNumber})` : ""}\n\n${c.message}`,
  };
}
