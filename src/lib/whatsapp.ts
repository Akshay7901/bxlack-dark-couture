/**
 * WhatsApp click-to-chat: ready-written messages opened in WhatsApp (app or
 * Web) for a person to review and send. No API or approval needed. When the
 * WhatsApp Business API is connected later, these same templates can be sent
 * automatically.
 */
import { SITE_URL } from "@/lib/seo";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";

/** Digits-only international number for wa.me, assuming India (+91) when no
 * country code is given. Returns null when the number isn't usable. */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export function whatsAppLink(phone: string | null | undefined, text: string): string | null {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}

export type WhatsAppContext = {
  name?: string | null;
  orderNumber?: number | null;
  total?: number | null;
  paymentMethod?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  items?: string[];
  requestType?: string | null;
  exchangeSizes?: string | null;
};

export type WhatsAppTemplate = {
  id: string;
  label: string;
  /** Which screens offer it. */
  for: ("order" | "return" | "customer")[];
  build: (c: WhatsAppContext) => string;
};

const first = (name?: string | null) => (name?.replace(/^TEST\s+/, "").trim().split(/\s+/)[0] || "there");
const inr = (n?: number | null) => `₹${Math.round(n ?? 0).toLocaleString("en-IN")}`;
const sign = "\n\n— Team BXLACK";

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "order-confirmed",
    label: "Order confirmed",
    for: ["order"],
    build: (c) =>
      `Hi ${first(c.name)}, thank you for shopping with BXLACK! 🖤\n\nYour order #${c.orderNumber} is confirmed${
        c.items?.length ? `:\n${c.items.map((i) => `• ${i}`).join("\n")}` : "."
      }\n\nTotal: ${inr(c.total)}${c.paymentMethod === "cod" ? " (cash on delivery)" : ""}\nWe'll let you know as soon as it ships.${sign}`,
  },
  {
    id: "cod-confirm",
    label: "Confirm COD order",
    for: ["order"],
    build: (c) =>
      `Hi ${first(c.name)}, this is BXLACK. We've received your cash-on-delivery order #${c.orderNumber} for ${inr(
        c.total,
      )}.\n\nPlease reply YES to confirm so we can dispatch it. Keep the amount ready at delivery.${sign}`,
  },
  {
    id: "address-check",
    label: "Confirm address / details",
    for: ["order", "return"],
    build: (c) =>
      `Hi ${first(c.name)}, this is BXLACK about order #${c.orderNumber}. Could you please confirm your full delivery address with PIN code and a landmark, so the courier can reach you without delay?${sign}`,
  },
  {
    id: "shipped",
    label: "Order shipped",
    for: ["order"],
    build: (c) =>
      `Hi ${first(c.name)}, good news — your BXLACK order #${c.orderNumber} has shipped! 📦${
        c.courier ? `\nCourier: ${c.courier}` : ""
      }${c.trackingNumber ? `\nTracking: ${c.trackingNumber}` : ""}${
        c.paymentMethod === "cod" ? `\n\nPlease keep ${inr(c.total)} ready for cash on delivery.` : ""
      }${sign}`,
  },
  {
    id: "out-for-delivery",
    label: "Out for delivery",
    for: ["order"],
    build: (c) =>
      `Hi ${first(c.name)}, your BXLACK order #${c.orderNumber} is out for delivery today 🚚${
        c.paymentMethod === "cod" ? `\nPlease keep ${inr(c.total)} ready (cash on delivery).` : ""
      }${sign}`,
  },
  {
    id: "delivered",
    label: "Delivered — check-in",
    for: ["order"],
    build: (c) =>
      `Hi ${first(c.name)}, your BXLACK order #${c.orderNumber} has been delivered. We hope you love it! 🖤\n\nIf anything isn't right, you can request a return or exchange within ${RETURN_WINDOW_DAYS} days from your account: ${SITE_URL}/account${sign}`,
  },
  {
    id: "cancelled",
    label: "Order cancelled",
    for: ["order"],
    build: (c) =>
      `Hi ${first(c.name)}, your BXLACK order #${c.orderNumber} has been cancelled. If this wasn't expected, just reply here and we'll sort it out.${sign}`,
  },
  {
    id: "return-pickup",
    label: "Return/exchange pickup scheduled",
    for: ["return"],
    build: (c) =>
      `Hi ${first(c.name)}, your ${c.requestType ?? "return"} for order #${c.orderNumber} is approved. Our courier will pick it up shortly — please keep the piece packed in its original tube with the tag and seal attached.${sign}`,
  },
  {
    id: "exchange-shipped",
    label: "Exchange piece shipped",
    for: ["return"],
    build: (c) =>
      `Hi ${first(c.name)}, your exchange for order #${c.orderNumber} is on its way${
        c.exchangeSizes ? ` (${c.exchangeSizes})` : ""
      }! 📦${c.trackingNumber ? `\nTracking: ${c.trackingNumber}` : ""}${sign}`,
  },
  {
    id: "hello",
    label: "General message",
    for: ["order", "return", "customer"],
    build: (c) => `Hi ${first(c.name)}, this is BXLACK. `,
  },
];
