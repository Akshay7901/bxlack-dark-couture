import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  order_number: z.string().trim().max(50).nullable(),
  message: z.string().trim().min(1).max(5000),
});

/** Saves a contact-form message, alerts the store and sends the customer an
 * acknowledgement. Public — no sign-in needed, like the form itself. */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert(data);
    if (error) throw new Error("Could not send message");

    const { notifyContactMessage } = await import("@/lib/email/notify.server");
    await notifyContactMessage({
      name: data.name,
      email: data.email,
      orderNumber: data.order_number,
      message: data.message,
    });
    return { ok: true };
  });
