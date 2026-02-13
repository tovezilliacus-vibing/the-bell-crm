import { auth } from "@clerk/nextjs/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { userId } = await auth();
  const { q: searchQ } = await searchParams;
  const q = searchQ?.trim() || null;
  let campaigns: Awaited<ReturnType<typeof prisma.campaign.findMany>> = [];
  try {
    const workspaceId = userId ? await ensureWorkspaceForUser(userId) : null;
    campaigns = workspaceId
      ? await prisma.campaign.findMany({
          where: {
            workspaceId,
            ...(q && { name: { contains: q, mode: "insensitive" } }),
          },
          orderBy: { createdAt: "desc" },
        })
      : [];
  } catch (e) {
    console.error("[Campaigns] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load campaigns. Please try again." />;
  }

  return (
    <div className="p-6 space-y-6">
      {!userId && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see and manage your campaigns.
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Sources for contacts (utm_source style). Assign when adding a lead.
          </p>
        </div>
        <Button>New campaign</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
          <CardDescription>
            Create campaigns to track where contacts come from (e.g. webinars, ads).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!userId ? (
            <p className="text-sm text-muted-foreground">Sign in to see campaigns.</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaigns yet. Add one to use as a contact source.
            </p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[c.utmSource, c.utmMedium, c.utmCampaign].filter(Boolean).join(" · ") || "—"}
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
