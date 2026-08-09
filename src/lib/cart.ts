import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const EVENT = "bxlack:cart-change";
const keyFor = (userId: string | null) => `bxlack:cart:${userId ?? "guest"}`;

export type CartLine = {
  id: string;
  size: string;
  qty: number;
};

function read(userId: string | null): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        l && typeof l.id === "string" && typeof l.size === "string" && typeof l.qty === "number",
    );
  } catch {
    return [];
  }
}

function write(userId: string | null, lines: CartLine[]) {
  window.localStorage.setItem(keyFor(userId), JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(EVENT));
}

const lineKey = (l: Pick<CartLine, "id" | "size">) => `${l.id}::${l.size}`;

export function useCart() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setLines(read(userId));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [userId]);

  const add = useCallback(
    (id: string, size: string, qty = 1) => {
      const current = read(userId);
      const key = lineKey({ id, size });
      const existing = current.find((l) => lineKey(l) === key);
      const next = existing
        ? current.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(l.qty + qty, 10) } : l))
        : [...current, { id, size, qty }];
      write(userId, next);
    },
    [userId],
  );

  const setQty = useCallback(
    (id: string, size: string, qty: number) => {
      const key = lineKey({ id, size });
      const next = read(userId)
        .map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(0, Math.min(qty, 10)) } : l))
        .filter((l) => l.qty > 0);
      write(userId, next);
    },
    [userId],
  );

  const remove = useCallback(
    (id: string, size: string) => {
      const key = lineKey({ id, size });
      write(userId, read(userId).filter((l) => lineKey(l) !== key));
    },
    [userId],
  );

  const clear = useCallback(() => write(userId, []), [userId]);

  const count = lines.reduce((n, l) => n + l.qty, 0);

  return { lines, count, add, setQty, remove, clear, authLoading: loading };
}
