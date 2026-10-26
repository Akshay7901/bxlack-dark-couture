/**
 * BXLACK transactional email templates. Pure functions (no I/O) that return
 * subject, HTML and plain-text bodies, so they can be rendered anywhere —
 * the mail sender, and the design preview.
 *
 * Email HTML is deliberately old-school: tables, inline styles and web-safe
 * fonts, because Gmail/Outlook strip <style> blocks, flexbox and web fonts.
 */
import { SITE_URL } from "@/lib/seo";
import { PACKING_TUBE_CHARGE, RETURN_WINDOW_DAYS } from "@/lib/returns";

export type Email = { subject: string; html: string; text: string };

export type EmailOrderItem = { name: string; size: string | null; quantity: number; price: number };

export type EmailOrder = {
  orderNumber: number;
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
// Building blocks
// ---------------------------------------------------------------------------

const FONT = "Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";
const INK = "#0a0a0a";
const MUTED = "#6b6b6b";
const RULE = "#e6e6e3";

export const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const firstName = (name: string | null) => (name?.trim().split(/\s+/)[0] || "there");
const paymentLabel = (m: string) => (m === "cod" ? "Cash on delivery" : m);

function label(text: string) {
  return `<p style="margin:0 0 8px;font-family:${FONT};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">${esc(text)}</p>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.5px;text-transform:uppercase;color:${INK};">${esc(text)}</h1>`;
}

function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:#333333;">${html}</p>`;
}

function button(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:${INK};">
<a href="${esc(href)}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${esc(text)}</a>
</td></tr></table>`;
}

function divider() {
  return `<div style="height:1px;background:${RULE};margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>`;
}

function box(html: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#f7f7f5;border:1px solid ${RULE};padding:18px 20px;font-family:${FONT};font-size:14px;line-height:1.6;color:#333333;">${html}</td></tr></table>`;
}

