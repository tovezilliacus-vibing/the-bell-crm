import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export async function FormSubmissionsList({ formId }: { formId: string }) {
  const submissions = await prisma.formSubmission.findMany({
    where: { formId },
    orderBy: { submittedAt: "desc" },
    take: 50,
    include: { contact: { select: { id: true, firstName: true, lastName: true, name: true, email: true } } },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent submissions</CardTitle>
        <CardDescription>Last 50. Payload is stored; contact is linked when email is provided.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payload (preview)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => {
                const payload = s.payload as Record<string, unknown>;
                const preview = Object.entries(payload)
                  .filter(([k]) => !["form_id"].includes(k))
                  .slice(0, 3)
                  .map(([k, v]) => `${k}: ${String(v)}`)
                  .join(" · ");
                const contactName =
                  s.contact?.firstName || s.contact?.lastName || s.contact?.name || s.contact?.email || "—";
                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(s.submittedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {s.contactId ? (
                        <Link href={`/contacts/${s.contactId}`} className="text-primary hover:underline">
                          {contactName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {preview || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
