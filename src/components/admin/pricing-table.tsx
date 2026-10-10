"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createPricingPackageAction,
  togglePricingPackageActiveAction,
  updatePricingPackageAction,
} from "@/app/admin/pricing/actions";
import { formatKobo } from "@/lib/payments/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PricingPackageRow = {
  id: string;
  key: string;
  name: string;
  credits: number;
  price_kobo: number;
  active: boolean;
  sort_order: number;
};

function ToggleActiveButton({ pkg }: { pkg: PricingPackageRow }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await togglePricingPackageActiveAction(pkg.id, !pkg.active);
      if ("error" in result) toast.error(result.error);
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handleToggle}>
      {isPending ? "…" : pkg.active ? "Deactivate" : "Activate"}
    </Button>
  );
}

function EditPackageDialog({ pkg }: { pkg: PricingPackageRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePricingPackageAction(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Package updated.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label={`Edit ${pkg.name}`}>
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {pkg.name}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={pkg.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`name-${pkg.id}`}>Name</Label>
            <Input id={`name-${pkg.id}`} name="name" defaultValue={pkg.name} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`credits-${pkg.id}`}>Credits</Label>
              <Input
                id={`credits-${pkg.id}`}
                name="credits"
                type="number"
                min={1}
                defaultValue={pkg.credits}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`price-${pkg.id}`}>Price (₦)</Label>
              <Input
                id={`price-${pkg.id}`}
                name="priceNaira"
                type="number"
                min={1}
                defaultValue={pkg.price_kobo / 100}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`sort-${pkg.id}`}>Sort order</Label>
            <Input
              id={`sort-${pkg.id}`}
              name="sortOrder"
              type="number"
              defaultValue={pkg.sort_order}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewPackageDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createPricingPackageAction(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Package created.");
      setOpen(false);
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 size-4" /> New Package
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-key">Key</Label>
            <Input id="new-key" name="key" placeholder="e.g. ten_pack" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" name="name" placeholder="e.g. 10 Reports" required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-credits">Credits</Label>
              <Input id="new-credits" name="credits" type="number" min={1} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-price">Price (₦)</Label>
              <Input id="new-price" name="priceNaira" type="number" min={1} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-sort">Sort order</Label>
            <Input id="new-sort" name="sortOrder" type="number" defaultValue={0} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PricingTable({ packages }: { packages: PricingPackageRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewPackageDialog />
      </div>
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>{pkg.name}</TableCell>
                <TableCell className="font-mono text-xs">{pkg.key}</TableCell>
                <TableCell>{pkg.credits}</TableCell>
                <TableCell>{formatKobo(pkg.price_kobo)}</TableCell>
                <TableCell>
                  <Badge variant={pkg.active ? "default" : "secondary"}>
                    {pkg.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <ToggleActiveButton pkg={pkg} />
                    <EditPackageDialog pkg={pkg} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {packages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No packages yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
