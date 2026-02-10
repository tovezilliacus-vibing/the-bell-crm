import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { getForms } from "./actions";
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
import { CopyEmbedButton } from "./CopyEmbedButton";
import { FormActiveToggle } from "./FormActiveToggle";

export default async function FormsListPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to manage forms.
        </p>
      </div>
    );
  }
  const workspaceId = await ensureWorkspaceForUser(userId);
  const forms = await getForms(workspaceId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">
            Build contact forms and embed them on your site. Submissions create or update contacts in Awareness.
          </p>
        </div>
        <Button asChild>
          <Link href="/forms/new">Create form</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your forms</CardTitle>
          <CardDescription>
            Name, submissions count, active status, and embed code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No forms yet. Create one to get an embed code for your website.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Embed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">
                      <Link href={`/forms/${form.id}`} className="text-primary hover:underline">
                        {form.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{form._count.submissions}</TableCell>
                    <TableCell>
                      <FormActiveToggle formId={form.id} isActive={form.isActive} />
                    </TableCell>
                    <TableCell>
                      <CopyEmbedButton
                      publicKey={form.publicKey}
                      baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "https://YOUR_DOMAIN"}
                    />
                    </TableCell>
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
