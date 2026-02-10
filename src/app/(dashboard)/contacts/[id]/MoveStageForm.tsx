"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FUNNEL_STAGES, FUNNEL_STAGE_LABELS } from "@/lib/funnel";
import type { FunnelStage } from "@prisma/client";
import { updateContactFunnelStage } from "./actions";

const STAGE_OPTIONS = FUNNEL_STAGES.map((s) => ({
  value: s,
  label: FUNNEL_STAGE_LABELS[s],
}));

export function MoveStageForm({
  contactId,
  currentStage,
}: {
  contactId: string;
  currentStage: FunnelStage;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<FunnelStage>(currentStage);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected === currentStage) return;
    setPending(true);
    const result = await updateContactFunnelStage(contactId, selected);
    setPending(false);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor="stage-select" className="text-sm text-muted-foreground sr-only">
        Move to stage
      </label>
      <select
        id="stage-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value as FunnelStage)}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STAGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        disabled={selected === currentStage || pending}
      >
        {pending ? "Moving…" : "Move"}
      </Button>
    </form>
  );
}
