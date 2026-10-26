/**
 * The editable wording of every email: defaults, allowed {{variables}} and
 * the helpers that fill them in. Admins override these from the Studio
 * (stored in the email_templates table); anything left blank uses the default.
 */

export const TEMPLATE_IDS = [
  "order-confirmed",
  "order-shipped",
  "order-delivered",
  "order-cancelled",
  "return-received",
  "return-approved",
  "return-rejected",
  "return-picked-up",
  "return-completed",
  "contact-received",
  "confirm-signup",
  "reset-password",
  "admin-new-order",
  "admin-new-return",
  "admin-new-message",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const COPY_FIELDS = ["subject", "heading", "intro", "button", "footer"] as const;
export type CopyField = (typeof COPY_FIELDS)[number];
export type TemplateCopy = Record<CopyField, string>;

export const COPY_FIELD_LABELS: Record<CopyField, string> = {
  subject: "Subject line",
  heading: "Heading",
  intro: "Message",
  button: "Button text",
  footer: "Footer note",
};

export const VARIABLE_HELP: Record<string, string> = {
  first_name: "Customer's first name",
  order_number: "Order number, e.g. 1024",
  total: "Order total, e.g. ₹9,898",
  tracking_number: "Tracking number",
  courier: "Courier name",
  return_deadline: "Last day to request a return",
  request_type: "“return” or “exchange”",
  customer_name: "Customer's full name",
  customer_email: "Customer's email",
  sender_name: "Name entered on the contact form",
  sender_email: "Email entered on the contact form",
};

export type TemplateDef = {
  id: TemplateId;
  name: string;
  group: "Orders" | "Returns" | "Account" | "Store alerts";
  when: string;
  to: string;
  variables: string[];
  defaults: TemplateCopy;
  /** Sent by Supabase, not the site: edits must be pasted into Supabase. */
  supabase?: boolean;
};

const help = "Questions? Reply to this email or visit our contact page.";
const security = "This is an automated security message from BXLACK.";
const alert = "Store alert from your BXLACK studio.";

export const TEMPLATE_DEFS: TemplateDef[] = [
  {
    id: "order-confirmed",
    name: "Order confirmed",
    group: "Orders",
    when: "Customer places an order",
    to: "Customer",
    variables: ["first_name", "order_number", "total"],
    defaults: {
      subject: "Order #{{order_number}} confirmed",
      heading: "Order confirmed",
      intro: "Thanks, {{first_name}}. We're getting your order ready and will email you when it ships.",
      button: "View order",
      footer: "Need to change something? Contact us before your order ships.",
    },
  },
  {
    id: "order-shipped",
    name: "Order shipped",
    group: "Orders",
    when: "You mark the order Shipped",
    to: "Customer",
    variables: ["first_name", "order_number", "tracking_number", "courier"],
    defaults: {
      subject: "Order #{{order_number}} has shipped",
      heading: "Your order is on its way",
      intro: "Good news, {{first_name}} — order #{{order_number}} has left the studio and is headed to you.",
      button: "View order",
      footer: help,
    },
  },
  {
    id: "order-delivered",
    name: "Order delivered",
    group: "Orders",
    when: "You mark the order Delivered",
    to: "Customer",
    variables: ["first_name", "order_number", "return_deadline"],
    defaults: {
      subject: "Order #{{order_number}} delivered",
      heading: "Delivered",
      intro: "Order #{{order_number}} has arrived, {{first_name}}. We hope it was worth the wait.",
      button: "Return or exchange",
      footer: help,
    },
  },
  {
    id: "order-cancelled",
    name: "Order cancelled",
    group: "Orders",
    when: "The customer or you cancel the order",
    to: "Customer",
    variables: ["first_name", "order_number", "total"],
    defaults: {
      subject: "Order #{{order_number}} cancelled",
      heading: "Order cancelled",
      intro: "Order #{{order_number}} has been cancelled. Since it was cash on delivery, nothing was charged. If this wasn't expected, reply to this email and we'll sort it out.",
      button: "Continue shopping",
      footer: help,
    },
  },
  {
    id: "return-received",
    name: "Request received",
    group: "Returns",
    when: "Customer requests a return or exchange",
    to: "Customer",
    variables: ["first_name", "order_number", "request_type"],
    defaults: {
      subject: "We've received your {{request_type}} request — order #{{order_number}}",
      heading: "Request received",
      intro: "Thanks, {{first_name}}. We'll review your {{request_type}} for order #{{order_number}} within 1–2 business days and email you once it's approved, with pickup details.",
      button: "View request",
      footer: help,
    },
  },
  {
    id: "return-approved",
    name: "Request approved",
    group: "Returns",
    when: "You set the request to Approved",
    to: "Customer",
    variables: ["first_name", "order_number", "request_type"],
    defaults: {
      subject: "Your {{request_type}} is approved — order #{{order_number}}",
      heading: "Request approved",
      intro: "Hi {{first_name}}. Your request is approved. Our courier partner will attempt pickup at your address twice — please have the piece packed in its original tube with tag and seal attached.",
      button: "View request",
      footer: help,
    },
  },
  {
    id: "return-rejected",
    name: "Request not approved",
    group: "Returns",
    when: "You set the request to Not approved",
    to: "Customer",
    variables: ["first_name", "order_number", "request_type"],
    defaults: {
      subject: "Update on your {{request_type}} — order #{{order_number}}",
      heading: "Request not approved",
      intro: "Hi {{first_name}}. We couldn't approve this request. The note below explains why — reply to this email if you have questions.",
      button: "View request",
      footer: help,
    },
  },
  {
    id: "return-picked-up",
    name: "Picked up",
    group: "Returns",
    when: "You set the request to Picked up",
    to: "Customer",
    variables: ["first_name", "order_number", "request_type"],
    defaults: {
      subject: "Your {{request_type}} has been picked up — order #{{order_number}}",
      heading: "Picked up",
      intro: "Hi {{first_name}}. The courier has collected your piece. We'll inspect it as soon as it reaches the studio.",
      button: "View request",
      footer: help,
    },
  },
  {
    id: "return-completed",
    name: "Completed",
    group: "Returns",
    when: "You set the request to Completed",
    to: "Customer",
    variables: ["first_name", "order_number", "request_type"],
    defaults: {
      subject: "Your {{request_type}} is complete — order #{{order_number}}",
      heading: "All done",
      intro: "Hi {{first_name}}. Refunds typically reach your original payment method within 3–5 business days; exchanges ship out separately.",
      button: "View request",
      footer: help,
    },
  },
  {
    // No variables on purpose: the contact form is public, so this reply must
    // not echo anything a stranger typed (it could be abused to send spam).
    id: "contact-received",
    name: "Message received",
    group: "Account",
    when: "Someone submits the contact form",
    to: "Sender",
    variables: [],
    defaults: {
      subject: "We've received your message",
      heading: "We've got your message",
      intro: "Thanks for reaching out to BXLACK. A member of our team will reply to this address shortly. In the meantime, our FAQ covers sizing, delivery and returns.",
      button: "Visit the FAQ",
      footer: "Didn't contact us? You can safely ignore this email.",
    },
  },
  {
    id: "confirm-signup",
    name: "Confirm email",
    group: "Account",
    when: "Customer signs up (if email confirmation is on in Supabase)",
    to: "Customer",
    variables: [],
    supabase: true,
    defaults: {
      subject: "Confirm your BXLACK account",
      heading: "Confirm your email",
      intro: "Tap the button below to confirm this address belongs to you and finish setting up your BXLACK account. If you didn't create an account, you can ignore this email.",
      button: "Verify email",
      footer: security,
    },
  },
  {
    id: "reset-password",
    name: "Reset password",
    group: "Account",
    when: "Customer clicks “Forgot password”",
    to: "Customer",
    variables: [],
    supabase: true,
    defaults: {
      subject: "Reset your BXLACK password",
      heading: "Reset your password",
      intro: "We got a request to reset the password for your BXLACK account. Choose a new one using the button below. This link expires in one hour and can only be used once.",
      button: "Set new password",
      footer: security,
    },
  },
  {
    id: "admin-new-order",
    name: "New order",
    group: "Store alerts",
    when: "Customer places an order",
    to: "You (ADMIN_NOTIFY_EMAIL)",
    variables: ["customer_name", "customer_email", "order_number", "total"],
    defaults: {
      subject: "New order #{{order_number}} — {{total}}",
      heading: "New order · {{total}}",
      intro: "{{customer_name}} ({{customer_email}}) just placed order #{{order_number}}.",
      button: "Open in Studio",
      footer: alert,
    },
  },
  {
    id: "admin-new-return",
    name: "New return request",
    group: "Store alerts",
    when: "Customer requests a return or exchange",
    to: "You (ADMIN_NOTIFY_EMAIL)",
    variables: ["customer_name", "customer_email", "order_number", "request_type"],
    defaults: {
      subject: "New {{request_type}} request — order #{{order_number}}",
      heading: "New {{request_type}} request",
      intro: "{{customer_name}} ({{customer_email}}) requested a {{request_type}} for order #{{order_number}}.",
      button: "Review in Studio",
      footer: alert,
    },
  },
  {
    id: "admin-new-message",
    name: "New message",
    group: "Store alerts",
    when: "Someone submits the contact form",
    to: "You (ADMIN_NOTIFY_EMAIL)",
    variables: ["sender_name", "sender_email"],
    defaults: {
      subject: "New message from {{sender_name}}",
      heading: "Message from {{sender_name}}",
      intro: "{{sender_email}} wrote in through the contact form.",
      button: "Reply by email",
      footer: alert,
    },
  },
];

export const templateDef = (id: TemplateId) => TEMPLATE_DEFS.find((d) => d.id === id)!;

const VAR = /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Variables used in some text that the template doesn't offer. */
export function unknownVariables(text: string, allowed: string[]): string[] {
  return [...text.matchAll(VAR)].map((m) => m[1]).filter((v) => !allowed.includes(v));
}

/** Overrides on top of the defaults; blank fields fall back to the default. */
export function resolveCopy(id: TemplateId, overrides?: Partial<TemplateCopy> | null): TemplateCopy {
  const d = templateDef(id).defaults;
  const pick = (f: CopyField) => (overrides?.[f]?.trim() ? overrides[f]!.trim() : d[f]);
  return { subject: pick("subject"), heading: pick("heading"), intro: pick("intro"), button: pick("button"), footer: pick("footer") };
}

const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Fills {{variables}} as plain text (subjects, text bodies). */
export function fillText(text: string, vars: Record<string, string>): string {
  return text.replace(VAR, (_, k: string) => vars[k] ?? "");
}

/** Fills {{variables}} as HTML: the admin's text and every value are escaped,
 * and line breaks become <br>. */
export function fillHtml(text: string, vars: Record<string, string>): string {
  return escapeHtml(text)
    .replace(VAR, (_, k: string) => escapeHtml(vars[k] ?? ""))
    .replace(/\r?\n/g, "<br>");
}
