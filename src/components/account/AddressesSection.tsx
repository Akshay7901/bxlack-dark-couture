import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
  type AddressInput,
} from "@/lib/account";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { AddressForm } from "./AddressForm";

export function AddressesSection({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => fetchAddresses(),
  });

  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses", userId] });

  const createMutation = useMutation({
    mutationFn: (input: AddressInput) => createAddress(userId, input),
    onSuccess: () => {
      toast.success("Address added");
      setCreating(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddressInput }) => updateAddress(id, input),
    onSuccess: () => {
      toast.success("Address updated");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      toast.success("Address removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultAddress(userId, id),
    onSuccess: () => {
      toast.success("Default address updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-xl uppercase tracking-[-0.01em]">Addresses</h2>
        {!creating ? (
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="flex items-center gap-2 border border-white bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-black transition-colors hover:bg-transparent hover:text-white"
          >
            <Plus size={13} />
            Add address
          </button>
        ) : null}
      </div>

      {creating ? (
        <div className="mt-6">
          <AddressForm
            address={null}
            saving={createMutation.isPending}
            onCancel={() => setCreating(false)}
            onSave={(input) => createMutation.mutate(input)}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            Loading…
          </p>
        ) : addresses.length === 0 && !creating ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            No saved addresses yet
          </p>
        ) : (
          addresses.map((a) =>
            editing?.id === a.id ? (
              <AddressForm
                key={a.id}
                address={a}
                saving={updateMutation.isPending}
                onCancel={() => setEditing(null)}
                onSave={(input) => updateMutation.mutate({ id: a.id, input })}
              />
            ) : (
              <div
                key={a.id}
                className="border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-sans text-[14px] text-white/90">{a.full_name}</p>
                      {a.is_default ? (
                        <span className="border border-white/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-md font-editorial text-[14px] leading-relaxed text-white/60">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}
                      {a.state ? `, ${a.state}` : ""} {a.postal_code}, {a.country}
                    </p>
                    {a.phone ? (
                      <p className="mt-1 font-mono text-[11px] text-white/40">{a.phone}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!a.is_default ? (
                      <button
                        onClick={() => defaultMutation.mutate(a.id)}
                        className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white"
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      onClick={() => {
                        setCreating(false);
                        setEditing(a);
                      }}
                      aria-label="Edit address"
                      className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/50 transition-colors hover:border-white/50 hover:text-white"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() =>
                        confirm({
                          title: "Delete address",
                          message: `Remove this address for ${a.full_name}? This cannot be undone.`,
                          confirmLabel: "Delete",
                          destructive: true,
                          onConfirm: () => deleteMutation.mutate(a.id),
                        })
                      }
                      aria-label="Delete address"
                      className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/50 transition-colors hover:border-red-400/50 hover:text-red-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
