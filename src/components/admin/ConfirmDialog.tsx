import { useCallback, useState } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

/**
 * Renders a dark, on-brand confirm modal instead of the browser's native
 * confirm() popup. Usage: const { confirm, dialog } = useConfirm(); render
 * {dialog} once in the tree, then call confirm({...}) wherever a destructive
 * action needs a checkpoint.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => setState(opts), []);
  const close = () => setState(null);

  const dialog = state ? (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="grain relative w-full max-w-sm border border-white/15 bg-noir p-6"
      >
        <h3 className="font-display text-lg uppercase tracking-[-0.01em] text-white">
          {state.title}
        </h3>
        <p className="mt-3 font-mono text-[12px] leading-relaxed text-white/55">{state.message}</p>
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            autoFocus
            onClick={() => {
              state.onConfirm();
              close();
            }}
            className={`border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.28em] transition-colors ${
              state.destructive
                ? "border-red-500/60 bg-red-500/90 text-white hover:bg-transparent hover:text-red-400"
                : "border-white bg-white text-black hover:bg-transparent hover:text-white"
            }`}
          >
            {state.confirmLabel ?? "Confirm"}
          </button>
          <button
            type="button"
            onClick={close}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
