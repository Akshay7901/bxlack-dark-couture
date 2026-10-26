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
const LOGO_URL = `${SITE_URL}/email-logo.png`;

export const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const firstName = (name: string | null) => esc(name?.trim().split(/\s+/)[0] || "there");
const paymentLabel = (m: string) => (m === "cod" ? "Cash on delivery" : m);
const dateLabel = (iso?: string | null) =>
  new Date(iso ?? Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ---------------------------------------------------------------------------
// Building blocks — each returns one block with its own bottom spacing
// ---------------------------------------------------------------------------

const block = (html: string, gap = 28) => `<div style="margin:0 0 ${gap}px;">${html}</div>`;

const eyebrow = (text: string) =>
  `<span style="font-family:${BODY};font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:${C.muted};">${esc(text)}</span>`;

function heading(text: string, sub?: string) {
  return block(
    `<h1 style="margin:0 0 12px;font-family:${DISPLAY};font-weight:700;font-size:34px;line-height:1.1;letter-spacing:-0.5px;color:${C.text};">${esc(text)}</h1>` +
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
<td style="padding:28px 40px;border-bottom:1px solid ${C.border};"><a href="${SITE_URL}"><img src="${LOGO_URL}" width="72" height="40" alt="BXLACK" style="display:block;height:40px;width:auto;border:0;"></a></td>
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

const helpNote = `Questions? <a href="${SITE_URL}/contact" style="color:${C.muted};">Contact us</a> or reply to this email.`;
const textFooter = `\n\n—\nBXLACK · ${SITE_URL}\nQuestions? Reply to this email or visit ${SITE_URL}/contact`;
const textItems = (items: EmailOrderItem[]) =>
  items.map((i) => `- ${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}: ${inr(i.price * i.quantity)}`).join("\n");

// ---------------------------------------------------------------------------
// Customer emails
// ---------------------------------------------------------------------------

export function orderConfirmationEmail(o: EmailOrder): Email {
  const body = [
    heading("Order confirmed", `Thanks, ${firstName(o.customerName)}. We're getting your order ready and will email you when it ships.`),
    facts([
      ["Order", `#${o.orderNumber}`],
      ["Date", dateLabel(o.createdAt)],
      ["Payment", paymentLabel(o.paymentMethod)],
    ]),
    itemsList(o.items),
    totals(o),
    addressBlock("Shipping to", o),
    o.paymentMethod === "cod" ? paragraph(`Please keep <span style="color:${C.text};">${inr(o.total)}</span> ready at delivery.`, 14) : "",
    button("View order", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} confirmed`,
    html: layout({
      preheader: "Thanks for your order — here are the details.",
      tag: `Order #${o.orderNumber}`,
      body,
      footerNote: `Need to change something? <a href="${SITE_URL}/contact" style="color:${C.muted};">Contact us</a> before your order ships.`,
    }),
    text: `Order #${o.orderNumber} confirmed.\n\n${textItems(o.items)}\n\nTotal: ${inr(o.total)} (${paymentLabel(o.paymentMethod)})\n\nShipping to:\n${[o.customerName, ...o.address].filter(Boolean).join("\n")}\n\nView your order: ${SITE_URL}/account${textFooter}`,
  };
}

export function orderShippedEmail(o: EmailOrder): Email {
  const body = [
    heading("Your order is on its way", `Good news, ${firstName(o.customerName)} — order #${o.orderNumber} has left the studio and is headed to you.`),
    progress(2),
    o.trackingNumber
      ? panelFacts([
          ["Tracking no.", o.trackingNumber],
          ["Carrier", o.courier || "Courier"],
        ])
      : panel("Tracking details will follow as soon as the courier confirms them."),
    addressBlock("Delivering to", o),
    itemsList(o.items, false),
    button("View order", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} has shipped`,
    html: layout({
      preheader: o.trackingNumber ? `Order #${o.orderNumber} has shipped — tracking ${o.trackingNumber}.` : `Order #${o.orderNumber} has shipped.`,
      tag: "Shipping",
      body,
      footerNote: helpNote,
    }),
    text: `Order #${o.orderNumber} has shipped.${o.trackingNumber ? `\nTracking: ${o.trackingNumber}${o.courier ? ` (${o.courier})` : ""}` : ""}\n\n${textItems(o.items)}\n\nView your order: ${SITE_URL}/account${textFooter}`,
  };
}

