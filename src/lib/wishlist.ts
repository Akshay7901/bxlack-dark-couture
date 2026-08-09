import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const EVENT = "bxlack:wishlist-change";
const keyFor = (userId: string) => `bxlack:wishlist:${userId}`;

function read(userId: string | null): string[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(userId: string, ids: string[]) {
  window.localStorage.setItem(keyFor(userId), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useWishlist() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(read(userId));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [userId]);

  /** Returns false when the visitor is signed out (caller should prompt to sign in). */
  const toggle = useCallback(
    (id: string) => {
      if (!userId) return false;
      const current = read(userId);
      write(userId, current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
      return true;
    },
    [userId],
  );

  const remove = useCallback(
    (id: string) => {
      if (!userId) return;
      write(userId, read(userId).filter((x) => x !== id));
    },
    [userId],
  );

  const clear = useCallback(() => {
    if (userId) write(userId, []);
  }, [userId]);

  return {
    ids,
    isSignedIn: Boolean(userId),
    authLoading: loading,
    has: (id: string) => ids.includes(id),
    toggle,
    remove,
    clear,
  };
}