function itemsTable(items: EmailOrderItem[], showPrice = true) {
  const rows = items
    .map(
      (i) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid ${RULE};font-family:${FONT};font-size:14px;color:${INK};">${esc(i.name)}<br><span style="font-size:12px;color:${MUTED};">${i.size ? `Size ${esc(i.size)} · ` : ""}Qty ${i.quantity}</span></td>
${showPrice ? `<td align="right" style="padding:12px 0;border-bottom:1px solid ${RULE};font-family:${MONO};font-size:13px;color:${INK};white-space:nowrap;">${inr(i.price * i.quantity)}</td>` : ""}
</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function totals(o: EmailOrder) {
  const line = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-family:${FONT};font-size:${strong ? 15 : 13}px;color:${strong ? INK : MUTED};${strong ? "font-weight:700;" : ""}">${esc(k)}</td><td align="right" style="padding:4px 0;font-family:${MONO};font-size:${strong ? 15 : 13}px;color:${INK};${strong ? "font-weight:700;" : ""}">${esc(v)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
${line("Subtotal", inr(o.subtotal))}
${o.discountAmount > 0 ? line(`Discount${o.discountCode ? ` (${o.discountCode})` : ""}`, `−${inr(o.discountAmount)}`) : ""}
${line("Total", inr(o.total), true)}
</table>`;
}

function addressBlock(o: EmailOrder) {
  return `${label("Shipping to")}<p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.6;color:#333333;">${[o.customerName, ...o.address, o.phone].filter(Boolean).map(esc).join("<br>")}</p>`;
}

/** The shared frame: preheader, black wordmark header, white body, footer. */
function layout({ preheader, body }: { preheader: string; body: string }) {
  const link = (text: string, path: string) =>
    `<a href="${SITE_URL}${path}" style="color:${MUTED};text-decoration:underline;">${text}</a>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>BXLACK</title></head>
<body style="margin:0;padding:0;background:#efefec;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efefec;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td align="center" style="background:${INK};padding:30px 24px;">
<a href="${SITE_URL}" style="font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:10px;color:#ffffff;text-decoration:none;">BXLACK</a>
</td></tr>
<tr><td style="background:#ffffff;padding:40px 36px 28px;">${body}</td></tr>
<tr><td align="center" style="padding:28px 24px;font-family:${FONT};font-size:11px;line-height:1.8;color:${MUTED};">
<p style="margin:0 0 6px;letter-spacing:4px;text-transform:uppercase;color:${INK};">Absence of noise</p>
<p style="margin:0 0 6px;">${link("Shop", "/shop")} &nbsp;·&nbsp; ${link("Shipping", "/shipping")} &nbsp;·&nbsp; ${link("Returns", "/returns")} &nbsp;·&nbsp; ${link("Contact", "/contact")}</p>
<p style="margin:0;">You're receiving this email about your BXLACK account or order.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

const textFooter = `\n\n—\nBXLACK · ${SITE_URL}\nQuestions? Reply to this email or visit ${SITE_URL}/contact`;

function textItems(items: EmailOrderItem[]) {
  return items
    .map((i) => `- ${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}: ${inr(i.price * i.quantity)}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Customer emails
// ---------------------------------------------------------------------------

export function orderConfirmationEmail(o: EmailOrder): Email {
  const body = [
    label(`Order #${o.orderNumber}`),
    heading("Your order is confirmed"),
    paragraph(`Thank you, ${esc(firstName(o.customerName))}. We've received your order and are preparing it. We'll email you again the moment it ships.`),
    button("View your order", `${SITE_URL}/account`),
    itemsTable(o.items),
    totals(o),
    divider(),
    addressBlock(o),
    label("Payment"),
    paragraph(esc(paymentLabel(o.paymentMethod)) + (o.paymentMethod === "cod" ? ` — please keep ${inr(o.total)} ready at delivery.` : "")),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} confirmed`,
    html: layout({ preheader: `Thanks for your order. Total ${inr(o.total)}.`, body }),
    text: `Your order #${o.orderNumber} is confirmed.\n\n${textItems(o.items)}\n\nTotal: ${inr(o.total)} (${paymentLabel(o.paymentMethod)})\n\nShipping to:\n${[o.customerName, ...o.address].filter(Boolean).join("\n")}\n\nView your order: ${SITE_URL}/account${textFooter}`,
  };
}

export function orderShippedEmail(o: EmailOrder): Email {
  const tracking = o.trackingNumber
    ? box(`${label("Tracking")}<span style="font-family:${MONO};font-size:15px;color:${INK};">${esc(o.trackingNumber)}</span>${o.courier ? `<br><span style="color:${MUTED};font-size:13px;">via ${esc(o.courier)}</span>` : ""}`)
    : paragraph("Tracking details will be shared as soon as the courier confirms them.");
  const body = [
    label(`Order #${o.orderNumber}`),
    heading("It's on its way"),
    paragraph(`Good news, ${esc(firstName(o.customerName))} — your order has left the studio.`),
    tracking,
    button("View your order", `${SITE_URL}/account`),
    itemsTable(o.items),
    divider(),
    addressBlock(o),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} has shipped`,
    html: layout({ preheader: o.trackingNumber ? `Tracking: ${o.trackingNumber}` : "Your BXLACK order is on its way.", body }),
    text: `Your order #${o.orderNumber} has shipped.${o.trackingNumber ? `\nTracking: ${o.trackingNumber}${o.courier ? ` (${o.courier})` : ""}` : ""}\n\n${textItems(o.items)}\n\nView your order: ${SITE_URL}/account${textFooter}`,
  };
}

export function orderDeliveredEmail(o: EmailOrder): Email {
  const delivered = o.deliveredAt ? new Date(o.deliveredAt) : new Date();
  const windowEnds = new Date(delivered.getTime() + RETURN_WINDOW_DAYS * 86_400_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  });
  const body = [
    label(`Order #${o.orderNumber}`),
    heading("Delivered"),
    paragraph(`Your order has been delivered, ${esc(firstName(o.customerName))}. We hope it was worth the wait.`),
    itemsTable(o.items),
    divider(),
    box(`<strong style="color:${INK};">Not quite right?</strong><br>You can request a return or exchange from your account until <strong>${esc(windowEnds)}</strong>. Keep the brand tag and plastic seal attached and send it back in the original packing tube (a ${inr(PACKING_TUBE_CHARGE)} charge applies if the tube is missing).`),
    button("Return or exchange", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} delivered`,
    html: layout({ preheader: `Returns and exchanges are open until ${windowEnds}.`, body }),
    text: `Your order #${o.orderNumber} has been delivered.\n\nNeed a return or exchange? Request it from your account until ${windowEnds}: ${SITE_URL}/account\nKeep the tag and seal attached and return the original packing tube (${inr(PACKING_TUBE_CHARGE)} charge if missing).${textFooter}`,
  };
}

