import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clearTestData, seedTestData } from "@/lib/test-data.functions";

/** Temporary helpers for filling Orders/Messages with tagged dummy rows. */
export function TestDataControls() {
  const qc = useQueryClient();
  const refresh = () =>
    ["admin-orders", "admin-returns", "admin-messages", "admin-customers", "admin-dashboard"].forEach((key) =>
      qc.invalidateQueries({ queryKey: [key] }),
    );

  const seed = useMutation({
    mutationFn: () => seedTestData(),
    onSuccess: (r) => {
      toast.success(
        `Added ${r.orders} orders, ${r.returns} returns, ${r.exchanges} exchanges and ${r.messages} messages`,
      );
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: () => clearTestData(),
    onSuccess: () => {
      toast.success("Test data removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buttonClass =
    "border border-black/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-700 transition-colors hover:border-black hover:text-black disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => seed.mutate()}
        disabled={seed.isPending || clear.isPending}
        className={buttonClass}
      >
        {seed.isPending ? "Adding…" : "Add test data"}
      </button>
      <button
        onClick={() => clear.mutate()}
        disabled={seed.isPending || clear.isPending}
        className={buttonClass}
      >
        {clear.isPending ? "Removing…" : "Remove test data"}
      </button>
    </div>
  );
}
