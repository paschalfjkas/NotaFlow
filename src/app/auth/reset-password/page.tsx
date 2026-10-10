import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-muted/40 px-4 pt-24">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm sm:p-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
