/**
 * Every email the store sends, with sample data, for previewing designs in
 * the Studio. Renders the real templates, so previews always match what
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

export type EmailPreview = {
  id: string;
  group: "Orders" | "Returns" | "Account" | "Store alerts";
  name: string;
  /** What triggers the email. */
  when: string;
  to: string;
  render: () => Email;
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
  return [
    { id: "order-confirmed", group: "Orders", name: "Order confirmed", when: "Customer places an order", to: "Customer", render: () => orderConfirmationEmail(order) },
    { id: "order-shipped", group: "Orders", name: "Order shipped", when: "You mark the order Shipped", to: "Customer", render: () => orderShippedEmail(order) },
    { id: "order-delivered", group: "Orders", name: "Order delivered", when: "You mark the order Delivered", to: "Customer", render: () => orderDeliveredEmail(order) },
    { id: "order-cancelled", group: "Orders", name: "Order cancelled", when: "The customer or you cancel the order", to: "Customer", render: () => orderCancelledEmail(order) },
    { id: "return-received", group: "Returns", name: "Request received", when: "Customer requests a return or exchange", to: "Customer", render: () => returnReceivedEmail(sampleReturn("requested")) },
    { id: "return-approved", group: "Returns", name: "Request approved", when: "You set the request to Approved", to: "Customer", render: () => returnUpdateEmail(sampleReturn("approved", "Pickup scheduled for Monday, 10am–6pm.")) },
    { id: "return-rejected", group: "Returns", name: "Request not approved", when: "You set the request to Not approved", to: "Customer", render: () => returnUpdateEmail(sampleReturn("rejected", "The plastic seal was removed, so this piece isn't eligible.")) },
    { id: "return-picked-up", group: "Returns", name: "Picked up", when: "You set the request to Picked up", to: "Customer", render: () => returnUpdateEmail(sampleReturn("picked_up")) },
    { id: "return-completed", group: "Returns", name: "Completed", when: "You set the request to Completed", to: "Customer", render: () => returnUpdateEmail(sampleReturn("completed")) },
    { id: "contact-received", group: "Account", name: "Message received", when: "Someone submits the contact form", to: "Sender", render: () => contactReceivedEmail() },
    { id: "confirm-signup", group: "Account", name: "Confirm email", when: "Customer signs up (if email confirmation is on in Supabase)", to: "Customer", render: () => authConfirmSignupEmail() },
    { id: "reset-password", group: "Account", name: "Reset password", when: "Customer clicks “Forgot password”", to: "Customer", render: () => authResetPasswordEmail() },
    { id: "admin-new-order", group: "Store alerts", name: "New order", when: "Customer places an order", to: "You (ADMIN_NOTIFY_EMAIL)", render: () => adminNewOrderEmail(order) },
    { id: "admin-new-return", group: "Store alerts", name: "New return request", when: "Customer requests a return or exchange", to: "You (ADMIN_NOTIFY_EMAIL)", render: () => adminNewReturnEmail(sampleReturn("requested")) },
    {
      id: "admin-new-message",
      group: "Store alerts",
      name: "New message",
      when: "Someone submits the contact form",
      to: "You (ADMIN_NOTIFY_EMAIL)",
      render: () =>
        adminNewMessageEmail({
          name: "Arjun Mehta",
          email: "arjun@example.com",
          orderNumber: "1024",
          message: "Hi! Do you ship to Dubai? I'd love to order the Shipwreck Tee.",
        }),
    },
  ];
}

/** The preheader is the hidden first line inbox apps show after the subject. */
export function preheaderOf(html: string): string {
  const match = html.match(/<div style="display:none;[^"]*">([^<]*)<\/div>/);
  return match ? match[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"') : "";
}
