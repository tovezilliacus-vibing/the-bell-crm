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

export function ContactListStageTabs({ currentStage }: { currentStage: string }) {
  return (
    <div className="flex flex-wrap gap-1 pt-2">
      {TABS.map((tab) => {
        const isActive =
          (currentStage === "ALL" && tab.value === "ALL") ||
          currentStage === tab.value;
        const href = tab.value === "ALL" ? "/contacts" : `/contacts?stage=${tab.value}`;
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
