/**
 * Loads what each email needs and sends it. Call these from server handlers
 * after the database change succeeds; they never throw.
 */
import { adminRecipients, sendEmail } from "@/lib/email/send.server";
import {
  adminNewMessageEmail,
  adminNewOrderEmail,
  adminNewReturnEmail,
  contactReceivedEmail,
  orderCancelledEmail,
  orderConfirmationEmail,
  orderDeliveredEmail,
  orderShippedEmail,
  returnReceivedEmail,
  returnUpdateEmail,
  type EmailContact,
  type EmailOrder,
  type EmailReturn,
} from "@/lib/email/templates";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function emailForUser(userId: string): Promise<string | null> {
  const { data } = await (await admin()).auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function loadOrder(orderId: string): Promise<EmailOrder | null> {
  const db = await admin();
  const { data: o } = await db
    .from("orders")
    .select(
      "order_number, user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, subtotal, discount_code, discount_amount, total, payment_method, courier, tracking_number, delivered_at, order_items(product_name, size, quantity, price)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return null;
  const email = await emailForUser(o.user_id);
  if (!email) return null;
  return {
    orderNumber: o.order_number,
    customerName: o.full_name,
    customerEmail: email,
    phone: o.phone,
    items: (o.order_items ?? []).map((i) => ({
      name: i.product_name,
      size: i.size,
      quantity: i.quantity,
      price: Number(i.price),
    })),
    subtotal: Number(o.subtotal ?? o.total),
    discountCode: o.discount_code,
    discountAmount: Number(o.discount_amount ?? 0),
    total: Number(o.total),
    paymentMethod: o.payment_method,
    address: [
      [o.address_line1, o.address_line2].filter(Boolean).join(", "),
      [o.city, o.state, o.postal_code].filter(Boolean).join(", "),
      o.country ?? "",
    ].filter(Boolean),
    courier: o.courier,
    trackingNumber: o.tracking_number,
    deliveredAt: o.delivered_at,
  };
}

async function loadReturn(returnId: string): Promise<EmailReturn | null> {
  const db = await admin();
  const { data: r } = await db
    .from("return_requests")
    .select("user_id, type, status, reason, details, admin_note, items, orders(order_number, full_name)")
    .eq("id", returnId)
    .maybeSingle();
  if (!r) return null;
  const email = await emailForUser(r.user_id);
  if (!email) return null;
  return {
    orderNumber: r.orders?.order_number ?? 0,
    type: r.type,
    status: r.status,
    reason: r.reason,
    details: r.details,
    note: r.admin_note,
    items: (r.items ?? []) as unknown as EmailReturn["items"],
    customerName: r.orders?.full_name ?? null,
    customerEmail: email,
  };
}

async function safely(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (err) {
    console.error("[email] notification failed", err);
  }
}

export const notifyOrderPlaced = (orderId: string) =>
  safely(async () => {
    const o = await loadOrder(orderId);
    if (!o) return;
    await Promise.all([
      sendEmail(o.customerEmail, orderConfirmationEmail(o)),
      sendEmail(adminRecipients(), adminNewOrderEmail(o)),
    ]);
  });

const STATUS_EMAILS: Record<string, (o: EmailOrder) => ReturnType<typeof orderShippedEmail>> = {
  shipped: orderShippedEmail,
  delivered: orderDeliveredEmail,
  cancelled: orderCancelledEmail,
};

export const notifyOrderStatus = (orderId: string, status: string) =>
  safely(async () => {
    const template = STATUS_EMAILS[status];
    if (!template) return;
    const o = await loadOrder(orderId);
    if (o) await sendEmail(o.customerEmail, template(o));
  });

export const notifyReturnCreated = (returnId: string) =>
  safely(async () => {
    const r = await loadReturn(returnId);
    if (!r) return;
    await Promise.all([
      sendEmail(r.customerEmail, returnReceivedEmail(r)),
      sendEmail(adminRecipients(), adminNewReturnEmail(r)),
    ]);
  });

export const notifyReturnUpdated = (returnId: string) =>
  safely(async () => {
    const r = await loadReturn(returnId);
    if (r && r.status !== "requested") await sendEmail(r.customerEmail, returnUpdateEmail(r));
  });

export const notifyContactMessage = (c: EmailContact) =>
  safely(() =>
    Promise.all([
      sendEmail(c.email, contactReceivedEmail()),
      sendEmail(adminRecipients(), adminNewMessageEmail(c)),
    ]),
  );
