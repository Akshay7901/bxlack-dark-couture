import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Home,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Rocket,
  Search,
  Settings,
  Shirt,
  Tag,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard.functions";

export type NavKey =
  | "overview"
  | "orders"
  | "returns"
  | "exchanges"
  | "products"
  | "categories"
  | "customers"
  | "discounts"
  | "messages"
  | "emails"
  | "launch"
  | "team";

type NavItem = {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  /** Count shown as a pill, from the dashboard stats. */
  count?: (s: DashboardStats) => number;
  children?: { key: NavKey; label: string; count?: (s: DashboardStats) => number }[];
};

const MAIN_NAV: NavItem[] = [
  { key: "overview", label: "Home", icon: Home },
  {
    key: "orders",
    label: "Orders",
    icon: Package,
    count: (s) => s.toFulfil,
    children: [
      { key: "returns", label: "Returns", count: (s) => s.returnsToReview },
      { key: "exchanges", label: "Exchanges", count: (s) => s.exchangesToReview },
    ],
  },
  {
    key: "products",
    label: "Products",
    icon: Shirt,
    children: [{ key: "categories", label: "Category images" }],
  },
  { key: "customers", label: "Customers", icon: UserRound },
  { key: "discounts", label: "Discounts", icon: Tag },
  { key: "messages", label: "Messages", icon: MessageSquare, count: (s) => s.unreadMessages },
];

const STORE_NAV: NavItem[] = [
  { key: "emails", label: "Email templates", icon: Mail },
  { key: "launch", label: "Launch", icon: Rocket },
];

export function AdminLayout({
  active,
  onNavigate,
  onSearch,
  email,
  onSignOut,
  children,
}: {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  onSearch: (query: string) => void;
  email: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getDashboardStats(),
    staleTime: 60_000,
  });

  const go = (key: NavKey) => {
    onNavigate(key);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const sidebar = (
    <nav aria-label="Studio" className="flex h-full flex-col gap-4 px-3 py-4">
      <NavList items={MAIN_NAV} active={active} stats={stats} onSelect={go} />
      <div>
        <p className="px-3 pb-1 text-[12px] font-semibold text-[#616161]">Store</p>
        <NavList items={STORE_NAV} active={active} stats={stats} onSelect={go} />
      </div>
      <div className="mt-auto">
        <NavList
          items={[{ key: "team", label: "Settings", icon: Settings }]}
          active={active}
          stats={stats}
          onSelect={go}
        />
      </div>
    </nav>
  );

  return (
    <div className="admin-ui min-h-screen overflow-x-clip">
      <TopBar email={email} onSignOut={onSignOut} onSearch={onSearch} onMenu={() => setMenuOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto bg-[var(--a-sidebar)] lg:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Studio menu">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 h-full w-full cursor-default rounded-none bg-black/40"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto bg-[var(--a-sidebar)] shadow-xl">
              <div className="flex items-center justify-between px-5 pt-4">
                <img src="/label-signature.png" alt="BXLACK" className="h-10 w-auto" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center hover:bg-black/5"
                >
                  <X size={18} />
                </button>
              </div>
              {sidebar}
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1000px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavList({
  items,
  active,
  stats,
  onSelect,
}: {
  items: NavItem[];
  active: NavKey;
  stats: DashboardStats | undefined;
  onSelect: (key: NavKey) => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const childActive = item.children?.some((c) => c.key === active) ?? false;
        const isActive = item.key === active;
        const expanded = isActive || childActive;
        const count = stats && item.count ? item.count(stats) : 0;
        return (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] font-semibold transition-colors ${
                isActive ? "bg-white text-[#303030] shadow-[0_1px_0_#1a1a1a12]" : "text-[#303030] hover:bg-[#f7f7f7]/70"
              }`}
            >
              <Icon size={16} className={isActive || childActive ? "text-[#303030]" : "text-[#616161]"} />
              <span className="flex-1">{item.label}</span>
              {count > 0 ? <CountPill n={count} /> : null}
            </button>
            {item.children && expanded ? (
              <ul className="mt-0.5 flex flex-col gap-0.5">
                {item.children.map((c) => {
                  const cActive = c.key === active;
                  const cCount = stats && c.count ? c.count(stats) : 0;
                  return (
                    <li key={c.key}>
                      <button
                        type="button"
                        onClick={() => onSelect(c.key)}
                        aria-current={cActive ? "page" : undefined}
                        className={`flex w-full items-center gap-2 py-1.5 pl-[38px] pr-3 text-left text-[13px] transition-colors ${
                          cActive
                            ? "bg-white font-semibold text-[#303030] shadow-[0_1px_0_#1a1a1a12]"
                            : "text-[#616161] hover:bg-[#f7f7f7]/70 hover:text-[#303030]"
                        }`}
                      >
                        <span className="flex-1">{c.label}</span>
                        {cCount > 0 ? <CountPill n={cCount} /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function CountPill({ n }: { n: number }) {
  return (
    <span className="min-w-5 rounded-full bg-[#e3e3e3] px-1.5 text-center text-[11px] font-semibold leading-5 text-[#303030]">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function TopBar({
  email,
  onSignOut,
  onSearch,
  onMenu,
}: {
  email: string;
  onSignOut: () => void;
  onSearch: (q: string) => void;
  onMenu: () => void;
}) {
  const [q, setQ] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [accountOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-[var(--a-topbar)] px-3 text-white sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="hidden shrink-0 items-center gap-2.5 sm:flex lg:w-[228px]">
        <img src="/email-signature.png" alt="BXLACK" className="h-10 w-auto" />
        <span className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/70 sm:inline">
          Studio
        </span>
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onSearch(q.trim());
        }}
        className="mx-auto flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 focus-within:border-white/40 sm:max-w-[480px]"
      >
        <Search size={15} className="shrink-0 text-white/60" />
        <input
          id="studio-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search orders"
          aria-label="Search orders"
          className="h-8 w-full !rounded-none !border-0 !bg-transparent text-[13px] text-white !shadow-none outline-none placeholder:text-white/50"
        />
      </form>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-white/80 hover:bg-white/10 hover:text-white md:flex"
      >
        View store <ExternalLink size={13} />
      </a>

      <div ref={accountRef} className="relative">
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-label="Account"
          className="flex items-center gap-2 px-1.5 py-1 hover:bg-white/10"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#36fba1] text-[13px] font-bold text-[#0c5132]">
            {(email[0] ?? "A").toUpperCase()}
          </span>
        </button>
        {accountOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-[#e3e3e3] bg-white text-[#303030] shadow-lg"
          >
            <div className="border-b border-[#e3e3e3] px-4 py-3">
              <p className="text-[12px] text-[#616161]">Signed in as</p>
              <p className="truncate text-[13px] font-semibold">{email}</p>
            </div>
            <a role="menuitem" href="/" target="_blank" rel="noreferrer" className="block px-4 py-2.5 text-[13px] hover:bg-[#f7f7f7]">
              View store
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={onSignOut}
              className="block w-full rounded-none px-4 py-2.5 text-left text-[13px] hover:bg-[#f7f7f7]"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
