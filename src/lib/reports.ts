/**
 * Lightweight reporting: funnel movement, win-rate by source, activity per user.
 * All metrics are computed for a given date range (and optional userId scope).
 */

import type { FunnelStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getWorkspaceUserIds } from "@/lib/workspace";
import {
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  CONVERSION_PAIRS,
  type StageCounts,
  type ConversionMetric,
} from "@/lib/funnel";

export type { StageCounts, ConversionMetric };

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  INBOUND: "Inbound",
  OUTREACH: "Outreach",
  EVENT: "Event",
  REFERRAL: "Referral",
  OTHER: "Other",
};

// ——— Funnel report (AIDA) ———

export type FunnelReport = {
  /** Current contact count per stage (snapshot) */
  stageCounts: StageCounts;
  /** Stage moves that occurred in the date range */
  conversionInRange: ConversionMetric[];
};

export async function getFunnelReport(
  workspaceId: string,
  start: Date,
  end: Date
): Promise<FunnelReport> {
  const [counts, history] = await Promise.all([
    prisma.contact.groupBy({
      by: ["funnelStage"],
      where: { workspaceId },
      _count: { funnelStage: true },
    }),
    prisma.contactStageHistory.findMany({
      where: {
        contact: { workspaceId },
        createdAt: { gte: start, lte: end },
      },
      select: { fromStage: true, toStage: true },
    }),
  ]);

  const stageCounts: StageCounts = {
    AWARENESS: 0,
    INTEREST: 0,
    DESIRE: 0,
    ACTION: 0,
  };
  counts.forEach((c) => {
    stageCounts[c.funnelStage] = c._count.funnelStage;
  });

  const movedMap: Record<string, number> = {};
  CONVERSION_PAIRS.forEach(({ from, to }) => {
    movedMap[`${from}-${to}`] = history.filter(
      (h) => h.fromStage === from && h.toStage === to
    ).length;
  });

  const conversionInRange: ConversionMetric[] = CONVERSION_PAIRS.map(
    ({ from, to }) => {
      const moved = movedMap[`${from}-${to}`] ?? 0;
      const fromCount = stageCounts[from];
      const rate =
        fromCount > 0 ? Math.round((moved / fromCount) * 100) : null;
      return { from, to, moved, rate };
    }
  );

  return { stageCounts, conversionInRange };
}

// ——— Win-rate by source (deals closed in range, by contact lead source) ———

export type WinRateBySourceRow = {
  source: string; // leadSource or "Unknown"
  won: number;
  lost: number;
  winRatePercent: number | null;
};

export async function getWinRateBySource(
  workspaceId: string,
  start: Date,
  end: Date
): Promise<WinRateBySourceRow[]> {
  const closed = await prisma.deal.findMany({
    where: {
      workspaceId,
      stage: { in: ["CLOSED_WON", "CLOSED_LOST"] },
      closedAt: { gte: start, lte: end },
    },
    select: {
      stage: true,
      contact: { select: { leadSource: true } },
    },
  });

  const bySource = new Map<string, { won: number; lost: number }>();

  for (const d of closed) {
    const source = d.contact?.leadSource ?? "Unknown";
    const key = source;
    if (!bySource.has(key)) bySource.set(key, { won: 0, lost: 0 });
    const row = bySource.get(key)!;
    if (d.stage === "CLOSED_WON") row.won += 1;
    else row.lost += 1;
  }

  return Array.from(bySource.entries())
    .map(([source, { won, lost }]) => ({
      source,
      won,
      lost,
      winRatePercent:
        won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null,
    }))
    .sort((a, b) => b.won + b.lost - (a.won + a.lost));
}

// ——— Activity stats per user (emails sent, tasks completed, activities logged) ———

export type ActivityPerUserRow = {
  userId: string;
  emailsSent: number;
  tasksCompleted: number;
  activitiesLogged: number;
};

