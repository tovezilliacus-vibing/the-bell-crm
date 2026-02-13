"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PersonType } from "@prisma/client";
import { updateContact } from "../actions";

const PERSON_TYPE_OPTIONS: { value: PersonType; label: string }[] = [
  { value: "LEAD", label: "Lead" },
  { value: "CONTACT", label: "Contact" },
];

export function PersonTypeForm({
  contactId,
  currentPersonType,
}: {
  contactId: string;
  currentPersonType: PersonType;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<PersonType>(currentPersonType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected === currentPersonType) return;
    setPending(true);
    const result = await updateContact(contactId, { personType: selected });
    setPending(false);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor="person-type-select" className="text-sm text-muted-foreground sr-only">
        Person type
      </label>
      <select
        id="person-type-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value as PersonType)}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {PERSON_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        disabled={selected === currentPersonType || pending}
      >
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