export function orderDeliveredEmail(o: EmailOrder): Email {
  const delivered = o.deliveredAt ? new Date(o.deliveredAt) : new Date();
  const windowEnds = new Date(delivered.getTime() + RETURN_WINDOW_DAYS * 86_400_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  });
  const body = [
    heading("Delivered", `Order #${o.orderNumber} has arrived, ${firstName(o.customerName)}. We hope it was worth the wait.`),
    progress(4),
    itemsList(o.items, false),
    panel(
      `<strong style="font-size:14px;font-weight:600;color:${C.text};">Not quite right?</strong><br>Request a return or exchange from your account until <span style="color:${C.text};">${esc(windowEnds)}</span>. Keep the brand tag and plastic seal attached and send it back in the original packing tube — ${inr(PACKING_TUBE_CHARGE)} is deducted if the tube is missing.`,
    ),
    button("Return or exchange", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} delivered`,
    html: layout({
      preheader: `Delivered. Returns and exchanges are open until ${windowEnds}.`,
      tag: "Delivered",
      body,
      footerNote: helpNote,
    }),
    text: `Order #${o.orderNumber} has been delivered.\n\nNeed a return or exchange? Request it from your account until ${windowEnds}: ${SITE_URL}/account\nKeep the tag and seal attached and return the original packing tube (${inr(PACKING_TUBE_CHARGE)} charge if missing).${textFooter}`,
  };
}

