"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createForm } from "./actions";

export function CreateFormForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    setPending(true);
    const result = await createForm({
      name,
      description: (form.elements.namedItem("description") as HTMLInputElement).value || null,
    });
    setPending(false);
    if (result.ok && result.formId) {
      router.push(`/forms/${result.formId}`);
      return;
    }
    setError(result.error ?? "Failed to create form");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Form name</Label>
        <Input id="name" name="name" placeholder="e.g. Contact us" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" name="description" placeholder="Short description for your reference" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create form"}
      </Button>
    </form>
  );
}
