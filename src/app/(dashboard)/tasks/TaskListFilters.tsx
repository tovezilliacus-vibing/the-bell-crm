"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
] as const;

export function TaskListFilters({
  currentFilter,
  contactId,
  searchQ,
}: {
  currentFilter: string;
  contactId?: string | null;
  searchQ?: string | null;
}) {
  const params = new URLSearchParams();
  if (contactId) params.set("contactId", contactId);
  if (searchQ) params.set("q", searchQ);
  const base = "/tasks";
  return (
    <div className="flex flex-wrap gap-1">
      {TABS.map((tab) => {
        const p = new URLSearchParams(params);
        p.set("filter", tab.value);
        const href = `${base}?${p.toString()}`;
        const isActive = currentFilter === tab.value || (!currentFilter && tab.value === "today");
        return (
          <Link
            key={tab.value}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
