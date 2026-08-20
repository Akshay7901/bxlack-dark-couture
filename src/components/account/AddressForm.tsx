import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Address, AddressInput } from "@/lib/account";

const inputClass =
  "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-base text-white outline-none transition-colors focus:border-white/60 sm:text-[12px]";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

export function AddressForm({
  address,
  saving,
  onCancel,
  onSave,
}: {
  address: Address | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (input: AddressInput) => void;
}) {
  const [form, setForm] = useState<AddressInput>({
    full_name: address?.full_name ?? "",
    phone: address?.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postal_code: address?.postal_code ?? "",
    country: address?.country ?? "India",
  });

  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid gap-5 border border-white/12 p-5 sm:p-6 md:grid-cols-2"
    >
      <label className="block">
        <span className={labelClass}>Full name</span>
        <input
          required
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Phone</span>
        <input
          value={form.phone ?? ""}
          onChange={(e) => set("phone", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block md:col-span-2">
        <span className={labelClass}>Address line 1</span>
        <input
          required
          value={form.line1}
          onChange={(e) => set("line1", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block md:col-span-2">
        <span className={labelClass}>Address line 2 (optional)</span>
        <input
          value={form.line2 ?? ""}
          onChange={(e) => set("line2", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>City</span>
        <input
          required
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>State</span>
        <input
          value={form.state ?? ""}
          onChange={(e) => set("state", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Postal code</span>
        <input
          required
          value={form.postal_code}
          onChange={(e) => set("postal_code", e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Country</span>
        <input
          required
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
          className={inputClass}
        />
      </label>

      <div className="flex items-center gap-4 pt-1 md:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          {address ? "Save changes" : "Add address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
