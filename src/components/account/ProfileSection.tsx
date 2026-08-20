import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchProfile, upsertProfile } from "@/lib/account";

const inputClass =
  "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-base text-white outline-none transition-colors focus:border-white/60 sm:text-[12px]";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

export function ProfileSection({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: () => upsertProfile(userId, { full_name: fullName.trim(), phone: phone.trim() }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Profile</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-6 max-w-md space-y-5"
      >
        <label className="block">
          <span className={labelClass}>Email</span>
          <input
            value={email}
            disabled
            className={`${inputClass} cursor-not-allowed opacity-50`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={save.isPending}
          className="flex items-center gap-2 border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
        >
          {save.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
          Save
        </button>
      </form>
    </div>
  );
}
