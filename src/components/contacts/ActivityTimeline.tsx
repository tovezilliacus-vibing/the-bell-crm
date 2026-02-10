import type { ActivityType } from "@prisma/client";
import { cn } from "@/lib/utils";

export type TimelineItem =
  | {
      kind: "activity";
      id: string;
      type: ActivityType;
      description: string | null;
      occurredAt: Date;
    }
  | {
      kind: "task_completed";
      id: string;
      title: string;
      completedAt: Date | null;
    };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No activities or completed tasks yet.
      </p>
    );
  }

  return (
    <ul className="space-y-0">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 && (
            <span
              className="absolute left-[11px] top-6 bottom-0 w-px bg-border"
              aria-hidden
            />
          )}
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium",
              item.kind === "activity"
                ? "border-primary/30 text-primary"
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {item.kind === "activity" ? (
              item.type === "EMAIL" ? "E" : item.type === "CALL" ? "C" : "N"
            ) : (
              "✓"
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            {item.kind === "activity" ? (
              <>
                <p className="text-sm font-medium capitalize">
                  {item.type.toLowerCase()}
                </p>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Task completed</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.title}
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(
                item.kind === "activity" ? item.occurredAt : item.completedAt ?? new Date()
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
