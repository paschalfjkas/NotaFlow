import Link from "next/link";
import { Logo } from "@/components/logo";

export const instant = false;

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Save &amp; continue later
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-6 outline-none">{children}</main>
    </div>
  );
}
