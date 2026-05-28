import { Nav } from "@/components/nav";
import { getActiveTenant } from "@/lib/tenant-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getActiveTenant();
  const name = tenant?.name ?? "(no tenant)";
  return (
    <div className="flex min-h-screen">
      <Nav tenantName={name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
