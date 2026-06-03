import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getMemberships, getActiveTenant } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const memberships = await getMemberships();
  // Authenticated (middleware guarantees it) but no business yet → onboarding.
  if (memberships.length === 0) redirect("/onboarding");

  const active = await getActiveTenant();
  const tenants = memberships.map((m) => ({ id: m.tenant.id, name: m.tenant.name }));

  return (
    <div className="flex min-h-screen bg-transparent">
      <Nav tenants={tenants} activeTenantId={active?.id ?? null} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
