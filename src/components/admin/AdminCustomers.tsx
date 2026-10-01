import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User } from "lucide-react";
import { listCustomers } from "@/lib/admin-users.functions";

export function AdminCustomers() {
  const [query, setQuery] = useState("");
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => listCustomers(),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.email, c.fullName, c.phone, c.instagram].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [customers, query]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase tracking-[-0.01em] text-neutral-900">
            Customers — {customers.length}
          </h2>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Every account registered on the site
          </p>
        </div>
        <label className="flex w-full items-center gap-2 border border-black/15 px-3 py-2 transition-colors focus-within:border-black/60 sm:w-72">
          <Search size={14} className="shrink-0 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone"
            className="w-full bg-transparent font-mono text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </label>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            Loading…
          </p>
        ) : error ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-red-600">
            {(error as Error).message}
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 font-mono text-[12px] uppercase tracking-[0.3em] text-neutral-500">
            {customers.length === 0 ? "No customers yet" : "No matches"}
          </p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.userId}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-black/10 bg-black/[0.02] px-4 py-3.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-black/10 bg-black/5 text-neutral-400">
                <User size={16} />
              </div>
              <div className="min-w-[160px] flex-1">
                <p className="flex items-center gap-2 truncate font-sans text-[14px] text-neutral-900">
                  {c.fullName || c.email}
                  {c.isAdmin ? (
                    <span className="border border-black/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                      Admin
                    </span>
                  ) : null}
                </p>
                {c.fullName ? (
                  <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500">{c.email}</p>
                ) : null}
                {c.phone || c.instagram ? (
                  <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500">
                    {[c.phone, c.instagram ? `@${c.instagram.replace(/^@/, "")}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right font-mono text-[11px] text-neutral-500">
                <p>Joined {new Date(c.createdAt).toLocaleDateString()}</p>
                <p className="mt-0.5">
                  {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
