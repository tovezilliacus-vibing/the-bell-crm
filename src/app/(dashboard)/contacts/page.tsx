import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { personDisplayName } from "@/lib/leads";
import { FUNNEL_STAGE_LABELS } from "@/lib/funnel";
import type { FunnelStage, Prisma } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContactListStageTabs } from "./ContactListStageTabs";
import { AddLeadForm } from "../leads/AddLeadForm";
import { getProspectFieldOptionsForWorkspace } from "../settings/prospect-metrics-actions";
import { ensureWorkspaceForUser } from "@/lib/workspace";

const STAGES: (FunnelStage | "ALL")[] = ["ALL", "AWARENESS", "INTEREST", "DESIRE", "ACTION"];

type ContactWithRelations = Prisma.ContactGetPayload<{
  include: {
    company: { select: { name: true } };
    activities: { orderBy: { occurredAt: "desc" }; take: 1; select: { occurredAt: true } };
    tasks: { where: { status: "PENDING" }; orderBy: { dueAt: "asc" }; take: 1; select: { dueAt: true; id: true } };
  };
}>;

export default async function ContactListPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { userId } = await auth();
  const { stage: stageParam } = await searchParams;
  const stageFilter: FunnelStage | null =
    stageParam && STAGES.includes(stageParam as FunnelStage) && stageParam !== "ALL"
      ? (stageParam as FunnelStage)
      : null;

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see contacts.
        </p>
      </div>
    );
  }

  let workspaceId: string;
  let contacts: ContactWithRelations[];
  let companies: { id: string; name: string }[];
  let prospectOptions: Awaited<ReturnType<typeof getProspectFieldOptionsForWorkspace>>;
  try {
    workspaceId = await ensureWorkspaceForUser(userId);
    [contacts, companies, prospectOptions] = await Promise.all([
    prisma.contact.findMany({
      where: { workspaceId, ...(stageFilter && { funnelStage: stageFilter }) },
      include: {
        company: { select: { name: true } },
        activities: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true },
        },
        tasks: {
          where: { status: "PENDING" },
          orderBy: { dueAt: "asc" },
          take: 1,
          select: { dueAt: true, id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.company.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getProspectFieldOptionsForWorkspace(workspaceId),
  ]);
  } catch (e) {
    console.error("[Contacts] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load contacts. Please try again." />;
  }

  const industryOptions = prospectOptions.filter((o) => o.fieldType === "industry");
  const sizeTurnoverOptions = prospectOptions.filter((o) => o.fieldType === "size_turnover");
  const sizePersonnelOptions = prospectOptions.filter((o) => o.fieldType === "size_personnel");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            All contacts. Filter by AIDA stage so no lead gets forgotten.
          </p>
        </div>
        <AddLeadForm
          companies={companies}
          industryOptions={industryOptions}
          sizeTurnoverOptions={sizeTurnoverOptions}
          sizePersonnelOptions={sizePersonnelOptions}
          buttonLabel="Add contact"
          formTitle="New contact"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact list</CardTitle>
          <CardDescription>
            Name, company, stage, last activity, next task due.
          </CardDescription>
          <ContactListStageTabs currentStage={stageParam ?? "ALL"} />
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {stageFilter
                ? `No contacts in ${FUNNEL_STAGE_LABELS[stageFilter]}.`
                : "No contacts yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Next task due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => {
                  const lastActivity = c.activities[0]?.occurredAt;
                  const nextTask = c.tasks[0];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/contacts/${c.id}`}
                          className="text-primary hover:underline"
                        >
                          {personDisplayName(c.firstName, c.lastName, c.name)}
                        </Link>
                      </TableCell>
                      <TableCell>{c.company?.name ?? "—"}</TableCell>
                      <TableCell>
                        {FUNNEL_STAGE_LABELS[c.funnelStage]}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lastActivity
                          ? new Date(lastActivity).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {nextTask?.dueAt
                          ? new Date(nextTask.dueAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
