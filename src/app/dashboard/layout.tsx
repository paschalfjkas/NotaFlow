import { requireUser } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

// Every route under /dashboard is per-user and auth-gated — never prerender it.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireUser();

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardNav fullName={profile?.full_name ?? ""} email={user.email ?? ""} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 outline-none">{children}</main>
    </div>
  );
}
