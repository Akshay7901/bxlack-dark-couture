/** Shopify-style status pill. Tones carry meaning: success = done,
 * attention = needs you, info = in progress, critical = stopped. */
export type BadgeTone = "neutral" | "info" | "success" | "attention" | "warning" | "critical";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-[#e3e3e3] text-[#303030]",
  info: "bg-[#e0f0ff] text-[#00527c]",
  success: "bg-[#cdfee1] text-[#0c5132]",
  attention: "bg-[#ffef9d] text-[#4f4700]",
  warning: "bg-[#ffd6a4] text-[#5e4200]",
  critical: "bg-[#fedad9] text-[#8e1f0b]",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-[12px] font-medium leading-5 ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  pending: "attention",
  processing: "info",
  shipped: "warning",
  delivered: "success",
  cancelled: "critical",
};

export const RETURN_STATUS_TONE: Record<string, BadgeTone> = {
  requested: "attention",
  approved: "info",
  rejected: "critical",
  picked_up: "warning",
  completed: "success",
};

/** "picked_up" → "Picked up". */
export const statusLabel = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, " ");
