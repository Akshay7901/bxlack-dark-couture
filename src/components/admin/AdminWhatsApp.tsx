import { CheckCircle2, MessageCircle, PlugZap } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { WHATSAPP_TEMPLATES, type WhatsAppContext } from "@/lib/whatsapp";

const SAMPLE: WhatsAppContext = {
  name: "Riya Sharma",
  orderNumber: 1024,
  total: 9898,
  paymentMethod: "cod",
  courier: "Delhivery",
  trackingNumber: "DL4829301746IN",
  items: ["1 × Shipwreck Tee (L)", "1 × Stone Logo Tee (M)"],
  requestType: "exchange",
  exchangeSizes: "Shipwreck Tee in XL",
};

const WHERE: Record<string, string> = { order: "Orders", return: "Returns & exchanges", customer: "Customers" };

/** WhatsApp hub: how messaging works today (click-to-chat), the message
 * templates, and a placeholder for connecting automatic sending later. */
export function AdminWhatsApp() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">WhatsApp</h2>
        <p className="mt-1.5 text-[13px] text-neutral-500">Message customers on WhatsApp from their order, return or profile.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-black/12 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
              <MessageCircle size={16} className="text-[#128c4a]" /> Click-to-chat
            </p>
            <Badge tone="success">
              <CheckCircle2 size={12} /> Active
            </Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
            Use the WhatsApp button on any order, return/exchange or customer. Pick a message and WhatsApp opens with it
            ready — check it and press Send. Uses your own WhatsApp or WhatsApp Business number; free, no setup.
          </p>
        </div>
        <div className="border border-black/12 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
              <PlugZap size={16} className="text-neutral-500" /> Automatic messages
            </p>
            <Badge tone="neutral">Not connected</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
            Send these messages automatically when an order is placed, shipped or delivered, via the WhatsApp Business
            API (Meta Cloud API, or a provider such as Interakt, AiSensy, Wati or Gupshup). Needs a verified Meta
            business, a dedicated number and Meta-approved templates.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-500 disabled:opacity-60"
          >
            Connect — coming soon
          </button>
        </div>
      </div>

      <div>
        <p className="text-[14px] font-semibold text-neutral-900">Message templates</p>
        <p className="mt-1 text-[12px] text-neutral-500">
          Shown with sample details; real messages use the customer's own order, tracking and amount.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {WHATSAPP_TEMPLATES.map((t) => (
            <div key={t.id} className="border border-black/12 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-neutral-900">{t.label}</p>
                <span className="text-[11px] text-neutral-500">{t.for.map((f) => WHERE[f]).join(" · ")}</span>
              </div>
              {/* WhatsApp-style outgoing bubble */}
              <div className="mt-3 rounded-lg bg-[#efeae2] p-3">
                <div className="ml-auto max-w-[92%] whitespace-pre-wrap rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[12.5px] leading-relaxed text-[#111b21] shadow-[0_1px_0_#0000001a]">
                  {t.build(SAMPLE)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
