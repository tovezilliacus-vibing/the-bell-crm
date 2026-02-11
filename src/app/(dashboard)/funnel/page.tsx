import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import {
  getFunnelMetrics,
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  CONVERSION_PAIRS,
} from "@/lib/funnel";
import { personDisplayName } from "@/lib/leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function FunnelPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see the AIDA funnel.
        </p>
      </div>
    );
  }

  let metrics: Awaited<ReturnType<typeof getFunnelMetrics>>;
  let contactsByStage: Awaited<ReturnType<typeof prisma.contact.findMany>>[];
  try {
    const workspaceId = await ensureWorkspaceForUser(userId);
    [metrics, contactsByStage] = await Promise.all([
    getFunnelMetrics(workspaceId),
    Promise.all(
      FUNNEL_STAGES.map((stage) =>
        prisma.contact.findMany({
          where: { workspaceId, funnelStage: stage },
          include: { company: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
        })
      )
    ),
  ]);
  } catch (e) {
    console.error("[Funnel] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load the funnel. Please try again." />;
  }

  const conversionMap = new Map(
    metrics.conversionLast30Days.map((c) => [
      `${c.from}-${c.to}`,
      { moved: c.moved, rate: c.rate },
    ])
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AIDA Funnel</h1>
        <p className="text-muted-foreground">
          Pipeline by stage. Move contacts between stages from their detail page.
        </p>
      </div>

      {/* Conversion rates (last 30 days) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion (last 30 days)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Moves between stages in the past 30 days.
          </p>
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
                    {rate != null && ` · ${rate}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4-column board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FUNNEL_STAGES.map((stage, i) => {
          const contacts = contactsByStage[i];
          const count = metrics.stageCounts[stage];
          const nextConversion = CONVERSION_PAIRS.find((p) => p.from === stage);
          const conv = nextConversion
            ? conversionMap.get(
                `${nextConversion.from}-${nextConversion.to}`
              )
            : null;
          return (
            <div key={stage} className="flex flex-col gap-2">
              <Card className="flex flex-1 flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {FUNNEL_STAGE_LABELS[stage]}
                    </CardTitle>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  {conv != null && (conv.moved > 0 || conv.rate != null) && (
                    <p className="text-xs text-muted-foreground">
                      → {conv.moved} moved to {FUNNEL_STAGE_LABELS[nextConversion!.to]}
                      {conv.rate != null ? ` (${conv.rate}%)` : ""}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No contacts
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {contacts.map((c) => (
                        <li key={c.id}>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-start py-1.5 text-left font-normal"
                            asChild
                          >
                            <Link href={`/contacts/${c.id}`}>
                              <span className="truncate block">
                                {personDisplayName(
                                  c.firstName,
                                  c.lastName,
                                  c.name
                                )}
                              </span>
                              {c.company?.name && (
                                <span className="text-xs text-muted-foreground block truncate">
                                  {c.company.name}
                                </span>
                              )}
                            </Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
