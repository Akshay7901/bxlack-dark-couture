import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAdminUser, listAdmins, removeAdminUser } from "@/lib/admin-users.functions";
import { useConfirm } from "@/components/admin/ConfirmDialog";

export function AdminTeam({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);
  const { confirm, dialog } = useConfirm();

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: () => listAdmins(),
  });

  const create = useMutation({
    mutationFn: () => createAdminUser({ data: { email: email.trim(), password } }),
    onSuccess: () => {
      toast.success("Admin created");
      setEmail("");
      setPassword("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeAdminUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Admin removed");
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputClass =
    "mt-2 w-full border border-white/15 bg-transparent px-3 py-2.5 font-mono text-[12px] text-white outline-none transition-colors focus:border-white/60";
  const labelClass = "font-mono text-[10px] uppercase tracking-[0.28em] text-white/40";

  return (
    <section>
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Team</h2>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
            Only admins can create another admin. Public sign-up is closed.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="border border-white/25 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 transition-colors hover:border-white hover:text-white"
        >
          {open ? "Cancel" : "Add admin"}
        </button>
      </div>

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 8) return toast.error("Password must be at least 8 characters");
            create.mutate();
          }}
          className="mt-6 grid gap-5 border border-white/12 p-5 sm:p-6 md:max-w-2xl md:grid-cols-2"
        >
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Temporary password</span>
            <input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="border border-white bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-black transition-colors hover:bg-transparent hover:text-white disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create admin"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-8 border-t border-white/10">
        {isLoading ? (
          <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            Loading…
          </p>
        ) : admins.length === 0 ? (
          <p className="py-10 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            No admins found
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {admins.map((a) => (
              <li key={a.userId} className="flex items-center justify-between gap-4 py-4">
                <span className="font-sans text-[13px] text-white/85">{a.email}</span>
                {a.userId === currentUserId ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                    You
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      confirm({
                        title: "Remove admin",
                        message: `This permanently deletes the account for ${a.email} and revokes studio access. This cannot be undone.`,
                        confirmLabel: "Remove admin",
                        destructive: true,
                        onConfirm: () => remove.mutate(a.userId),
                      })
                    }
                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35 transition-colors hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
