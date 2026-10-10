import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Your first SIWES report is on us
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Create a free account to get started. No card required.
      </p>
      <RegisterForm />
    </div>
  );
}
