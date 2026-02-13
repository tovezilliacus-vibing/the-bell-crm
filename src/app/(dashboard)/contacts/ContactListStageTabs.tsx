"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "AWARENESS", label: "Awareness" },
  { value: "INTEREST", label: "Interest" },
  { value: "DESIRE", label: "Desire" },
  { value: "ACTION", label: "Action" },
] as const;

export function ContactListStageTabs({
  currentStage,
  personTypeParam,
  searchQ,
}: {
  currentStage: string;
  personTypeParam?: string | null;
  searchQ?: string | null;
}) {
  const base = "/contacts";
  const personQ = personTypeParam && personTypeParam !== "ALL" ? `personType=${personTypeParam}` : "";
  const qParam = searchQ ? `q=${encodeURIComponent(searchQ)}` : "";
  function href(value: string) {
    const stagePart = value === "ALL" ? "" : `stage=${value}`;
    const q = [stagePart, personQ, qParam].filter(Boolean).join("&");
    return q ? `${base}?${q}` : base;
  }
  return (
    <div className="flex flex-wrap gap-1 pt-2">
      {TABS.map((tab) => {
        const isActive =
          (currentStage === "ALL" && tab.value === "ALL") ||
          currentStage === tab.value;
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
