import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { personDisplayName } from "@/lib/leads";

export default async function DealDetailPage({
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
          Sign in to view this deal.
        </p>
      </div>
    );
  }

  const workspaceId = await ensureWorkspaceForUser(userId);
  const deal = await prisma.deal.findFirst({
    where: { id, workspaceId },
    include: {
      company: true,
      contact: true,
    },
  });

  if (!deal) notFound();

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/deals">← Deals</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{deal.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{deal.stage}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Value: {Number(deal.value).toLocaleString()}</p>
          {deal.company && <p>Company: {deal.company.name}</p>}
          {deal.contact && (
            <p>
              Contact:{" "}
              <Link
                href={`/contacts/${deal.contact.id}`}
                className="text-primary hover:underline"
              >
                {personDisplayName(
                  deal.contact.firstName,
                  deal.contact.lastName,
                  deal.contact.name
                )}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
