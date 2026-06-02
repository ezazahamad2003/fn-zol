"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ACTIVE_TENANT_COOKIE } from "@/lib/constants";

const ITEMS = [
  { href: "/dashboard",    label: "Calls" },
  { href: "/appointments", label: "Appointments" },
  { href: "/tasks",        label: "Tasks" },
  { href: "/messages",     label: "Messages" },
  { href: "/settings",     label: "Settings" },
];

export type NavTenant = { id: string; name: string };

export function Nav({ tenants, activeTenantId }: { tenants: NavTenant[]; activeTenantId: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  function switchTenant(id: string) {
    // 1-year cookie; getActiveTenant reads it server-side on the next render.
    document.cookie = `${ACTIVE_TENANT_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Business</div>
        {tenants.length > 1 ? (
          <select
            value={active?.id}
            onChange={(e) => switchTenant(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
          >
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        ) : (
          <div className="text-sm font-semibold mt-0.5">{active?.name ?? "(no business)"}</div>
        )}
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-0.5">
        {ITEMS.map((it) => {
          const isActive = path === it.href || path?.startsWith(`${it.href}/`) || (it.href === "/dashboard" && path?.startsWith("/calls"));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-2">
        <button onClick={signOut} className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted">
          Sign out
        </button>
        <div className="text-[10px] text-muted-foreground">ZOL · voice agent</div>
      </div>
    </aside>
  );
}
