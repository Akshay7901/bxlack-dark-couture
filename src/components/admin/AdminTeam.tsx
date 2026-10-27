import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ShieldCheck, User } from "lucide-react";
import { listStaff, removeStaffMember, saveStaffMember, type StaffMember } from "@/lib/admin-users.functions";
import { PERMISSIONS, PERMISSION_KEYS, type Permission, type StudioRole } from "@/lib/permissions";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/admin/Badge";

type Draft = {
  userId: string | null;
  email: string;
  password: string;
  role: StudioRole;
  permissions: Permission[];
};

const newDraft = (): Draft => ({ userId: null, email: "", password: "", role: "staff", permissions: ["orders"] });

const labelClass = "font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-400";
const inputClass =
  "mt-2 w-full border border-black/15 bg-transparent px-3 py-2.5 font-mono text-[14px] text-neutral-900 outline-none transition-colors focus:border-black/60";

export function AdminTeam({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm("light");
  const [draft, setDraft] = useState<Draft | null>(null);
  const { data: members = [], isLoading, error } = useQuery({ queryKey: ["admin-staff"], queryFn: () => listStaff() });

  const save = useMutation({
    mutationFn: (d: Draft) =>
      saveStaffMember({
        data: {
          userId: d.userId,
          email: d.userId ? null : d.email.trim(),
          password: d.password ? d.password : null,
          role: d.role,
          permissions: d.role === "admin" ? [] : d.permissions,
        },
      }),
    onSuccess: (r, d) => {
      toast.success(d.userId ? "Access updated" : r.created ? "Account created and access granted" : "Access granted");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeStaffMember({ data: { userId } }),
    onSuccess: () => {
      toast.success("Access removed");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const admins = members.filter((m) => m.role === "admin").length;

  return (
    <section>
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">
            Staff &amp; permissions
          </h2>
          <p className="mt-1.5 text-[13px] text-neutral-500">
            Admins have full access. Staff only see the sections you give them.
          </p>
        </div>
        <button
          onClick={() => setDraft(draft ? null : newDraft())}
          className="flex items-center gap-2 border border-black bg-black px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-white"
        >
          {draft ? null : <Plus size={13} />}
          {draft ? "Cancel" : "Add staff"}
        </button>
      </div>

      {draft ? (
        <StaffForm
          draft={draft}
          setDraft={setDraft}
          saving={save.isPending}
          isSelf={draft.userId === currentUserId}
          onSave={() => save.mutate(draft)}
        />
      ) : null}

      <div className="mt-8 space-y-2">
        {isLoading ? (
          <p className="py-10 text-[13px] text-neutral-500">Loading…</p>
        ) : error ? (
          <p className="py-10 text-[13px] text-red-600">{(error as Error).message}</p>
        ) : (
          members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              isSelf={m.userId === currentUserId}
              onEdit={() =>
                setDraft({
                  userId: m.userId,
                  email: m.email,
                  password: "",
                  role: m.role,
                  permissions: m.role === "admin" ? ["orders"] : m.permissions,
                })
              }
              onRemove={
                m.userId === currentUserId || (m.role === "admin" && admins <= 1)
                  ? undefined
                  : () =>
                      confirm({
                        title: "Remove access",
                        message: `${m.email} will no longer be able to open the Studio. Their account and any orders are kept.`,
                        confirmLabel: "Remove access",
                        destructive: true,
                        onConfirm: () => remove.mutate(m.userId),
                      })
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function MemberRow({
  member: m,
  isSelf,
  onEdit,
  onRemove,
}: {
  member: StaffMember;
  isSelf: boolean;
  onEdit: () => void;
  onRemove?: () => void;
}) {
  const labels = PERMISSIONS.filter((p) => m.permissions.includes(p.key)).map((p) => p.label);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-black/10 bg-black/[0.02] px-4 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3e3e3] text-neutral-600">
        {m.role === "admin" ? <ShieldCheck size={17} /> : <User size={17} />}
      </div>
      <div className="min-w-[180px] flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[14px] text-neutral-900">
          {m.email}
          <Badge tone={m.role === "admin" ? "info" : "neutral"}>{m.role === "admin" ? "Admin" : "Staff"}</Badge>
          {isSelf ? <span className="text-[12px] text-neutral-500">(you)</span> : null}
        </p>
        <p className="mt-1 text-[12px] text-neutral-500">
          {m.role === "admin" ? "Full access, including staff management" : labels.join(" · ") || "No sections"}
        </p>
        <p className="mt-0.5 text-[12px] text-neutral-400">
          {m.lastSignInAt ? `Last signed in ${new Date(m.lastSignInAt).toLocaleDateString()}` : "Hasn't signed in yet"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-700"
        >
          Edit access
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-red-600"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StaffForm({
  draft,
  setDraft,
  saving,
  isSelf,
  onSave,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  saving: boolean;
  isSelf: boolean;
  onSave: () => void;
}) {
  const editing = !!draft.userId;
  const toggle = (p: Permission) =>
    setDraft({
      ...draft,
      permissions: draft.permissions.includes(p) ? draft.permissions.filter((x) => x !== p) : [...draft.permissions, p],
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!editing && !draft.email.trim()) return toast.error("Enter an email address");
        if (draft.role === "staff" && draft.permissions.length === 0) return toast.error("Choose at least one section");
        onSave();
      }}
      className="mt-6 space-y-6 border border-black/12 p-5 sm:p-6"
    >
      <h3 className="text-[15px] font-semibold text-neutral-900">{editing ? `Edit access · ${draft.email}` : "Add staff"}</h3>

      {editing ? null : (
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block" htmlFor="staff-email">
            <span className={labelClass}>Email</span>
            <input
              id="staff-email"
              type="email"
              required
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="block" htmlFor="staff-password">
            <span className={labelClass}>Temporary password</span>
            <input
              id="staff-password"
              type="text"
              minLength={8}
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              placeholder="Only needed for a new account"
              className={inputClass}
            />
          </label>
          <p className="text-[12px] text-neutral-500 md:col-span-2">
            If this email already has an account on the site, they keep their password and simply get Studio access.
            Otherwise a new account is created with this temporary password; share it with them privately.
          </p>
        </div>
      )}

      <fieldset>
        <legend className={labelClass}>Role</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              { key: "admin", title: "Admin", text: "Full access to everything, including adding and removing staff." },
              { key: "staff", title: "Staff", text: "Only the sections you choose below." },
            ] as const
          ).map((r) => (
            <label
              key={r.key}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                draft.role === r.key ? "border-[#303030] bg-white shadow-[0_0_0_1px_#303030]" : "border-[#d4d4d4] bg-white"
              } ${isSelf && r.key === "staff" ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="role"
                value={r.key}
                checked={draft.role === r.key}
                disabled={isSelf && r.key === "staff"}
                onChange={() => setDraft({ ...draft, role: r.key })}
                className="mt-1 accent-black"
              />
              <span>
                <span className="block text-[14px] font-semibold text-neutral-900">{r.title}</span>
                <span className="block text-[12px] text-neutral-500">{r.text}</span>
              </span>
            </label>
          ))}
        </div>
        {isSelf ? <p className="mt-2 text-[12px] text-neutral-500">You can't remove your own admin access.</p> : null}
      </fieldset>

      {draft.role === "staff" ? (
        <fieldset>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className={labelClass}>What can they access?</legend>
            <div className="flex gap-3 text-[12px]">
              <button type="button" className="underline" onClick={() => setDraft({ ...draft, permissions: [...PERMISSION_KEYS] })}>
                Select all
              </button>
              <button type="button" className="underline" onClick={() => setDraft({ ...draft, permissions: [] })}>
                Clear
              </button>
            </div>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label key={p.key} className="flex cursor-pointer gap-3 rounded-lg border border-[#e3e3e3] bg-white p-3">
                <input
                  type="checkbox"
                  checked={draft.permissions.includes(p.key)}
                  onChange={() => toggle(p.key)}
                  className="mt-0.5 h-4 w-4 accent-black"
                />
                <span>
                  <span className="block text-[13px] font-semibold text-neutral-900">{p.label}</span>
                  <span className="block text-[12px] text-neutral-500">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-neutral-500">Staff can never manage other staff or admins.</p>
        </fieldset>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="border border-black bg-black px-6 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : editing ? "Save access" : "Add staff"}
      </button>
    </form>
  );
}
