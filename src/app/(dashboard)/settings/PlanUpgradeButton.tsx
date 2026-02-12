"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateWorkspacePlan } from "./team-actions";

export function PlanUpgradeButton({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (currentPlan !== "FREE") return null;

  async function handleUpgrade() {
    setPending(true);
    const result = await updateWorkspacePlan("STARTER");
    setPending(false);
    if (result.ok) router.refresh();
    else alert(result.error ?? "Failed to upgrade");
  }

  return (
    <Button onClick={handleUpgrade} disabled={pending} size="sm" variant="outline">
      {pending ? "Upgrading…" : "Upgrade to Starter"}
    </Button>
  );
}
