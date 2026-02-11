import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskListFilters } from "./TaskListFilters";
import { TaskRow } from "./TaskRow";
import { CreateTaskForm } from "./CreateTaskForm";

function getDateRange(filter: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (filter === "today") {
    return { dueAt: { gte: startOfToday, lte: endOfToday } };
  }
  if (filter === "overdue") {
    return { dueAt: { lt: startOfToday } };
  }
  // upcoming: due after today or null
  return { OR: [{ dueAt: { gt: endOfToday } }, { dueAt: null }] };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; contactId?: string }>;
}) {
  const { userId } = await auth();
  const { filter: filterParam, contactId } = await searchParams;
  const filter = filterParam === "overdue" || filterParam === "upcoming" ? filterParam : "today";

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see tasks.
        </p>
      </div>
    );
  }

  let workspaceId: string;
  let tasks: Awaited<ReturnType<typeof prisma.task.findMany>>;
  let contact: Awaited<ReturnType<typeof prisma.contact.findFirst>>;
  try {
    workspaceId = await ensureWorkspaceForUser(userId);
    const dateWhere = getDateRange(filter);
    tasks = await prisma.task.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      ...dateWhere,
      ...(contactId && { contactId }),
    },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, name: true },
      },
    },
    orderBy: { dueAt: "asc" },
  });
    contact = contactId
      ? await prisma.contact.findFirst({
          where: { id: contactId, workspaceId },
          select: { id: true, firstName: true, lastName: true, name: true },
        })
      : null;
  } catch (e) {
    console.error("[Tasks] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load tasks. Please try again." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Today, overdue, upcoming. Mark done, snooze, or edit due date.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My tasks</CardTitle>
          <CardDescription>
            Filter by due date. Quick actions: Done, Snooze (+1 day), Edit due.
          </CardDescription>
          <TaskListFilters currentFilter={filter} contactId={contactId} />
        </CardHeader>
        <CardContent className="space-y-4">
          <CreateTaskForm
            contactId={contactId ?? undefined}
            contactName={
              contact
                ? [contact.firstName, contact.lastName, contact.name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || undefined
                : undefined
            }
          />
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No {filter} tasks.
            </p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
