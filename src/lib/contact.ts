import { supabase } from "@/integrations/supabase/client";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  order_number: string | null;
  message: string;
  status: string;
  created_at: string;
};

export async function submitContactMessage(input: {
  name: string;
  email: string;
  order_number: string | null;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) throw error;
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markContactMessageRead(id: string): Promise<void> {
  const { error } = await supabase.from("contact_messages").update({ status: "read" }).eq("id", id);
  if (error) throw error;
}

export async function deleteContactMessage(id: string): Promise<void> {
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) throw error;
}
