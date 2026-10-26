/**
 * Loads what each email needs and sends it, applying the admin's wording
 * edits and on/off switches. Call these from server handlers after the
 * database change succeeds; they never throw.
 */
import { adminRecipients, sendEmail } from "@/lib/email/send.server";
import { COPY_FIELDS, type TemplateCopy, type TemplateId } from "@/lib/email/copy";
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
  returnTemplateFor,
  returnUpdateEmail,
  type Email,
  type EmailContact,
  type EmailOrder,
  type EmailReturn,
} from "@/lib/email/templates";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** The admin's saved wording and on/off switch for a template. Falls back to
 * the defaults if the table is missing or unreadable, so mail never breaks. */
async function settingFor(id: TemplateId): Promise<{ enabled: boolean; copy: Partial<TemplateCopy> | null }> {
  try {
    const { data } = await (await admin()).from("email_templates").select("*").eq("id", id).maybeSingle();
    if (!data) return { enabled: true, copy: null };
    return {
      enabled: data.enabled,
      copy: Object.fromEntries(COPY_FIELDS.filter((f) => data[f]).map((f) => [f, data[f] as string])),
    };
  } catch {
    return { enabled: true, copy: null };
  }
}

/** Sends a template unless the admin switched it off. */
async function send(
  id: TemplateId,
  to: string | string[],
  render: (copy: Partial<TemplateCopy> | null) => Email,
) {
  const setting = await settingFor(id);
  if (!setting.enabled) {
    console.info(`[email] "${id}" is switched off — skipped`);
    return;
  }
  await sendEmail(to, render(setting.copy));
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
      "order_number, created_at, user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, subtotal, discount_code, discount_amount, total, payment_method, courier, tracking_number, delivered_at, order_items(product_name, size, quantity, price, image_path)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return null;
  const email = await emailForUser(o.user_id);
  if (!email) return null;
  // Product images live in the public bucket, so a plain public URL works in email.
  const imageUrl = (path: string | null) =>
    path ? db.storage.from("product-images").getPublicUrl(path).data.publicUrl : null;
  return {
    orderNumber: o.order_number,
    createdAt: o.created_at,
    customerName: o.full_name,
    customerEmail: email,
    phone: o.phone,
    items: (o.order_items ?? []).map((i) => ({
      name: i.product_name,
      size: i.size,
      quantity: i.quantity,
      price: Number(i.price),
      imageUrl: imageUrl(i.image_path),
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
      send("order-confirmed", o.customerEmail, (c) => orderConfirmationEmail(o, c)),
      send("admin-new-order", adminRecipients(), (c) => adminNewOrderEmail(o, c)),
    ]);
  });

const STATUS_EMAILS: Record<string, { id: TemplateId; render: (o: EmailOrder, c: Partial<TemplateCopy> | null) => Email }> = {
  shipped: { id: "order-shipped", render: orderShippedEmail },
  delivered: { id: "order-delivered", render: orderDeliveredEmail },
  cancelled: { id: "order-cancelled", render: orderCancelledEmail },
};

export const notifyOrderStatus = (orderId: string, status: string) =>
  safely(async () => {
    const template = STATUS_EMAILS[status];
    if (!template) return;
    const o = await loadOrder(orderId);
    if (o) await send(template.id, o.customerEmail, (c) => template.render(o, c));
  });

export const notifyReturnCreated = (returnId: string) =>
  safely(async () => {
    const r = await loadReturn(returnId);
    if (!r) return;
    await Promise.all([
      send("return-received", r.customerEmail, (c) => returnReceivedEmail(r, c)),
      send("admin-new-return", adminRecipients(), (c) => adminNewReturnEmail(r, c)),
    ]);
  });

export const notifyReturnUpdated = (returnId: string) =>
  safely(async () => {
    const r = await loadReturn(returnId);
    const id = r ? returnTemplateFor(r.status) : null;
    if (r && id) await send(id, r.customerEmail, (c) => returnUpdateEmail(r, c));
  });

export const notifyContactMessage = (c: EmailContact) =>
  safely(() =>
    Promise.all([
      send("contact-received", c.email, (copy) => contactReceivedEmail(copy)),
      send("admin-new-message", adminRecipients(), (copy) => adminNewMessageEmail(c, copy)),
    ]),
  );
