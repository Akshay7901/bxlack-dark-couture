/**
 * Every email the store sends, with sample data, for previewing and editing
 * in the Studio. Renders the real templates, so previews always match what
 * customers receive.
 */
import {
  adminNewMessageEmail,
  adminNewOrderEmail,
  adminNewReturnEmail,
  authConfirmSignupEmail,
  authResetPasswordEmail,
  contactReceivedEmail,
  orderCancelledEmail,
  orderConfirmationEmail,
  orderDeliveredEmail,
  orderShippedEmail,
  returnReceivedEmail,
  returnUpdateEmail,
  type Email,
  type EmailOrder,
  type EmailReturn,
} from "@/lib/email/templates";
import { TEMPLATE_DEFS, type TemplateCopy, type TemplateDef, type TemplateId } from "@/lib/email/copy";

export type EmailPreview = TemplateDef & {
  render: (copy?: Partial<TemplateCopy> | null) => Email;
};

const sampleOrder = (images: (string | null)[] = []): EmailOrder => ({
  orderNumber: 1024,
  createdAt: new Date().toISOString(),
  customerName: "Riya Sharma",
  customerEmail: "riya@example.com",
  phone: "+91 98765 43210",
  items: [
    { name: "Shipwreck Tee", size: "L", quantity: 1, price: 4999, imageUrl: images[0] ?? null },
    { name: "Stone Logo Tee", size: "M", quantity: 1, price: 5999, imageUrl: images[1] ?? null },
  ],
  subtotal: 10998,
  discountCode: "WELCOME10",
  discountAmount: 1100,
  total: 9898,
  paymentMethod: "cod",
  address: ["14 Linking Road, Flat 3B", "Mumbai, Maharashtra, 400050", "India"],
  courier: "Delhivery",
  trackingNumber: "DL4829301746IN",
  deliveredAt: new Date().toISOString(),
});

const sampleReturn = (status: string, note: string | null = null): EmailReturn => ({
  orderNumber: 1024,
  type: "exchange",
  status,
  reason: "Size doesn't fit",
  details: "Fits a little tight across the shoulders.",
  note,
  items: [{ productName: "Shipwreck Tee", size: "L", quantity: 1, exchangeSize: "XL" }],
  customerName: "Riya Sharma",
  customerEmail: "riya@example.com",
});

/** `images` are optional product thumbnails for the sample order. */
export function emailCatalog(images: (string | null)[] = []): EmailPreview[] {
  const order = sampleOrder(images);
  const renderers: Record<TemplateId, EmailPreview["render"]> = {
    "order-confirmed": (c) => orderConfirmationEmail(order, c),
    "order-shipped": (c) => orderShippedEmail(order, c),
    "order-delivered": (c) => orderDeliveredEmail(order, c),
    "order-cancelled": (c) => orderCancelledEmail(order, c),
    "return-received": (c) => returnReceivedEmail(sampleReturn("requested"), c),
    "return-approved": (c) => returnUpdateEmail(sampleReturn("approved", "Pickup scheduled for Monday, 10am–6pm."), c),
    "return-rejected": (c) => returnUpdateEmail(sampleReturn("rejected", "The plastic seal was removed, so this piece isn't eligible."), c),
    "return-picked-up": (c) => returnUpdateEmail(sampleReturn("picked_up"), c),
    "return-completed": (c) => returnUpdateEmail(sampleReturn("completed"), c),
    "contact-received": (c) => contactReceivedEmail(c),
    "confirm-signup": (c) => authConfirmSignupEmail(c),
    "reset-password": (c) => authResetPasswordEmail(c),
    "admin-new-order": (c) => adminNewOrderEmail(order, c),
    "admin-new-return": (c) => adminNewReturnEmail(sampleReturn("requested"), c),
    "admin-new-message": (c) =>
      adminNewMessageEmail(
        {
          name: "Arjun Mehta",
          email: "arjun@example.com",
          orderNumber: "1024",
          message: "Hi! Do you ship to Dubai? I'd love to order the Shipwreck Tee.",
        },
        c,
      ),
  };
  return TEMPLATE_DEFS.map((d) => ({ ...d, render: renderers[d.id] }));
}

/** The preheader is the hidden first line inbox apps show after the subject. */
export function preheaderOf(html: string): string {
  const match = html.match(/<div style="display:none;[^"]*">([^<]*)<\/div>/);
  return match ? match[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"') : "";
}
