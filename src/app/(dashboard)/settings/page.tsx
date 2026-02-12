import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProspectFieldOptions, getProspectFieldOptionsForWorkspace } from "./prospect-metrics-actions";
import { ProspectMetricsEditor } from "./ProspectMetricsEditor";
import { ensureWorkspaceForUser, getWorkspace, getWorkspaceMembers, getWorkspaceInvites, isWorkspaceAdmin } from "@/lib/workspace";
import { getPlanLimits } from "@/lib/plans";
import { prisma } from "@/lib/db";
import { TeamManagementSection } from "./TeamManagementSection";

export default async function SettingsPage() {
  const user = await currentUser();
  const { userId } = await auth();

  let prospectOptions: Awaited<ReturnType<typeof getProspectFieldOptions>> = [];
  let prospectOptionsIsAdmin = false;
  let teamMembers: Awaited<ReturnType<typeof getWorkspaceMembers>> = [];
  let teamInvites: Awaited<ReturnType<typeof getWorkspaceInvites>> = [];
  let teamUsersLimit = 1;
  let usage: {
    plan: string;
    contacts: number;
    contactsLimit: number;
    users: number;
    usersLimit: number;
    deals: number;
    dealsLimit: number;
  } | null = null;

  try {
    if (userId) {
      const workspaceId = await ensureWorkspaceForUser(userId);
      const isAdmin = await isWorkspaceAdmin(workspaceId, userId);
      prospectOptions = isAdmin
        ? await getProspectFieldOptions(userId)
        : await getProspectFieldOptionsForWorkspace(workspaceId);
      prospectOptionsIsAdmin = isAdmin;
      const [workspace, contactsCount, membersCount, dealsCount, members, invites] = await Promise.all([
        getWorkspace(workspaceId),
        prisma.contact.count({ where: { workspaceId } }),
        prisma.workspaceMember.count({ where: { workspaceId } }),
        prisma.deal.count({ where: { workspaceId } }),
        isAdmin ? getWorkspaceMembers(workspaceId) : [],
        isAdmin ? getWorkspaceInvites(workspaceId) : [],
      ]);
      const limits = workspace ? getPlanLimits(workspace.plan) : null;
      if (workspace && limits) {
        usage = {
          plan: workspace.plan,
          contacts: contactsCount,
          contactsLimit: limits.contacts,
          users: membersCount,
          usersLimit: limits.users,
          deals: dealsCount,
          dealsLimit: limits.deals,
        };
        if (isAdmin) {
          teamMembers = members;
          teamInvites = invites;
          teamUsersLimit = limits.users;
        }
      }
    }
  } catch (e) {
    console.error("[Settings] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load settings. Please try again." />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          App and user profile.
        </p>
      </div>
      {!user && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to see and edit your profile.
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {user
              ? "Your account is managed by Clerk. Edit your name and email in the account menu (avatar in the sidebar) or in the Clerk Dashboard."
              : "Sign in to see your profile details."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Your name"
              defaultValue={user?.fullName ?? ""}
              disabled
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="Email"
              defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""}
              disabled
            />
          </div>
          <Button disabled>Save (profile managed by Clerk)</Button>
          {!user && (
            <p className="text-sm text-muted-foreground">
              <Link href="/sign-in" className="underline hover:no-underline">Sign in</Link> to access your profile.
            </p>
          )}
        </CardContent>
      </Card>

      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>
              Current usage vs plan limits. Billing (e.g. Mollie) can be connected later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Contacts</TableCell>
                  <TableCell className="text-right">{usage.contacts.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{usage.contactsLimit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{usage.plan}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Users</TableCell>
                  <TableCell className="text-right">{usage.users}</TableCell>
                  <TableCell className="text-right">{usage.usersLimit}</TableCell>
                  <TableCell className="text-right">{usage.plan}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Deals</TableCell>
                  <TableCell className="text-right">{usage.deals.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{usage.dealsLimit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{usage.plan}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {prospectOptionsIsAdmin && (
        <TeamManagementSection
          members={teamMembers}
          invites={teamInvites}
          usersLimit={teamUsersLimit}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prospect key metrics</CardTitle>
          <CardDescription>
            Define dropdown options for industry, size (turnover), and size (personnel) when adding or editing leads and companies. Only an administrator can edit these.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!userId ? (
            <p className="text-sm text-muted-foreground">
              <Link href="/sign-in" className="underline hover:no-underline">Sign in</Link> to define and edit these options.
            </p>
          ) : prospectOptionsIsAdmin ? (
            <ProspectMetricsEditor options={prospectOptions} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Only an administrator can edit prospect key metrics. You can view and use the options set by your admin when adding contacts.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
