/** Studio sections a staff member can be given, Shopify-style. Admins have all
 * of them plus staff management. Mirrors private.can() in the database. */
export const PERMISSIONS = [
  { key: "home", label: "Home", description: "Dashboard: sales, to-dos, best sellers" },
  { key: "orders", label: "Orders", description: "View and fulfil orders, print labels and invoices" },
  { key: "returns", label: "Returns & exchanges", description: "Review and update return and exchange requests" },
  { key: "products", label: "Products", description: "Add and edit products, stock, images and category images" },
  { key: "customers", label: "Customers", description: "View customer accounts and order history" },
  { key: "discounts", label: "Discounts", description: "Create and edit discount codes" },
  { key: "messages", label: "Messages", description: "Read and reply to contact-form messages" },
  { key: "content", label: "Store content", description: "Email templates and launch settings" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as Permission[];

export type StudioRole = "admin" | "staff";

export type StudioAccess = {
  role: StudioRole | null;
  /** Everything for admins; the granted sections for staff; empty otherwise. */
  permissions: Permission[];
};

export const can = (access: StudioAccess | null | undefined, permission: Permission) =>
  !!access && (access.role === "admin" || access.permissions.includes(permission));
