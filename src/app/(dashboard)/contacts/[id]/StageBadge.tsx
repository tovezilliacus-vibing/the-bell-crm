import { cn } from "@/lib/utils";
import { FUNNEL_STAGE_LABELS } from "@/lib/funnel";
import type { FunnelStage } from "@prisma/client";

const STAGE_COLORS: Record<FunnelStage, string> = {
  AWARENESS: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  INTEREST: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  DESIRE: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  ACTION: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
};

export function StageBadge({ stage }: { stage: FunnelStage }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STAGE_COLORS[stage]
      )}
    >
      {FUNNEL_STAGE_LABELS[stage]}
    </span>
  );
}