export function orderCancelledEmail(o: EmailOrder): Email {
  const body = [
    heading(
      "Order cancelled",
      `Order #${o.orderNumber} has been cancelled${o.paymentMethod === "cod" ? ". Nothing was charged, since it was cash on delivery" : ""}.`,
    ),
    facts([
      ["Order", `#${o.orderNumber}`],
      ["Placed", dateLabel(o.createdAt)],
      ["Total", inr(o.total)],
    ]),
    itemsList(o.items),
    paragraph("If this wasn't expected, reply to this email and we'll sort it out.", 14),
    button("Continue shopping", `${SITE_URL}/shop`),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} cancelled`,
    html: layout({ preheader: `Order #${o.orderNumber} has been cancelled.`, tag: "Cancelled", body, footerNote: helpNote }),
    text: `Order #${o.orderNumber} has been cancelled.\n\n${textItems(o.items)}\n\nIf this wasn't expected, reply to this email.${textFooter}`,
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

export function returnReceivedEmail(r: EmailReturn): Email {
  const kind = r.type === "exchange" ? "exchange" : "return";
  const body = [
    heading(
      `${kind === "exchange" ? "Exchange" : "Return"} requested`,
      `Thanks, ${firstName(r.customerName)}. We'll review your ${kind} for order #${r.orderNumber} within 1–2 business days and email you once it's approved, with pickup details.`,
    ),
    returnItems(r),
    reasonBlock(r),
    panel(
      `<strong style="font-size:14px;font-weight:600;color:${C.text};">Until pickup</strong><br>Keep the piece unworn with the brand tag and plastic seal attached, packed in its original tube. ${inr(PACKING_TUBE_CHARGE)} is deducted if the tube is missing.`,
    ),
    button("View request", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `We've received your ${kind} request — order #${r.orderNumber}`,
    html: layout({
      preheader: `Your ${kind} request for order #${r.orderNumber} is being reviewed.`,
      tag: kind === "exchange" ? "Exchange" : "Return",
      body,
      footerNote: helpNote,
    }),
    text: `We've received your ${kind} request for order #${r.orderNumber} and will review it within 1–2 business days.\n\nReason: ${r.reason}\n\nKeep the tag and seal attached and pack it in the original tube.${textFooter}`,
  };
}

const RETURN_COPY: Record<string, { title: string; line: string }> = {
  approved: {
    title: "approved",
    line: "Your request is approved. Our courier partner will attempt pickup at your address twice — please have the piece packed in its original tube with tag and seal attached.",
  },
  rejected: {
    title: "not approved",
    line: "We couldn't approve this request. The note below explains why — reply to this email if you have questions.",
  },
  picked_up: {
    title: "picked up",
    line: "The courier has collected your piece. We'll inspect it as soon as it reaches the studio.",
  },
  completed: {
    title: "completed",
    line: "All done. Refunds typically reach your original payment method within 3–5 business days; exchanges ship out separately.",
  },
};

export function returnUpdateEmail(r: EmailReturn): Email {
  const kind = r.type === "exchange" ? "Exchange" : "Return";
  const copy = RETURN_COPY[r.status] ?? { title: "updated", line: "There's an update on your request." };
  const body = [
    heading(`${kind} ${copy.title}`, `Hi ${firstName(r.customerName)}. ${esc(copy.line)}`),
    r.note ? panel(`${eyebrow("Note from BXLACK")}<br><span style="color:${C.text};">${esc(r.note)}</span>`) : "",
    returnItems(r),
    button("View request", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `${kind} ${copy.title} — order #${r.orderNumber}`,
    html: layout({
      preheader: `${kind} for order #${r.orderNumber}: ${copy.title}.`,
      tag: `Order #${r.orderNumber}`,
      body,
      footerNote: helpNote,
    }),
    text: `${kind} ${copy.title} — order #${r.orderNumber}\n\n${copy.line}${r.note ? `\n\nNote from BXLACK: ${r.note}` : ""}\n\n${SITE_URL}/account${textFooter}`,
  };
}

/** Auto-reply to the contact form. The form is public and anyone can type any
 * address into it, so this deliberately repeats none of what was submitted —
 * otherwise it could be abused to send arbitrary text from our domain. */
export function contactReceivedEmail(): Email {
  const body = [
    heading("We've got your message", "Thanks for reaching out to BXLACK. A member of our team will reply to this address shortly."),
    paragraph(`In the meantime, our <a href="${SITE_URL}/faq" style="color:${C.text};">FAQ</a> covers sizing, delivery and returns.`),
    button("Visit the FAQ", `${SITE_URL}/faq`),
  ].join("");
  return {
    subject: "We've received your message",
    html: layout({
      preheader: "A member of our team will reply shortly.",
      tag: "Client services",
      body,
      footerNote: "Didn't contact us? You can safely ignore this email.",
    }),
    text: `Thanks for reaching out to BXLACK. We'll reply to this address shortly.\n\nDidn't contact us? You can safely ignore this email.${textFooter}`,
  };
}

// ---------------------------------------------------------------------------
// Supabase Auth templates — pasted into Supabase → Authentication → Email
// Templates. Supabase substitutes {{ .ConfirmationURL }} when sending.
// ---------------------------------------------------------------------------

const CONFIRMATION_URL = "{{ .ConfirmationURL }}";
const securityNote = "This is an automated security message from BXLACK.";

export function authConfirmSignupEmail(): Email {
  const body = [
    heading("Confirm your email", "Tap the button below to confirm this address belongs to you and finish setting up your BXLACK account."),
    button("Verify email", CONFIRMATION_URL),
    paragraph("If you didn't create a BXLACK account, you can ignore this email.", 14),
  ].join("");
  return {
    subject: "Confirm your BXLACK account",
    html: layout({ preheader: "Confirm your email to finish setting up.", tag: "Verification", body, footerNote: securityNote }),
    text: `Confirm your BXLACK account: ${CONFIRMATION_URL}`,
  };
}

export function authResetPasswordEmail(): Email {
  const body = [
    heading("Reset your password", "We got a request to reset the password for your BXLACK account. Choose a new one using the button below."),
    button("Set new password", CONFIRMATION_URL),
    paragraph("This link expires in one hour and can only be used once.", 14),
    panel(
      `<strong style="font-size:14px;font-weight:600;color:${C.text};">Didn't ask for this?</strong><br>Your password hasn't changed. You can ignore this email, or <a href="${SITE_URL}/contact" style="color:${C.text};">contact us</a> if you think someone is trying to access your account.`,
    ),
  ].join("");
  return {
    subject: "Reset your BXLACK password",
    html: layout({ preheader: "Use this link to choose a new password.", tag: "Security", body, footerNote: securityNote }),
    text: `Reset your BXLACK password: ${CONFIRMATION_URL}\n\nDidn't ask for this? Ignore this email and your password stays the same.`,
  };
}

// ---------------------------------------------------------------------------
// Admin alerts
// ---------------------------------------------------------------------------

const studio = `${SITE_URL}/admin`;
const alertNote = "Store alert from your BXLACK studio.";

export function adminNewOrderEmail(o: EmailOrder): Email {
  const body = [
    heading(`New order · ${inr(o.total)}`, `${esc(o.customerName ?? "A customer")} (${esc(o.customerEmail)}) just placed order #${o.orderNumber}.`),
    facts([
      ["Order", `#${o.orderNumber}`],
      ["Items", String(o.items.reduce((n, i) => n + i.quantity, 0))],
      ["Payment", paymentLabel(o.paymentMethod)],
    ]),
    itemsList(o.items),
    totals(o),
    addressBlock("Ship to", o),
    button("Open in Studio", studio),
  ].join("");
  return {
    subject: `New order #${o.orderNumber} — ${inr(o.total)}`,
    html: layout({ preheader: `${o.customerName ?? o.customerEmail} · ${o.items.length} item(s)`, tag: "New order", body, footerNote: alertNote }),
    text: `New order #${o.orderNumber} — ${inr(o.total)}\n${o.customerName ?? ""} <${o.customerEmail}>\n\n${textItems(o.items)}\n\n${studio}`,
  };
}

export function adminNewReturnEmail(r: EmailReturn): Email {
  const body = [
    heading(`New ${r.type} request`, `${esc(r.customerName ?? "A customer")} (${esc(r.customerEmail)}) requested a ${esc(r.type)} for order #${r.orderNumber}.`),
    returnItems(r),
    reasonBlock(r),
    button("Review in Studio", studio),
  ].join("");
  return {
    subject: `New ${r.type} request — order #${r.orderNumber}`,
    html: layout({ preheader: `${r.customerName ?? r.customerEmail}: ${r.reason}`, tag: "Returns", body, footerNote: alertNote }),
    text: `New ${r.type} request for order #${r.orderNumber}\n${r.customerName ?? ""} <${r.customerEmail}>\nReason: ${r.reason}${r.details ? `\n${r.details}` : ""}\n\n${studio}`,
  };
}

export function adminNewMessageEmail(c: EmailContact): Email {
  const body = [
    heading(`Message from ${c.name}`, `<a href="mailto:${esc(c.email)}" style="color:${C.text};">${esc(c.email)}</a>${c.orderNumber ? ` · Order ${esc(c.orderNumber)}` : ""}`),
    panel(`<span style="white-space:pre-wrap;color:${C.text};">${esc(c.message)}</span>`),
    button("Reply by email", `mailto:${c.email}`),
  ].join("");
  return {
    subject: `New message from ${c.name}`,
    html: layout({ preheader: c.message.slice(0, 90), tag: "Message", body, footerNote: alertNote }),
    text: `New message from ${c.name} <${c.email}>${c.orderNumber ? ` (order ${c.orderNumber})` : ""}\n\n${c.message}`,
  };
}
