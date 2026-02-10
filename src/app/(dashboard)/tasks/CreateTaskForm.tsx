"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTask } from "./actions";

export function CreateTaskForm({
  contactId,
  contactName,
}: {
  contactId?: string;
  contactName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDays, setDueDays] = useState("1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setPending(true);
    const dueAt =
      dueDays !== ""
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + parseInt(dueDays, 10));
            d.setHours(9, 0, 0, 0);
            return d;
          })()
        : undefined;
    await createTask({
      title: title.trim(),
      dueAt,
      contactId: contactId ?? undefined,
    });
    setPending(false);
    setTitle("");
    setDueDays("1");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        New task{contactName ? ` for ${contactName}` : ""}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-3">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Due in (days)</Label>
        <Input
          type="number"
          min="0"
          value={dueDays}
          onChange={(e) => setDueDays(e.target.value)}
          placeholder="1"
          className="mt-1 w-24"
        />
      </div>
      {contactId && (
        <p className="text-xs text-muted-foreground">Linking to contact.</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          {pending ? "Creating…" : "Create"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
