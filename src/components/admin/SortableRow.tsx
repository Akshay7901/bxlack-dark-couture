import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";

/**
 * A Reorder.Item that only drags from its grip handle, so clicks on the row's
 * buttons never start a drag. The handle also moves the row with ↑ / ↓ keys.
 */
export function SortableRow({
  value,
  label,
  onDragEnd,
  onMove,
  children,
}: {
  value: string;
  label: string;
  onDragEnd: () => void;
  onMove: (direction: -1 | 1) => void;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const controls = useDragControls();

  const handle = (
    <button
      type="button"
      aria-label={`Reorder ${label} (use arrow keys)`}
      onPointerDown={(e) => {
        e.preventDefault();
        controls.start(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          onMove(e.key === "ArrowUp" ? -1 : 1);
        }
      }}
      className="-ml-1 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-400 transition-colors hover:text-black focus-visible:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-black active:cursor-grabbing"
    >
      <GripVertical size={16} />
    </button>
  );

  return (
    <Reorder.Item
      as="div"
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.01, boxShadow: "0 12px 30px -12px rgba(0,0,0,0.25)" }}
      className="relative"
    >
      {children(handle)}
    </Reorder.Item>
  );
}
