"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ACTIVE_TENANT_COOKIE } from "@/lib/constants";

const ITEMS = [
  { href: "/dashboard",    label: "Calls",        hint: "Call log" },
  { href: "/appointments", label: "Appointments", hint: "Calendar" },
  { href: "/tasks",        label: "Tasks",        hint: "Follow-ups" },
  { href: "/messages",     label: "Messages",     hint: "Inbox" },
  { href: "/settings",     label: "Settings",     hint: "Configure" },
];

export type NavTenant = { id: string; name: string };

export function Nav({ tenants, activeTenantId }: { tenants: NavTenant[]; activeTenantId: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  function switchTenant(id: string) {
    document.cookie = `${ACTIVE_TENANT_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border/80 bg-white/90 min-h-screen flex flex-col shadow-[1px_0_0_hsl(220_13%_91%_/_0.4)]">
      <div className="px-4 py-5 border-b border-border/70">
        <div className="flex items-center gap-3 mb-5">
          <img
            alt=""
            aria-hidden="true"
            className="h-9 w-9 rounded-full object-cover shadow-sm ring-1 ring-black/5"
            src="/zol-logo.png"
          />
          <div>
            <div className="text-sm font-semibold">ZOL</div>
            <div className="text-[11px] text-muted-foreground">Voice operations</div>
          </div>
        </div>

        <div className="text-[11px] uppercase text-muted-foreground">Business</div>
        {tenants.length > 1 ? (
          <select
            value={active?.id}
            onChange={(e) => switchTenant(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm shadow-sm"
          >
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        ) : (
          <div className="text-sm font-semibold mt-1 truncate">{active?.name ?? "(no business)"}</div>
        )}
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {ITEMS.map((it) => {
          const isActive = path === it.href || path?.startsWith(`${it.href}/`) || (it.href === "/dashboard" && path?.startsWith("/calls"));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{it.label}</span>
                <span className={cn("text-[10px]", isActive ? "text-slate-300" : "text-muted-foreground group-hover:text-slate-500")}>
                  {it.hint}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/70 space-y-2">
        <button onClick={signOut} className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100">
          Sign out
        </button>
        <div className="rounded-md border border-border bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-medium text-slate-700">Agent status</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ready for calls
          </div>
        </div>
      </div>
    </aside>
  );
}
