"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { completeTask, snoozeTask } from "@/app/(dashboard)/tasks/actions";

type Task = {
  id: string;
  title: string;
  dueAt: Date | null;
  status: string;
  completedAt: Date | null;
};

export function ContactDetailTasks({
  pendingTasks,
  completedTasks,
  contactId,
}: {
  pendingTasks: Task[];
  completedTasks: Task[];
  contactId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleComplete(taskId: string) {
    setPendingId(taskId);
    await completeTask(taskId);
    setPendingId(null);
    router.refresh();
  }

  async function handleSnooze(taskId: string) {
    setPendingId(taskId);
    await snoozeTask(taskId, 1);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks.</p>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Pending</h4>
              <ul className="space-y-2">
                {pendingTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{t.title}</span>
                      {t.dueAt && (
                        <span className="text-muted-foreground ml-2">
                          Due {new Date(t.dueAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSnooze(t.id)}
                        disabled={pendingId !== null}
                      >
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleComplete(t.id)}
                        disabled={pendingId !== null}
                      >
                        {pendingId === t.id ? "…" : "Done"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {completedTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Completed</h4>
              <ul className="space-y-1">
                {completedTasks.map((t) => (
                  <li
                    key={t.id}
                    className="text-sm text-muted-foreground line-through"
                  >
                    {t.title}
                    {t.completedAt &&
                      ` · ${new Date(t.completedAt).toLocaleDateString()}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/tasks?contactId=${contactId}`}>New task</Link>
      </Button>
    </div>
  );
}
