"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, CreditCard, FileText, LayoutDashboard, LogOut, Tags, Users } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/payments", label: "Payments", icon: Banknote },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/pricing", label: "Pricing", icon: Tags },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/admin">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Back to app</Link>
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium",
              isActive(href)
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
