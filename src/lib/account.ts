import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(
  userId: string,
  input: { full_name: string; phone: string },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...input }, { onConflict: "id" });
  if (error) throw error;
}

export type Address = {
  id: string;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export type AddressInput = Omit<Address, "id" | "is_default">;

export async function fetchAddresses(): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAddress(userId: string, input: AddressInput): Promise<void> {
  const { error } = await supabase.from("addresses").insert({ user_id: userId, ...input });
  if (error) throw error;
}

export async function updateAddress(id: string, input: AddressInput): Promise<void> {
  const { error } = await supabase.from("addresses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  const { error: clearError } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);
  if (clearError) throw clearError;
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw error;
}

export type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    image_path: string | null;
    size: string | null;
    quantity: number;
    price: number;
  }[];
};

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at, order_items(id, product_name, image_path, size, quantity, price)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
    items: o.order_items ?? [],
  }));
}
