import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { WHATSAPP_TEMPLATES, toWhatsAppNumber, whatsAppLink, type WhatsAppContext } from "@/lib/whatsapp";

/**
 * "WhatsApp" button with a menu of ready-written messages for this customer.
 * Picking one opens WhatsApp (app or Web) on their chat with the text filled
 * in, ready to review and send.
 */
export function WhatsAppMenu({
  phone,
  context,
  scope,
  compact = false,
}: {
  phone: string | null | undefined;
  context: WhatsAppContext;
  scope: "order" | "return" | "customer";
  /** Icon-only button for list rows. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const usable = !!toWhatsAppNumber(phone);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const templates = WHATSAPP_TEMPLATES.filter((t) => t.for.includes(scope));

  const send = (text: string) => {
    const link = whatsAppLink(phone, text);
    if (!link) return toast.error("This customer has no valid phone number");
    window.open(link, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => (usable ? setOpen((v) => !v) : toast.error("No valid phone number on file"))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Message on WhatsApp"
        title={usable ? "Message on WhatsApp" : "No phone number on file"}
        className={
          compact
            ? `flex h-8 w-8 items-center justify-center border border-black/15 transition-colors ${
                usable ? "text-[#128c4a] hover:border-[#128c4a]/60" : "text-neutral-300"
              }`
            : `flex items-center gap-2 border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] ${
                usable ? "text-[#0c6b39]" : "text-neutral-400"
              }`
        }
      >
        <MessageCircle size={compact ? 14 : 13} />
        {compact ? null : "WhatsApp"}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-xl border border-[#e3e3e3] bg-white py-1 text-[13px] text-[#303030] shadow-lg"
        >
          <p className="px-4 pb-1 pt-2 text-[11px] font-semibold text-[#616161]">Send on WhatsApp</p>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              onClick={() => send(t.build(context))}
              className="block w-full rounded-none px-4 py-2 text-left hover:bg-[#f7f7f7]"
            >
              {t.label}
            </button>
          ))}
          <p className="border-t border-[#e3e3e3] px-4 py-2 text-[11px] text-[#8a8a8a]">
            Opens WhatsApp with the message ready — you press Send.
          </p>
        </div>
      ) : null}
    </div>
  );
}
