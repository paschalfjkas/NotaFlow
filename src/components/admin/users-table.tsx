"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { grantCreditsAction } from "@/app/admin/users/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  university: string | null;
  role: string;
  created_at: string;
  free_credits: number;
  paid_credits: number;
};

function UserRowItem({ user }: { user: AdminUserRow }) {
  const [amount, setAmount] = useState("1");
  const [isPending, startTransition] = useTransition();

  function handleGrant() {
    const credits = Number.parseInt(amount, 10);
    if (!Number.isFinite(credits) || credits <= 0) {
      toast.error("Enter a positive number of credits.");
      return;
    }
    startTransition(async () => {
      const result = await grantCreditsAction(user.id, credits);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Granted ${credits} credit${credits > 1 ? "s" : ""} to ${user.email}.`);
    });
  }

  return (
    <TableRow>
      <TableCell>
        <p className="max-w-48 truncate font-medium">{user.full_name || "—"}</p>
        <p className="max-w-48 truncate text-xs text-muted-foreground">{user.email}</p>
      </TableCell>
      <TableCell>{user.university || "—"}</TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
      </TableCell>
      <TableCell>{user.free_credits + user.paid_credits}</TableCell>
      <TableCell>{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-16"
            aria-label={`Credits to grant ${user.email}`}
          />
          <Button size="sm" variant="outline" disabled={isPending} onClick={handleGrant}>
            {isPending ? "…" : "Grant"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = users.filter((u) =>
    `${u.full_name} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or email…"
        aria-label="Search users by name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Grant credits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <UserRowItem key={u.id} user={u} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No matching users.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
