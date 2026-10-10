import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = { title: "Settings" };
export const instant = false;

export default async function SettingsPage() {
  const { user, profile } = await requireUser();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and account.</p>
      </div>

      <section className="space-y-5 rounded-xl border bg-background p-6">
        <div>
          <h2 className="font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <ProfileForm
          defaultValues={{
            fullName: profile?.full_name ?? "",
            university: profile?.university ?? "",
            faculty: profile?.faculty ?? "",
            department: profile?.department ?? "",
            programme: profile?.programme ?? "",
            matricNumber: profile?.matric_number ?? "",
            academicSession: profile?.academic_session ?? "",
            graduationYear: profile?.graduation_year ? String(profile.graduation_year) : "",
          }}
        />
      </section>

      <section className="space-y-5 rounded-xl border bg-background p-6">
        <div>
          <h2 className="font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground">
            Update the password you use to sign in.
          </p>
        </div>
        <ResetPasswordForm />
      </section>
    </div>
  );
}
