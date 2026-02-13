"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "LEAD", label: "Lead" },
  { value: "CONTACT", label: "Contact" },
] as const;

export function ContactListPersonTypeTabs({
  currentPersonType,
  stageParam,
  searchQ,
}: {
  currentPersonType: string;
  stageParam: string | null;
  searchQ?: string | null;
}) {
  const base = "/contacts";
  const stageQ = stageParam && stageParam !== "ALL" ? `stage=${stageParam}` : "";
  const qParam = searchQ ? `q=${encodeURIComponent(searchQ)}` : "";
  function href(value: string) {
    const parts = value === "ALL" ? [stageQ] : [stageQ, `personType=${value}`];
    const q = [...parts.filter(Boolean), qParam].filter(Boolean).join("&");
    return q ? `${base}?${q}` : base;
  }

  return (
    <div className="flex flex-wrap gap-1 pt-2">
      {TABS.map((tab) => {
        const isActive =
          (currentPersonType === "ALL" && tab.value === "ALL") ||
          currentPersonType === tab.value;
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
