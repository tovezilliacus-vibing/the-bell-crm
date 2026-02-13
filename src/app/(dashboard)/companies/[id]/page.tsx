import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { personDisplayName } from "@/lib/leads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { EditCompanyForm } from "./EditCompanyForm";
import type { CompanyLifecycle } from "@prisma/client";

const LIFECYCLE_LABELS: Record<CompanyLifecycle, string> = {
  PROSPECT: "Prospect",
  CUSTOMER: "Customer",
};

export default async function CompanyDetailPage({
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
          Sign in to view this company.
        </p>
      </div>
    );
  }

  const workspaceId = await ensureWorkspaceForUser(userId);
  const company = await prisma.company.findFirst({
    where: { id, workspaceId },
    include: {
      contacts: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          personType: true,
        },
      },
    },
  });

  if (!company) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/companies">← Companies</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
              {LIFECYCLE_LABELS[company.lifecycleStage]}
            </span>
          </p>
        </div>
        <EditCompanyForm
          companyId={company.id}
          currentName={company.name}
          currentLifecycle={company.lifecycleStage}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
          <CardDescription>Name and lifecycle stage. Lifecycle: Prospect or Customer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd>{company.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Lifecycle</dt>
              <dd>{LIFECYCLE_LABELS[company.lifecycleStage]}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Persons</CardTitle>
          <CardDescription>People linked to this company (leads and contacts).</CardDescription>
        </CardHeader>
        <CardContent>
          {company.contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No persons linked. Add a lead or contact and assign this company.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/contacts/${c.id}`} className="text-primary hover:underline">
                        {personDisplayName(c.firstName, c.lastName, c.name) || "—"}
                      </Link>
                    </TableCell>
                    <TableCell>{c.email ?? "—"}</TableCell>
                    <TableCell>{c.personType === "LEAD" ? "Lead" : "Contact"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
