import Link from "next/link";
import { CopyrightYear } from "@/components/marketing/copyright-year";
import { Logo } from "@/components/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            AI-powered SIWES and industrial training reports for Nigerian university and
            polytechnic students.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/#how-it-works" className="hover:text-foreground">
            How it works
          </Link>
          <Link href="/#pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Get started
          </Link>
        </nav>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © <CopyrightYear /> NotaFlow. Built for Nigerian students.
      </div>
    </footer>
  );
}
