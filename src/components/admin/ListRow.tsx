import { Pencil, Trash2 } from "lucide-react";

export function ListRow({
  index,
  thumbnail,
  title,
  subtitle,
  meta,
  onEdit,
  onDelete,
  deleteLabel,
}: {
  index?: number;
  thumbnail?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4 border border-white/10 bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
      {index !== undefined ? (
        <span className="w-6 shrink-0 font-mono text-[10px] text-white/25">
          #{String(index).padStart(2, "0")}
        </span>
      ) : null}
      {thumbnail ? (
        <div className="h-12 w-12 shrink-0 overflow-hidden border border-white/10 bg-white/5">
          {thumbnail}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[13px] text-white/90">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            {subtitle}
          </p>
        ) : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
      <div className="flex shrink-0 items-center gap-1.5">
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/50 transition-colors hover:border-white/50 hover:text-white"
          >
            <Pencil size={13} />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-label={deleteLabel ?? "Delete"}
            className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/50 transition-colors hover:border-red-400/50 hover:text-red-300"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
