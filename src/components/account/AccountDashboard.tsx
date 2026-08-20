import { useState } from "react";
import { MapPin, Package, User as UserIcon } from "lucide-react";
import { ProfileSection } from "./ProfileSection";
import { AddressesSection } from "./AddressesSection";
import { OrdersSection } from "./OrdersSection";

const NAV_ITEMS = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "orders", label: "Orders", icon: Package },
] as const;
type NavKey = (typeof NAV_ITEMS)[number]["key"];

export function AccountDashboard({
  userId,
  email,
  onSignOut,
}: {
  userId: string;
  email: string;
  onSignOut: () => void;
}) {
  const [active, setActive] = useState<NavKey>("profile");

  return (
    <section className="relative pt-24 pb-32 sm:pt-28 md:pt-24">
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
              Account
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
              {email}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40 hover:text-white"
          >
            Sign out
          </button>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[190px_1fr] md:gap-12">
          <nav className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`flex shrink-0 items-center gap-2.5 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:bg-white/5 hover:text-white/70"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-white" : "text-white/35"} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="min-w-0">
            {active === "profile" ? <ProfileSection userId={userId} email={email} /> : null}
            {active === "addresses" ? <AddressesSection userId={userId} /> : null}
            {active === "orders" ? <OrdersSection /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
