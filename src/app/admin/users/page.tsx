import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable, type AdminUserRow } from "@/components/admin/users-table";

export const instant = false;

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: credits }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, university, role, created_at")
      .order("created_at", { ascending: false }),
    admin.from("credits").select("user_id, free_credits, paid_credits"),
  ]);

  const creditsById = new Map((credits ?? []).map((c) => [c.user_id, c]));
  const rows: AdminUserRow[] = (profiles ?? []).map((p) => ({
    ...p,
    free_credits: creditsById.get(p.id)?.free_credits ?? 0,
    paid_credits: creditsById.get(p.id)?.paid_credits ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">
          {rows.length} registered student{rows.length === 1 ? "" : "s"}.
        </p>
      </div>
      <UsersTable users={rows} />
    </div>
  );
}
