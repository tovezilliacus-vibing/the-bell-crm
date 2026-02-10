import type { FunnelStage } from "@prisma/client";
import { prisma } from "@/lib/db";

export const FUNNEL_STAGES: FunnelStage[] = ["AWARENESS", "INTEREST", "DESIRE", "ACTION"];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  AWARENESS: "Awareness",
  INTEREST: "Interest",
  DESIRE: "Desire",
  ACTION: "Action",
};

/** Conversion pairs for display: fromStage -> toStage */
export const CONVERSION_PAIRS: { from: FunnelStage; to: FunnelStage }[] = [
  { from: "AWARENESS", to: "INTEREST" },
  { from: "INTEREST", to: "DESIRE" },
  { from: "DESIRE", to: "ACTION" },
];

export type StageCounts = Record<FunnelStage, number>;

export type ConversionMetric = {
  from: FunnelStage;
  to: FunnelStage;
  moved: number;
  rate: number | null; // % of "from" stage that moved to "to" in period (if we have baseline)
};

export type FunnelMetrics = {
  stageCounts: StageCounts;
  conversionLast30Days: ConversionMetric[];
};

export async function getFunnelMetrics(workspaceId: string): Promise<FunnelMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [counts, history] = await Promise.all([
    prisma.contact.groupBy({
      by: ["funnelStage"],
      where: { workspaceId },
      _count: { funnelStage: true },
    }),
    prisma.contactStageHistory.findMany({
      where: {
        contact: { workspaceId },
        createdAt: { gte: thirtyDaysAgo },
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

  const conversionLast30Days: ConversionMetric[] = CONVERSION_PAIRS.map(
    ({ from, to }) => {
      const moved = movedMap[`${from}-${to}`] ?? 0;
      const fromCount = stageCounts[from];
      const rate =
        fromCount > 0 ? Math.round((moved / fromCount) * 100) : null;
      return { from, to, moved, rate };
    }
  );

  return { stageCounts, conversionLast30Days };
}

export type LeadNeedingAttention = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string | null;
  funnelStage: FunnelStage;
  taskTitle: string;
  taskDueAt: Date | null;
  taskId: string;
};

/** Contacts that have at least one pending task due today or overdue */
export async function getLeadsNeedingAttention(
  workspaceId: string
): Promise<LeadNeedingAttention[]> {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      dueAt: { lte: endOfToday },
      contactId: { not: null },
    },
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          funnelStage: true,
        },
      },
    },
    orderBy: { dueAt: "asc" },
  });

  return tasks
    .filter((t) => t.contact != null)
    .map((t) => ({
      id: t.contact!.id,
      firstName: t.contact!.firstName,
      lastName: t.contact!.lastName,
      name: t.contact!.name,
      email: t.contact!.email,
      funnelStage: t.contact!.funnelStage,
      taskTitle: t.title,
      taskDueAt: t.dueAt,
      taskId: t.id,
    }));
}
