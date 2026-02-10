"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setRecipeEnabled } from "./actions";

export function RecipeToggle({
  recipeId,
  enabled,
}: {
  recipeId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(enabled);

  async function handleToggle() {
    setPending(true);
    const next = !localEnabled;
    setLocalEnabled(next);
    const result = await setRecipeEnabled(recipeId, next);
    setPending(false);
    if (!result.ok) {
      setLocalEnabled(enabled);
    }
    router.refresh();
  }

  return (
    <Button
      variant={localEnabled ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={pending}
    >
      {pending ? "…" : localEnabled ? "On" : "Off"}
    </Button>
  );
}
