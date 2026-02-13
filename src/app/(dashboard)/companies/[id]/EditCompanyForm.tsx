"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateCompany } from "../actions";
import type { CompanyLifecycle } from "@prisma/client";

const LIFECYCLE_OPTIONS: { value: CompanyLifecycle; label: string }[] = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
];

export function EditCompanyForm({
  companyId,
  currentName,
  currentLifecycle,
}: {
  companyId: string;
  currentName: string;
  currentLifecycle: CompanyLifecycle;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(currentName);
  const [lifecycle, setLifecycle] = useState<CompanyLifecycle>(currentLifecycle);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = name?.trim();
    if (!trimmed) {
      setError("Company name is required.");
      return;
    }
    setPending(true);
    const result = await updateCompany(companyId, { name: trimmed, lifecycleStage: lifecycle });
    setPending(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update company.");
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit company
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit company</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setName(currentName);
            setLifecycle(currentLifecycle);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Change name or lifecycle stage (Prospect / Customer).
      </p>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="edit-company-name">Company name</Label>
        <Input
          id="edit-company-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setName(currentName);
            setLifecycle(currentLifecycle);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
