"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inviteByEmail, revokeInvite } from "./team-actions";

type Member = { id: string; userId: string; role: string; createdAt: Date };
type Invite = { id: string; email: string; role: string; createdAt: Date };

export function TeamManagementSection({
  members,
  invites,
  usersLimit,
}: {
  members: Member[];
  invites: Invite[];
  usersLimit: number;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    const result = await inviteByEmail(email);
    setPending(false);
    if (result.ok) {
      setEmail("");
      setMessage({ type: "ok", text: "Invite sent. They can sign up with this email and will be added to the workspace." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to send invite" });
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this invite?")) return;
    await revokeInvite(id);
  }

  const totalSlots = members.length + invites.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>
          Manage workspace members and invite users (within your plan limit). Only administrators can invite and remove.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-sm">{m.userId}</TableCell>
                <TableCell>
                  <span className={m.role === "ADMIN" ? "font-medium" : "text-muted-foreground"}>
                    {m.role === "ADMIN" ? "Admin" : "Member"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(m.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {invites.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Pending invites</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {invites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-2">
                  <span>{inv.email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(inv.id)}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Invite by email ({totalSlots} / {usersLimit} used)
          </p>
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="invite-email" className="sr-only">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={totalSlots >= usersLimit}
              />
            </div>
            <Button type="submit" disabled={pending || totalSlots >= usersLimit}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </form>
          {totalSlots >= usersLimit && (
            <p className="text-xs text-muted-foreground mt-1">User limit reached. Upgrade your plan to invite more.</p>
          )}
          {message && (
            <p className={`text-sm mt-2 ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
