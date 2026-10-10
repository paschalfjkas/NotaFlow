"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FileText, LayoutDashboard, LogOut, Menu, Settings } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { cn } from "cn";

const NAV_ITEMS = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

// Shown only in the hamburger sheet (mobile + the menu button), not in the
// desktop inline nav — the desktop top bar stays just "Dashboard".
const SHEET_ONLY_ITEMS = [
  { href: "/dashboard/reports", label: "My Reports", icon: FileText },
  { href: "/dashboard/billing", label: "Buy Credits", icon: CreditCard },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function DashboardNav({ fullName, email }: { fullName: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function renderNavLinks(items: typeof NAV_ITEMS) {
    return (
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  const navLinks = renderNavLinks(NAV_ITEMS);
  const sheetNavLinks = renderNavLinks([...NAV_ITEMS, ...SHEET_ONLY_ITEMS]);

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400">
              {initials(fullName || email).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{fullName || "Student"}</p>
          <p className="truncate text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 size-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-left text-red-600 dark:text-red-400">
              <LogOut className="mr-2 size-4" /> Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetTitle className="mb-4">
                <Logo />
              </SheetTitle>
              {sheetNavLinks}
            </SheetContent>
          </Sheet>
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="hidden md:flex md:items-center md:gap-1">{navLinks}</div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {userMenu}
        </div>
      </div>
    </header>
  );
}
