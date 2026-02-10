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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FunnelStage } from "@prisma/client";
import {
  getReportMetrics,
  FUNNEL_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/reports";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { ReportDateForm } from "./ReportDateForm";

function defaultDateRange(): { start: Date; end: Date; fromStr: string; toStr: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start,
    end,
    fromStr: start.toISOString().slice(0, 10),
    toStr: end.toISOString().slice(0, 10),
  };
}

function parseDateRange(fromParam?: string | null, toParam?: string | null) {
  const fromStr = fromParam?.slice(0, 10);
  const toStr = toParam?.slice(0, 10);
  const start = fromStr ? new Date(fromStr) : null;
  const end = toStr ? new Date(toStr) : null;
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    return { start, end, fromStr: fromStr!, toStr: toStr! };
  }
  const def = defaultDateRange();
  return { ...def, start: def.start, end: def.end };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await auth();
  const params = await searchParams;
  const { start, end, fromStr, toStr } = parseDateRange(params.from, params.to);

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to view reports.
        </p>
        <Link href="/sign-in" className="text-primary text-sm mt-2 inline-block underline">
          Sign in
        </Link>
      </div>
    );
  }

  const workspaceId = await ensureWorkspaceForUser(userId);
  const metrics = await getReportMetrics(workspaceId, start, end);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Funnel movement, win-rate by source, and activity for a date range.
          </p>
        </div>
        <ReportDateForm fromDefault={fromStr} toDefault={toStr} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AIDA funnel</CardTitle>
          <CardDescription>
            Contacts per stage (current) and stage moves in the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Contacts per stage</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(["AWARENESS", "INTEREST", "DESIRE", "ACTION"] as FunnelStage[]).map(
                  (stage) => (
                    <TableRow key={stage}>
                      <TableCell>{FUNNEL_STAGE_LABELS[stage]}</TableCell>
                      <TableCell className="text-right">
                        {metrics.funnel.stageCounts[stage]}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Conversions in period</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transition</TableHead>
                  <TableHead className="text-right">Moved</TableHead>
                  <TableHead className="text-right">Rate (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.funnel.conversionInRange.map((c) => (
                  <TableRow key={`${c.from}-${c.to}`}>
                    <TableCell>
                      {FUNNEL_STAGE_LABELS[c.from]} → {FUNNEL_STAGE_LABELS[c.to]}
                    </TableCell>
                    <TableCell className="text-right">{c.moved}</TableCell>
                    <TableCell className="text-right">
                      {c.rate != null ? `${c.rate}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Win rate by source</CardTitle>
          <CardDescription>
            Deals closed won vs lost in the period, by contact lead source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.winRateBySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No closed deals in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Won</TableHead>
                  <TableHead className="text-right">Lost</TableHead>
                  <TableHead className="text-right">Win rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.winRateBySource.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell>
                      {LEAD_SOURCE_LABELS[row.source] ?? row.source}
                    </TableCell>
                    <TableCell className="text-right">{row.won}</TableCell>
                    <TableCell className="text-right">{row.lost}</TableCell>
                    <TableCell className="text-right">
                      {row.winRatePercent != null ? `${row.winRatePercent}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity stats</CardTitle>
          <CardDescription>
            Emails sent, tasks completed, and activities logged in the period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Emails sent</TableHead>
                <TableHead className="text-right">Tasks completed</TableHead>
                <TableHead className="text-right">Activities logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.activityPerUser.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>
                    {row.userId === userId ? "You" : row.userId.slice(0, 12) + "…"}
                  </TableCell>
                  <TableCell className="text-right">{row.emailsSent}</TableCell>
                  <TableCell className="text-right">{row.tasksCompleted}</TableCell>
                  <TableCell className="text-right">{row.activitiesLogged}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {metrics.formStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Form performance</CardTitle>
            <CardDescription>
              Submissions in period, contacts created from forms, and deals linked to those contacts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Contacts</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.formStats.map((row) => (
                  <TableRow key={row.formId}>
                    <TableCell className="font-medium">{row.formName}</TableCell>
                    <TableCell className="text-right">{row.submissions}</TableCell>
                    <TableCell className="text-right">{row.contactsCreated}</TableCell>
                    <TableCell className="text-right">{row.dealsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
