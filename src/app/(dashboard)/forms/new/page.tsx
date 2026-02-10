import { auth } from "@clerk/nextjs/server";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { CreateFormForm } from "../CreateFormForm";

export default async function NewFormPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to create a form.
        </p>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create form</h1>
        <p className="text-muted-foreground">
          Add a name and optional description. You can add fields and embed code on the next screen.
        </p>
      </div>
      <CreateFormForm />
    </div>
  );
}