export async function getActivityPerUser(
  workspaceId: string,
  start: Date,
  end: Date
): Promise<ActivityPerUserRow[]> {
  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);

  const [tasks, activities, emailsResult] = await Promise.all([
    prisma.task.findMany({
      where: {
        workspaceId,
        status: "COMPLETED",
        completedAt: { gte: start, lte: endInclusive },
      },
      select: { userId: true },
    }),
    prisma.activity.findMany({
      where: {
        workspaceId,
        occurredAt: { gte: start, lte: endInclusive },
      },
      select: { userId: true },
    }),
    prisma.email
      .findMany({
        where: {
          userId: { in: await getWorkspaceUserIds(workspaceId) },
          sentAt: { gte: start, lte: endInclusive },
        },
        select: { userId: true },
      })
      .catch(() => []),
  ]);

  const emails = Array.isArray(emailsResult) ? emailsResult : [];

  const byUser = new Map<string, ActivityPerUserRow>();

  function ensure(userId: string) {
    if (!byUser.has(userId)) {
      byUser.set(userId, {
        userId,
        emailsSent: 0,
        tasksCompleted: 0,
        activitiesLogged: 0,
      });
    }
    return byUser.get(userId)!;
  }

  for (const t of tasks) {
    ensure(t.userId).tasksCompleted += 1;
  }
  for (const a of activities) {
    ensure(a.userId).activitiesLogged += 1;
  }
  for (const e of emails) {
    ensure(e.userId).emailsSent += 1;
  }

  const memberIds = await getWorkspaceUserIds(workspaceId);
  for (const uid of memberIds) {
    if (!byUser.has(uid)) {
      byUser.set(uid, {
        userId: uid,
        emailsSent: 0,
        tasksCompleted: 0,
        activitiesLogged: 0,
      });
    }
  }

  return Array.from(byUser.values()).sort(
    (a, b) =>
      b.tasksCompleted +
      b.activitiesLogged +
      b.emailsSent -
      (a.tasksCompleted + a.activitiesLogged + a.emailsSent)
  );
}

// ——— Per-form stats (submissions, contacts created, deals) ———

export type FormStatsRow = {
  formId: string;
  formName: string;
  submissions: number;
  contactsCreated: number;
  dealsCount: number;
};

export async function getFormStats(
  workspaceId: string,
  start: Date,
  end: Date
): Promise<FormStatsRow[]> {
  const forms = await prisma.form.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });
  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);

  const rows: FormStatsRow[] = [];
  for (const form of forms) {
    const [submissions, contactsFromForm, dealsFromFormContacts] = await Promise.all([
      prisma.formSubmission.count({
        where: {
          formId: form.id,
          submittedAt: { gte: start, lte: endInclusive },
        },
      }),
      prisma.contact.count({
        where: { workspaceId, formId: form.id },
      }),
      prisma.deal.count({
        where: {
          workspaceId,
          contact: { formId: form.id },
        },
      }),
    ]);
    rows.push({
      formId: form.id,
      formName: form.name,
      submissions,
      contactsCreated: contactsFromForm,
      dealsCount: dealsFromFormContacts,
    });
  }
  return rows.sort((a, b) => b.submissions - a.submissions);
}

// ——— Combined report payload ———

export type ReportMetrics = {
  funnel: FunnelReport;
  winRateBySource: WinRateBySourceRow[];
  activityPerUser: ActivityPerUserRow[];
  formStats: FormStatsRow[];
};

export async function getReportMetrics(
  workspaceId: string,
  start: Date,
  end: Date
): Promise<ReportMetrics> {
  const [funnel, winRateBySource, activityPerUser, formStats] = await Promise.all([
    getFunnelReport(workspaceId, start, end),
    getWinRateBySource(workspaceId, start, end),
    getActivityPerUser(workspaceId, start, end),
    getFormStats(workspaceId, start, end),
  ]);

  return { funnel, winRateBySource, activityPerUser, formStats };
}

// Re-export for UI
export { FUNNEL_STAGES, FUNNEL_STAGE_LABELS, CONVERSION_PAIRS };
