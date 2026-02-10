"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { completeTask, snoozeTask, updateTask } from "@/app/(dashboard)/tasks/actions";
import { personDisplayName } from "@/lib/leads";

type TaskWithContact = {
  id: string;
  title: string;
  dueAt: Date | null;
  status: string;
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
  } | null;
};

export function TaskRow({ task }: { task: TaskWithContact }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [editingDue, setEditingDue] = useState(false);
  const [dueValue, setDueValue] = useState(
    task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : ""
  );

  async function handleComplete() {
    setPending(true);
    await completeTask(task.id);
    setPending(false);
    router.refresh();
  }

  async function handleSnooze() {
    setPending(true);
    await snoozeTask(task.id, 1);
    setPending(false);
    router.refresh();
  }

  async function handleSaveDue(e: React.FormEvent) {
    e.preventDefault();
    const d = dueValue ? new Date(dueValue) : null;
    setPending(true);
    await updateTask(task.id, { dueAt: d });
    setPending(false);
    setEditingDue(false);
    router.refresh();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <span className="font-medium">{task.title}</span>
        {task.contact && (
          <span className="text-muted-foreground ml-2">
            ·{" "}
            <Link
              href={`/contacts/${task.contact.id}`}
              className="text-primary hover:underline"
            >
              {personDisplayName(
                task.contact.firstName,
                task.contact.lastName,
                task.contact.name
              )}
            </Link>
          </span>
        )}
        {task.dueAt && !editingDue && (
          <span className="text-muted-foreground ml-2">
            Due {new Date(task.dueAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editingDue ? (
          <form onSubmit={handleSaveDue} className="flex items-center gap-1">
            <input
              type="date"
              value={dueValue}
              onChange={(e) => setDueValue(e.target.value)}
              className="rounded border border-input px-2 py-1 text-sm"
            />
            <Button type="submit" size="sm" variant="ghost" disabled={pending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditingDue(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingDue(true)}
              disabled={pending}
            >
              Edit due
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSnooze}
              disabled={pending}
            >
              Snooze
            </Button>
            <Button size="sm" onClick={handleComplete} disabled={pending}>
              Done
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
