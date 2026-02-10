"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateForm } from "./actions";

export function FormActiveToggle({
  formId,
  isActive,
}: {
  formId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [local, setLocal] = useState(isActive);

  async function handleToggle() {
    setPending(true);
    const next = !local;
    setLocal(next);
    const result = await updateForm(formId, { isActive: next });
    setPending(false);
    if (!result.ok) setLocal(isActive);
    router.refresh();
  }

  return (
    <Button
      variant={local ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={pending}
    >
      {pending ? "…" : local ? "Active" : "Inactive"}
    </Button>
  );
}
