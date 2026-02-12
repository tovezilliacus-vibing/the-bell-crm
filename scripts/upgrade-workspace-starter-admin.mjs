#!/usr/bin/env node
/**
 * One-time script: set a workspace to Starter plan and set a user's role to ADMIN.
 *
 * Usage (from project root). DATABASE_URL must be set (e.g. in .env):
 *   WORKSPACE_ID=clx... USER_ID=user_2... node scripts/upgrade-workspace-starter-admin.mjs
 *
 * With .env: set -a && source .env && set +a  (then run the command above), or:
 *   npx dotenv -e .env -- node -e "require('child_process').execSync('WORKSPACE_ID=... USER_ID=... node scripts/upgrade-workspace-starter-admin.mjs', {stdio:'inherit', env: process.env})"
 * Or from Supabase SQL Editor run the SQL in docs/USER-MANAGEMENT.md instead.
 */

import { PrismaClient } from "@prisma/client";

const workspaceId = process.env.WORKSPACE_ID;
const userId = process.env.USER_ID;

if (!workspaceId || !userId) {
  console.error("Usage: WORKSPACE_ID=<id> USER_ID=<clerk_user_id> node scripts/upgrade-workspace-starter-admin.mjs");
  console.error("Example: WORKSPACE_ID=clx123abc USER_ID=user_2xyz node scripts/upgrade-workspace-starter-admin.mjs");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });
  if (!member) {
    console.error("No membership found for that workspace and user. Add the user to the workspace first.");
    process.exit(1);
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan: "STARTER" },
  });
  await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role: "ADMIN" },
  });

  console.log("Done. Workspace plan set to STARTER and user role set to ADMIN.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
