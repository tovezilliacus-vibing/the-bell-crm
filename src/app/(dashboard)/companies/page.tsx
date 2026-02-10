import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CompaniesPage() {
  const { userId } = await auth();

  return (
    <div className="p-6 space-y-6">
      {!userId && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see and manage your companies.
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Companies and accounts (customer companies).
          </p>
        </div>
        <Button>Add company</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Companies & accounts</CardTitle>
          <CardDescription>
            Companies become accounts when they have won deals (Phase 4).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Company/Account list and CRUD in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
