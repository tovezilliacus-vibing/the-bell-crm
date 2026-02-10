import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { personDisplayName } from "@/lib/leads";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import {
  getFunnelMetrics,
  getLeadsNeedingAttention,
  CONVERSION_PAIRS,
  FUNNEL_STAGE_LABELS,
} from "@/lib/funnel";

export default async function DashboardPage() {
  const { userId } = await auth();
  let workspaceId: string | null = null;
  try {
    workspaceId = userId ? await ensureWorkspaceForUser(userId) : null;
  } catch (e) {
    console.error("[Dashboard] ensureWorkspaceForUser failed:", e);
    throw e;
  }

  let funnelMetrics: Awaited<ReturnType<typeof getFunnelMetrics>> | null = null;
  let leadsNeedingAttention: Awaited<ReturnType<typeof getLeadsNeedingAttention>> = [];
  let dealCountsByStage: { _count: { stage: number }; stage: string }[] = [];
  let pendingTasksCount = 0;
  let recentActivities: Awaited<ReturnType<typeof prisma.activity.findMany>> = [];
  let upcomingTasks: Awaited<ReturnType<typeof prisma.task.findMany>> = [];

  if (workspaceId) {
    try {
      [funnelMetrics, leadsNeedingAttention, dealCountsByStage, pendingTasksCount, recentActivities, upcomingTasks] =
        await Promise.all([
          getFunnelMetrics(workspaceId),
          getLeadsNeedingAttention(workspaceId),
          prisma.deal.groupBy({
            by: ["stage"],
            where: { workspaceId },
            _count: { stage: true },
          }),
          prisma.task.count({
            where: { workspaceId, status: "PENDING" },
          }),
          prisma.activity.findMany({
            where: { workspaceId },
            take: 10,
            orderBy: { occurredAt: "desc" },
            include: { contact: { select: { id: true, firstName: true, lastName: true, name: true, email: true } } },
          }),
          prisma.task.findMany({
            where: { workspaceId, status: "PENDING" },
            take: 5,
            orderBy: { dueAt: "asc" },
            include: { contact: { select: { id: true, firstName: true, lastName: true, name: true } } },
          }),
        ]);
    } catch (e) {
      console.error("[Dashboard] data fetch failed:", e);
      throw e;
    }
  }

  const stageCounts = funnelMetrics?.stageCounts ?? {
    AWARENESS: 0,
    INTEREST: 0,
    DESIRE: 0,
    ACTION: 0,
  };
  const awarenessCount = stageCounts.AWARENESS;
  const interestCount = stageCounts.INTEREST;
  const desireCount = stageCounts.DESIRE;
  const actionCount = stageCounts.ACTION;
  const conversionLast30Days = funnelMetrics?.conversionLast30Days ?? [];
  const conversionMap = new Map(
    conversionLast30Days.map((c) => [
      `${c.from}-${c.to}`,
      { moved: c.moved, rate: c.rate },
    ])
  );

  const dealList = Array.isArray(dealCountsByStage) ? dealCountsByStage : [];
  const dealStageCount = dealList.reduce(
    (sum: number, g: { _count: { stage: number }; stage: string }) => sum + g._count.stage,
    0
  );
  const openDeals = dealList
    .filter((g: { stage: string }) => !["CLOSED_WON", "CLOSED_LOST"].includes(g.stage))
    .reduce((sum: number, g: { _count: { stage: number } }) => sum + g._count.stage, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your pipeline and activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/contacts?stage=AWARENESS" prefetch={false}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awareness</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{awarenessCount}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contacts?stage=INTEREST" prefetch={false}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interest</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{interestCount}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contacts?stage=DESIRE" prefetch={false}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desire</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{desireCount}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contacts?stage=ACTION" prefetch={false}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{actionCount}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/deals" prefetch={false}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dealStageCount}</p>
              <p className="text-xs text-muted-foreground">
                {openDeals} open in pipeline
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tasks" prefetch={false}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingTasksCount}</p>
              <p className="text-xs text-muted-foreground">
                Pending tasks
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Conversion rates (last 30 days) */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion (last 30 days)</CardTitle>
            <CardDescription>
              Moves between AIDA stages in the past 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {CONVERSION_PAIRS.map(({ from, to }) => {
                const data = conversionMap.get(`${from}-${to}`);
                const moved = data?.moved ?? 0;
                const rate = data?.rate ?? null;
                return (
                  <div key={`${from}-${to}`} className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {FUNNEL_STAGE_LABELS[from]} → {FUNNEL_STAGE_LABELS[to]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {moved} moved
                      {rate != null ? ` · ${rate}%` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads needing attention today */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads needing attention today</CardTitle>
            <CardDescription>
              Contacts with a task due today or overdue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadsNeedingAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No contacts with overdue or due-today tasks.
              </p>
            ) : (
              <ul className="space-y-2">
                {leadsNeedingAttention.map((lead) => (
                  <li key={lead.taskId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <div>
                      <Link
                        href={`/contacts/${lead.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {personDisplayName(lead.firstName, lead.lastName, lead.name)}
                      </Link>
                      <span className="text-muted-foreground ml-2">· {lead.taskTitle}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {lead.taskDueAt
                        ? new Date(lead.taskDueAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/funnel">View funnel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming tasks</CardTitle>
            <CardDescription>
              Next 5 pending tasks by due date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No pending tasks.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        {(() => {
                          const c = (task as { contact?: { firstName: string | null; lastName: string | null; name: string | null; id: string } | null }).contact;
                          return c ? personDisplayName(c.firstName, c.lastName, c.name) || c.id : "—";
                        })()}
                      </TableCell>
                      <TableCell>
                        {task.dueAt
                          ? new Date(task.dueAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/tasks">View all tasks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Latest recorded activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No activity yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium capitalize">
                        {activity.type.toLowerCase()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {activity.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const c = (activity as { contact?: { firstName: string | null; lastName: string | null; name: string | null; email: string | null } | null }).contact;
                          return c ? personDisplayName(c.firstName, c.lastName, c.name) || c.email || "—" : "—";
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(activity.occurredAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/tasks">View tasks & activity</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
