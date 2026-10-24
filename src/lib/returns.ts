/** Return/exchange rules from the Returns & Refunds policy page, shared by
 * the account UI (to show the right buttons) and the server (to enforce them). */

export const RETURN_WINDOW_DAYS = 7;

/** Orders can be cancelled by the customer until they ship. */
export const CANCELLABLE_STATUSES = ["pending", "processing"] as const;

export const RETURN_TYPES = ["return", "exchange"] as const;
export type ReturnType = (typeof RETURN_TYPES)[number];

export const RETURN_REASONS = [
  "Size doesn't fit",
  "Not as expected",
  "Quality issue",
  "Wrong item received",
  "Changed my mind",
  "Other",
] as const;

export const RETURN_STATUSES = ["requested", "approved", "rejected", "picked_up", "completed"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved — pickup soon",
  rejected: "Not approved",
  picked_up: "Picked up",
  completed: "Completed",
};

export type ReturnRequestItem = {
  orderItemId: string;
  productName: string;
  size: string | null;
  quantity: number;
  exchangeSize: string | null;
};

export function returnWindowEndsAt(deliveredAt: string | null): Date | null {
  if (!deliveredAt) return null;
  return new Date(new Date(deliveredAt).getTime() + RETURN_WINDOW_DAYS * 86_400_000);
}

export function isCancellable(status: string): boolean {
  return (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

/** Why an order can or can't get a return/exchange request right now. */
export function returnEligibility(
  order: { status: string; delivered_at: string | null; country: string | null },
  now: Date = new Date(),
): { eligible: true; endsAt: Date } | { eligible: false; reason: string } {
  if (order.status !== "delivered") {
    return { eligible: false, reason: "Returns open once your order is delivered." };
  }
  if (order.country && !/^india$/i.test(order.country.trim())) {
    return { eligible: false, reason: "Returns and exchanges aren't available outside India." };
  }
  const endsAt = returnWindowEndsAt(order.delivered_at);
  if (!endsAt || now > endsAt) {
    return {
      eligible: false,
      reason: endsAt
        ? `The ${RETURN_WINDOW_DAYS}-day return window closed on ${endsAt.toLocaleDateString()}.`
        : "This order isn't eligible for a return.",
    };
  }
  return { eligible: true, endsAt };
}
