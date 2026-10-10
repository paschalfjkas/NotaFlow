import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetches the signed-in user's profile and 404-redirects non-admins to
 * /dashboard. The middleware already gates /admin/* on `role === "admin"`,
 * but every admin page/action re-checks here too — the same
 * defense-in-depth pattern as requireUser(), since middleware alone is one
 * mistake away from a route slipping through ungated.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return { user, profile };
}
