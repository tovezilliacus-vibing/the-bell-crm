"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReportDateForm({
  fromDefault,
  toDefault,
}: {
  fromDefault: string;
  toDefault: string;
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const from = (form.elements.namedItem("from") as HTMLInputElement).value;
    const to = (form.elements.namedItem("to") as HTMLInputElement).value;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="reports-from" className="text-xs">
          From
        </Label>
        <Input
          id="reports-from"
          name="from"
          type="date"
          defaultValue={fromDefault}
          className="w-40"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="reports-to" className="text-xs">
          To
        </Label>
        <Input
          id="reports-to"
          name="to"
          type="date"
          defaultValue={toDefault}
          className="w-40"
        />
      </div>
      <Button type="submit" variant="secondary">
        Apply
      </Button>
    </form>
  );
}
