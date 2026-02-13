import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { FunnelStage, PersonType, Prisma } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactListStageTabs } from "./ContactListStageTabs";
import { ContactListPersonTypeTabs } from "./ContactListPersonTypeTabs";
import { ContactListTable, type ContactRow } from "./ContactListTable";
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

const PERSON_TYPES: (PersonType | "ALL")[] = ["ALL", "LEAD", "CONTACT"];

export default async function ContactListPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; personType?: string }>;
}) {
  const { userId } = await auth();
  const { stage: stageParam, personType: personTypeParam } = await searchParams;
  const stageFilter: FunnelStage | null =
    stageParam && STAGES.includes(stageParam as FunnelStage) && stageParam !== "ALL"
      ? (stageParam as FunnelStage)
      : null;
  const personTypeFilter: PersonType | null =
    personTypeParam && PERSON_TYPES.includes(personTypeParam as PersonType) && personTypeParam !== "ALL"
      ? (personTypeParam as PersonType)
      : null;

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see persons.
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
      where: {
        workspaceId,
        ...(stageFilter && { funnelStage: stageFilter }),
        ...(personTypeFilter && { personType: personTypeFilter }),
      },
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
    return <PageUnavailable message="We couldn't load persons. Please try again." />;
  }

  const industryOptions = prospectOptions.filter((o) => o.fieldType === "industry");
  const sizeTurnoverOptions = prospectOptions.filter((o) => o.fieldType === "size_turnover");
  const sizePersonnelOptions = prospectOptions.filter((o) => o.fieldType === "size_personnel");

  const contactRows: ContactRow[] = contacts.map((c) => {
    const lastActivity = c.activities[0]?.occurredAt;
    const nextTask = c.tasks[0];
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      name: c.name,
      email: c.email,
      phone: c.phone,
      companyName: c.company?.name ?? null,
      funnelStage: c.funnelStage,
      personType: c.personType,
      lastActivity: lastActivity ? new Date(lastActivity).toLocaleDateString() : null,
      nextTaskDue: nextTask?.dueAt ? new Date(nextTask.dueAt).toLocaleDateString() : null,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Persons</h1>
          <p className="text-muted-foreground">
            Leads and contacts. Filter by AIDA stage or person type.
          </p>
        </div>
        <AddLeadForm
          companies={companies}
          industryOptions={industryOptions}
          sizeTurnoverOptions={sizeTurnoverOptions}
          sizePersonnelOptions={sizePersonnelOptions}
          buttonLabel="Add person"
          formTitle="New person"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Person list</CardTitle>
          <CardDescription>
            Name, company, type (lead/contact), stage, last activity, next task due.
          </CardDescription>
          <ContactListStageTabs
            currentStage={stageParam ?? "ALL"}
            personTypeParam={personTypeParam ?? null}
          />
          <ContactListPersonTypeTabs
            currentPersonType={personTypeParam ?? "ALL"}
            stageParam={stageParam ?? null}
          />
        </CardHeader>
        <CardContent>
          <ContactListTable
            contacts={contactRows}
            stageFilter={stageParam ?? "ALL"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
