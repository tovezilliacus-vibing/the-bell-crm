import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { getForm } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormEditor } from "../FormEditor";
import { EmbedCodeBlock } from "../EmbedCodeBlock";
import { FormSubmissionsList } from "../FormSubmissionsList";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to edit this form.
        </p>
      </div>
    );
  }
  const workspaceId = await ensureWorkspaceForUser(userId);
  const { id } = await params;
  const form = await getForm(id, workspaceId);
  if (!form) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://YOUR_DOMAIN";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/forms">← Forms</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{form.name}</h1>
        {form.description && (
          <p className="text-muted-foreground">{form.description}</p>
        )}
      </div>

      <FormEditor form={form} />

      <EmbedCodeBlock
        publicKey={form.publicKey}
        baseUrl={baseUrl}
        fields={form.fields}
      />

      <FormSubmissionsList formId={form.id} />
    </div>
  );
}
