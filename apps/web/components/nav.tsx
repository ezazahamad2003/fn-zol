"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Calls" },
  { href: "/tasks",     label: "Tasks" },
  { href: "/messages",  label: "Messages" },
  { href: "/settings",  label: "Settings" },
];

export function Nav({ tenantName }: { tenantName: string }) {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Tenant</div>
        <div className="text-sm font-semibold mt-0.5">{tenantName}</div>
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-0.5">
        {ITEMS.map((it) => {
          const active = path === it.href || path?.startsWith(`${it.href}/`) || (it.href === "/dashboard" && path?.startsWith("/calls"));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-[10px] text-muted-foreground border-t border-border">
        ZOL · voice core · stubs on
      </div>
    </aside>
  );
}
