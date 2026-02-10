"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProspectFieldOption,
  removeProspectFieldOption,
  type ProspectFieldType,
} from "./prospect-metrics-actions";

const FIELD_LABELS: Record<ProspectFieldType, string> = {
  industry: "Industry",
  size_turnover: "Size (turnover)",
  size_personnel: "Size (personnel)",
};

type Option = { id: string; fieldType: string; value: string };

export function ProspectMetricsEditor({ options }: { options: Option[] }) {
  const [adding, setAdding] = useState<Record<ProspectFieldType, string>>({
    industry: "",
    size_turnover: "",
    size_personnel: "",
  });
  const [pending, setPending] = useState<string | null>(null);

  async function handleAdd(fieldType: ProspectFieldType) {
    const value = adding[fieldType].trim();
    if (!value) return;
    setPending(fieldType);
    const result = await addProspectFieldOption(fieldType, value);
    setPending(null);
    if (result.ok) setAdding((p) => ({ ...p, [fieldType]: "" }));
  }

  async function handleRemove(id: string) {
    setPending(id);
    await removeProspectFieldOption(id);
    setPending(null);
  }

  const byType = (type: ProspectFieldType) =>
    options.filter((o) => o.fieldType === type);

  return (
    <div className="space-y-6">
      {(["industry", "size_turnover", "size_personnel"] as const).map(
        (fieldType) => (
          <div key={fieldType} className="space-y-2">
            <Label>{FIELD_LABELS[fieldType]}</Label>
            <p className="text-xs text-muted-foreground">
              Options shown in the dropdown when adding/editing a lead or company.
            </p>
            <ul className="flex flex-wrap gap-2 mb-2">
              {byType(fieldType).map((opt) => (
                <li
                  key={opt.id}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                >
                  {opt.value}
                  <button
                    type="button"
                    onClick={() => handleRemove(opt.id)}
                    disabled={pending !== null}
                    className="text-muted-foreground hover:text-foreground ml-1"
                    aria-label={`Remove ${opt.value}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                placeholder={`Add ${FIELD_LABELS[fieldType].toLowerCase()} option`}
                value={adding[fieldType]}
                onChange={(e) =>
                  setAdding((p) => ({ ...p, [fieldType]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd(fieldType);
                  }
                }}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAdd(fieldType)}
                disabled={!adding[fieldType].trim() || pending !== null}
              >
                Add
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
