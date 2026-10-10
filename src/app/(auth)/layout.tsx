import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="flex items-center justify-center py-8">
        <Link href="/">
          <Logo size={32} textClassName="text-lg" />
        </Link>
      </header>
      <main id="main-content" tabIndex={-1} className="flex flex-1 items-start justify-center px-4 pb-16 outline-none">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
