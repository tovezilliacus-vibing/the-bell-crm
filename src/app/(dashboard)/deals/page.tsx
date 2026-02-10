import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DealsPage() {
  const { userId } = await auth();

  return (
    <div className="p-6 space-y-6">
      {!userId && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see and manage your deals.
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Pipeline: Initiating → Needs development → Proposal → Negotiation → Win/Lost.
          </p>
        </div>
        <Button>New deal</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>
            Deal stages and close (Win/Lost) will be implemented in Phase 4.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Kanban or table view by stage coming in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
