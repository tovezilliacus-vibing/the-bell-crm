"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createCompany } from "./actions";
import type { CompanyLifecycle } from "@prisma/client";

const LIFECYCLE_OPTIONS: { value: CompanyLifecycle; label: string }[] = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
];

export function AddCompanyForm() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<CompanyLifecycle>("PROSPECT");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      setError("Company name is required.");
      return;
    }
    setPending(true);
    const result = await createCompany({ name, lifecycleStage: lifecycle });
    setPending(false);
    if (result.ok) {
      form.reset();
      setLifecycle("PROSPECT");
      setOpen(false);
    } else {
      setError(result.error ?? "Failed to create company.");
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Add company</Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Add company</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Add a new company. Choose lifecycle: Prospect (potential customer) or Customer.
      </p>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="company-name">Company name</Label>
        <Input
          id="company-name"
          name="name"
          placeholder="Acme Inc."
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label>Lifecycle stage</Label>
        <Select
          className="mt-1"
          options={LIFECYCLE_OPTIONS}
          value={lifecycle}
          onChange={(e) => setLifecycle(e.target.value as CompanyLifecycle)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add company"}
        </Button>
      </div>
    </form>
  );
}