export function orderCancelledEmail(o: EmailOrder): Email {
  const body = [
    label(`Order #${o.orderNumber}`),
    heading("Your order is cancelled"),
    paragraph(`Order #${o.orderNumber} has been cancelled${o.paymentMethod === "cod" ? " — nothing was charged, since it was cash on delivery" : ""}. If this wasn't expected, reply to this email and we'll sort it out.`),
    itemsTable(o.items),
    totals(o),
    button("Continue shopping", `${SITE_URL}/shop`),
  ].join("");
  return {
    subject: `Order #${o.orderNumber} cancelled`,
    html: layout({ preheader: `Order #${o.orderNumber} has been cancelled.`, body }),
    text: `Order #${o.orderNumber} has been cancelled.\n\n${textItems(o.items)}\n\nIf this wasn't expected, reply to this email.${textFooter}`,
  };
}

function returnItemsTable(r: EmailReturn) {
  return itemsTable(
    r.items.map((i) => ({
      name: i.exchangeSize ? `${i.productName} → exchange for ${i.exchangeSize}` : i.productName,
      size: i.size,
      quantity: i.quantity,
      price: 0,
    })),
    false,
  );
}

export function returnReceivedEmail(r: EmailReturn): Email {
  const kind = r.type === "exchange" ? "exchange" : "return";
  const body = [
    label(`Order #${r.orderNumber}`),
    heading(`${kind === "exchange" ? "Exchange" : "Return"} request received`),
    paragraph(`Thanks, ${esc(firstName(r.customerName))}. We've received your ${kind} request and will review it within 1–2 business days. You'll get an email once it's approved, with pickup details.`),
    returnItemsTable(r),
    divider(),
    label("Reason"),
    paragraph(esc(r.reason) + (r.details ? `<br><span style="color:${MUTED};">${esc(r.details)}</span>` : "")),
    box(`Until pickup: keep the piece unworn with the brand tag and plastic seal attached, packed in its original tube (${inr(PACKING_TUBE_CHARGE)} is deducted if the tube is missing).`),
    button("View request", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `We've received your ${kind} request — order #${r.orderNumber}`,
    html: layout({ preheader: `Your ${kind} request for order #${r.orderNumber} is being reviewed.`, body }),
    text: `We've received your ${kind} request for order #${r.orderNumber} and will review it within 1–2 business days.\n\nReason: ${r.reason}\n\nKeep the tag and seal attached and pack it in the original tube.${textFooter}`,
  };
}

const RETURN_COPY: Record<string, { title: string; line: string }> = {
  approved: {
    title: "approved",
    line: "Your request is approved. Our courier partner will attempt pickup at your address — we'll attempt it twice. Please have the piece packed in its original tube with tag and seal attached.",
  },
  rejected: {
    title: "not approved",
    line: "Unfortunately we couldn't approve this request. See the note below for the reason, or reply to this email if you have questions.",
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
    label(`Order #${r.orderNumber}`),
    heading(`${kind} ${copy.title}`),
    paragraph(`Hi ${esc(firstName(r.customerName))}, ${copy.line.charAt(0).toLowerCase()}${copy.line.slice(1)}`),
    r.note ? box(`${label("Note from BXLACK")}${esc(r.note)}`) : "",
    returnItemsTable(r),
    button("View request", `${SITE_URL}/account`),
  ].join("");
  return {
    subject: `${kind} ${copy.title} — order #${r.orderNumber}`,
    html: layout({ preheader: `${kind} for order #${r.orderNumber}: ${copy.title}.`, body }),
    text: `${kind} ${copy.title} — order #${r.orderNumber}\n\n${copy.line}${r.note ? `\n\nNote from BXLACK: ${r.note}` : ""}\n\n${SITE_URL}/account${textFooter}`,
  };
}

/** Auto-reply to the contact form. The form is public and anyone can type any
 * address into it, so this deliberately repeats none of what was submitted —
 * otherwise it could be abused to send arbitrary text from our domain. */
export function contactReceivedEmail(): Email {
  const body = [
    label("Client services"),
    heading("We've got your message"),
    paragraph("Thanks for reaching out to BXLACK. A member of our team will reply to this address shortly."),
    paragraph(`In the meantime, our <a href="${SITE_URL}/faq" style="color:${INK};">FAQ</a> covers sizing, delivery and returns.`),
    paragraph(`<span style="color:${MUTED};font-size:13px;">Didn't contact us? You can safely ignore this email.</span>`),
  ].join("");
  return {
    subject: "We've received your message",
    html: layout({ preheader: "A member of our team will reply shortly.", body }),
    text: `Thanks for reaching out to BXLACK. We'll reply to this address shortly.\n\nDidn't contact us? You can safely ignore this email.${textFooter}`,
  };
}

// ---------------------------------------------------------------------------
// Supabase Auth templates — pasted into Supabase → Authentication → Email
// Templates. Supabase substitutes {{ .ConfirmationURL }} when sending.
// ---------------------------------------------------------------------------

const CONFIRMATION_URL = "{{ .ConfirmationURL }}";

export function authConfirmSignupEmail(): Email {
  const body = [
    label("Welcome"),
    heading("Confirm your email"),
    paragraph("Thanks for creating a BXLACK account. Confirm your email address to finish setting it up."),
    button("Confirm email", CONFIRMATION_URL),
    paragraph(`<span style="color:${MUTED};font-size:13px;">Didn't create an account? You can safely ignore this email.</span>`),
  ].join("");
  return {
    subject: "Confirm your BXLACK account",
    html: layout({ preheader: "One click to finish setting up your account.", body }),
    text: `Confirm your BXLACK account: ${CONFIRMATION_URL}`,
  };
}

export function authResetPasswordEmail(): Email {
  const body = [
    label("Account"),
    heading("Reset your password"),
    paragraph("We received a request to reset the password for your BXLACK account. Choose a new one below — the link expires in one hour."),
    button("Set a new password", CONFIRMATION_URL),
    paragraph(`<span style="color:${MUTED};font-size:13px;">Didn't ask for this? Ignore this email and your password stays the same.</span>`),
  ].join("");
  return {
    subject: "Reset your BXLACK password",
    html: layout({ preheader: "Choose a new password for your account.", body }),
    text: `Reset your BXLACK password: ${CONFIRMATION_URL}`,
  };
}

// ---------------------------------------------------------------------------
// Admin alerts
// ---------------------------------------------------------------------------

const studio = `${SITE_URL}/admin`;

export function adminNewOrderEmail(o: EmailOrder): Email {
  const body = [
    label("New order"),
    heading(`#${o.orderNumber} · ${inr(o.total)}`),
    paragraph(`${esc(o.customerName ?? "A customer")} (${esc(o.customerEmail)}) just placed an order — ${esc(paymentLabel(o.paymentMethod))}.`),
    itemsTable(o.items),
    totals(o),
    divider(),
    addressBlock(o),
    button("Open in Studio", studio),
  ].join("");
  return {
    subject: `New order #${o.orderNumber} — ${inr(o.total)}`,
    html: layout({ preheader: `${o.customerName ?? o.customerEmail} · ${o.items.length} item(s)`, body }),
    text: `New order #${o.orderNumber} — ${inr(o.total)}\n${o.customerName ?? ""} <${o.customerEmail}>\n\n${textItems(o.items)}\n\n${studio}`,
  };
}

export function adminNewReturnEmail(r: EmailReturn): Email {
  const body = [
    label(`New ${r.type} request`),
    heading(`Order #${r.orderNumber}`),
    paragraph(`${esc(r.customerName ?? "A customer")} (${esc(r.customerEmail)}) requested a ${esc(r.type)}.`),
    returnItemsTable(r),
    divider(),
    label("Reason"),
    paragraph(esc(r.reason) + (r.details ? `<br><span style="color:${MUTED};">${esc(r.details)}</span>` : "")),
    button("Review in Studio", studio),
  ].join("");
  return {
    subject: `New ${r.type} request — order #${r.orderNumber}`,
    html: layout({ preheader: `${r.customerName ?? r.customerEmail}: ${r.reason}`, body }),
    text: `New ${r.type} request for order #${r.orderNumber}\n${r.customerName ?? ""} <${r.customerEmail}>\nReason: ${r.reason}${r.details ? `\n${r.details}` : ""}\n\n${studio}`,
  };
}

export function adminNewMessageEmail(c: EmailContact): Email {
  const body = [
    label("New message"),
    heading(c.name),
    paragraph(`<a href="mailto:${esc(c.email)}" style="color:${INK};">${esc(c.email)}</a>${c.orderNumber ? ` · Order ${esc(c.orderNumber)}` : ""}`),
    box(`<span style="white-space:pre-wrap;">${esc(c.message)}</span>`),
    button("Reply by email", `mailto:${c.email}`),
  ].join("");
  return {
    subject: `New message from ${c.name}`,
    html: layout({ preheader: c.message.slice(0, 90), body }),
    text: `New message from ${c.name} <${c.email}>${c.orderNumber ? ` (order ${c.orderNumber})` : ""}\n\n${c.message}`,
  };
}
