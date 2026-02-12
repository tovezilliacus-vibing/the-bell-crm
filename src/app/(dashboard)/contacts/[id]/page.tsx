import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { personDisplayName, phoneToTelHref } from "@/lib/leads";
import { FUNNEL_STAGE_LABELS } from "@/lib/funnel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageBadge } from "./StageBadge";
import { MoveStageForm } from "./MoveStageForm";
import { ActivityTimeline } from "@/components/contacts/ActivityTimeline";
import type { TimelineItem } from "@/components/contacts/ActivityTimeline";
import { ContactDetailTasks } from "./ContactDetailTasks";
import { AddActivityForm } from "./AddActivityForm";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to view this contact.
        </p>
      </div>
    );
  }

  const workspaceId = await ensureWorkspaceForUser(userId);
  const contact = await prisma.contact.findFirst({
    where: { id, workspaceId },
    include: {
      company: true,
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
      tasks: {
        orderBy: [
          { status: "asc" },
          { dueAt: "asc" },
        ],
      },
      deals: {
        include: { company: { select: { name: true } } },
      },
      emails: {
        orderBy: { sentAt: "desc" },
        take: 50,
      },
    },
  });

  if (!contact) notFound();

  const telHref = phoneToTelHref(contact.phone);
  const displayName = personDisplayName(
    contact.firstName,
    contact.lastName,
    contact.name
  );

  const pendingTasks = contact.tasks.filter((t) => t.status === "PENDING");
  const completedTasks = contact.tasks.filter((t) => t.status === "COMPLETED");

  const timelineItems: TimelineItem[] = [
    ...contact.activities.map((a) => ({
      kind: "activity" as const,
      id: a.id,
      type: a.type,
      description: a.description,
      occurredAt: a.occurredAt,
    })),
    ...completedTasks.map((t) => ({
      kind: "task_completed" as const,
      id: t.id,
      title: t.title,
      completedAt: t.completedAt,
    })),
  ].sort(
    (a, b) =>
      new Date(b.kind === "activity" ? b.occurredAt : b.completedAt ?? 0).getTime() -
      new Date(a.kind === "activity" ? a.occurredAt : a.completedAt ?? 0).getTime()
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contacts">← Contacts</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground">
            {contact.company?.name ?? "No company"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StageBadge stage={contact.funnelStage} />
          <MoveStageForm
            contactId={contact.id}
            currentStage={contact.funnelStage}
          />
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Contact and company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Stage</dt>
              <dd>
                <StageBadge stage={contact.funnelStage} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd>{contact.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd>
                {contact.phone ? (
                  telHref ? (
                    <a href={telHref} className="text-primary hover:underline">
                      {contact.phone}
                    </a>
                  ) : (
                    contact.phone
                  )
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Lead source</dt>
              <dd>{contact.leadSource ?? "—"}</dd>
            </div>
            {contact.company && (
              <>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Company</dt>
                  <dd>{contact.company.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Industry</dt>
                  <dd>{contact.company.industry ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                  <dd>
                    {[contact.company.city, contact.company.state, contact.company.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Pending and completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactDetailTasks
            pendingTasks={pendingTasks}
            completedTasks={completedTasks}
            contactId={contact.id}
          />
        </CardContent>
      </Card>

      {/* Emails */}
      {contact.emails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Inbound and outbound mail synced from your inbox. Sync in Settings → Your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {contact.emails.map((e) => (
                <li key={e.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span className={e.direction === "inbound" ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}>
                      {e.direction === "inbound" ? "In" : "Out"}
                    </span>
                    <span>{new Date(e.sentAt).toLocaleString()}</span>
                  </div>
                  <p className="font-medium mt-1">{e.subject ?? "(No subject)"}</p>
                  {e.bodySnippet && (
                    <p className="text-muted-foreground mt-1 line-clamp-2">{e.bodySnippet}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Activities timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Emails, calls, notes, tasks completed.</CardDescription>
            </div>
            <AddActivityForm contactId={contact.id} />
          </div>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={timelineItems} />
        </CardContent>
      </Card>

      {/* Deals */}
      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
          <CardDescription>Deals linked to this contact.</CardDescription>
        </CardHeader>
        <CardContent>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals.</p>
          ) : (
            <ul className="space-y-2">
              {contact.deals.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <Link href={`/deals/${d.id}`} className="font-medium text-primary hover:underline">
                    {d.title}
                  </Link>
                  <span className="text-muted-foreground">
                    {d.company?.name ?? "—"} · {d.stage}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
