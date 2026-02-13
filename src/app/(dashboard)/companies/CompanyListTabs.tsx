"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
] as const;

export function CompanyListTabs({
  currentLifecycle,
  searchQ,
}: {
  currentLifecycle: string;
  searchQ?: string | null;
}) {
  function href(value: string) {
    const parts = value === "ALL" ? [] : [`lifecycle=${value}`];
    if (searchQ) parts.push(`q=${encodeURIComponent(searchQ)}`);
    return parts.length ? `/companies?${parts.join("&")}` : "/companies";
  }
  return (
    <div className="flex flex-wrap gap-1 pt-2">
      {TABS.map((tab) => {
        const isActive =
          (currentLifecycle === "ALL" && tab.value === "ALL") ||
          currentLifecycle === tab.value;
        return (
          <Link
            key={tab.value}
            href={href(tab.value)}
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
