import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { CompanyLifecycle } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { CompanyListTabs } from "./CompanyListTabs";
import { AddCompanyForm } from "./AddCompanyForm";

const LIFECYCLE_LABELS: Record<CompanyLifecycle, string> = {
  PROSPECT: "Prospect",
  CUSTOMER: "Customer",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ lifecycle?: string }>;
}) {
  const { userId } = await auth();
  const { lifecycle: lifecycleParam } = await searchParams;
  const lifecycleFilter: CompanyLifecycle | null =
    lifecycleParam === "PROSPECT" || lifecycleParam === "CUSTOMER" ? lifecycleParam : null;

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see and manage companies.
        </p>
      </div>
    );
  }

  let workspaceId: string;
  let companies: { id: string; name: string; lifecycleStage: CompanyLifecycle; _count: { contacts: number } }[];
  try {
    workspaceId = await ensureWorkspaceForUser(userId);
    companies = await prisma.company.findMany({
      where: {
        workspaceId,
        ...(lifecycleFilter && { lifecycleStage: lifecycleFilter }),
      },
      select: {
        id: true,
        name: true,
        lifecycleStage: true,
        _count: { select: { contacts: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("[Companies] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load companies. Please try again." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Companies are either prospects or customers. Filter by lifecycle stage.
          </p>
        </div>
        <AddCompanyForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies & accounts</CardTitle>
          <CardDescription>
            Prospect = potential customer; Customer = won deals or otherwise marked as customer.
          </CardDescription>
          <CompanyListTabs currentLifecycle={lifecycleParam ?? "ALL"} />
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {lifecycleFilter
                ? `No ${LIFECYCLE_LABELS[lifecycleFilter].toLowerCase()} companies.`
                : "No companies yet. Add a company to get started."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead className="text-right">Persons</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/companies/${c.id}`} className="text-primary hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{LIFECYCLE_LABELS[c.lifecycleStage]}</TableCell>
                    <TableCell className="text-right">{c._count.contacts}</TableCell>
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
