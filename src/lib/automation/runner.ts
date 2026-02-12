import { prisma } from "@/lib/db";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { sendEmail } from "./email-service";
import { AUTOMATION_RECIPES } from "./recipes";
import type { AutomationEvent, AutomationRecipe } from "./types";

/** Get recipe IDs that are enabled for this user. */
export async function getEnabledRecipeIds(userId: string): Promise<Set<string>> {
  const settings = await prisma.automationRecipeSetting.findMany({
    where: { userId, enabled: true },
    select: { recipeId: true },
  });
  return new Set(settings.map((s) => s.recipeId));
}

/** Check if the event matches the recipe's trigger. */
function triggerMatches(recipe: AutomationRecipe, event: AutomationEvent): boolean {
  const t = recipe.trigger;
  if (t.type !== event.type) return false;

  if (event.type === "contact_created") {
    if (t.type !== "contact_created") return false;
    if (t.stage != null && event.stage !== t.stage) return false;
    return true;
  }

  if (event.type === "stage_changed") {
    if (t.type !== "stage_changed") return false;
    if (t.fromStage != null && event.fromStage !== t.fromStage) return false;
    if (t.toStage != null && event.toStage !== t.toStage) return false;
    return true;
  }

  if (event.type === "task_completed") {
    if (t.type !== "task_completed") return false;
    if (t.taskTitleContains != null && !event.taskTitle.toLowerCase().includes(t.taskTitleContains.toLowerCase()))
      return false;
    return true;
  }

  return false;
}

function getContactIdFromEvent(event: AutomationEvent): string | null {
  if (event.type === "contact_created" || event.type === "stage_changed") return event.contactId;
  if (event.type === "task_completed") return event.contactId;
  return null;
}

/** Resolve due date from "dueDays" (days from now). */
function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** Execute one recipe's actions. */
async function executeRecipe(
  recipe: AutomationRecipe,
  event: AutomationEvent,
  userId: string
): Promise<void> {
  const workspaceId = await ensureWorkspaceForUser(userId);
  const contactId = getContactIdFromEvent(event);
  const contact = contactId
    ? await prisma.contact.findFirst({
        where: { id: contactId, workspaceId },
        select: { id: true, email: true, firstName: true, lastName: true, name: true },
      })
    : null;
  const toEmail = contact?.email ?? null;

  for (const action of recipe.actions) {
    if (action.type === "create_task") {
      const useContactId = action.contactIdFromEvent ? contactId : null;
      if (!useContactId) continue; // task requires a contact in this event
      await prisma.task.create({
        data: {
          workspaceId,
          userId,
          contactId: useContactId,
          title: action.title,
          dueAt: action.dueDays != null ? addDays(action.dueDays) : null,
          status: "PENDING",
        },
      });
    } else if (action.type === "send_email") {
      if (!toEmail) continue;
      await sendEmail({
        to: toEmail,
        subject: action.subject,
        templateId: action.templateId,
        context: contact
          ? {
              firstName: contact.firstName ?? "",
              lastName: contact.lastName ?? "",
              name: contact.name ?? "",
            }
          : undefined,
        userId,
      });
    } else if (action.type === "update_stage" && contactId) {
      const fromStage = event.type === "stage_changed" ? event.toStage : event.type === "contact_created" ? event.stage : null;
      await prisma.$transaction([
        prisma.contact.update({
          where: { id: contactId },
          data: { funnelStage: action.stage },
        }),
        prisma.contactStageHistory.create({
          data: { contactId, fromStage, toStage: action.stage },
        }),
      ]);
    }
  }
}

/**
 * Run automation: find enabled recipes that match the event and execute their actions.
 * Call this after contact created, stage changed, or task completed.
 */
export async function runAutomation(event: AutomationEvent): Promise<void> {
  const userId = event.type === "contact_created" || event.type === "stage_changed"
    ? event.userId
    : event.userId;
  const enabledIds = await getEnabledRecipeIds(userId);
  const recipes = AUTOMATION_RECIPES.filter((r) => enabledIds.has(r.id) && triggerMatches(r, event));
  for (const recipe of recipes) {
    try {
      await executeRecipe(recipe, event, userId);
    } catch (err) {
      // Log and continue with other recipes
      console.error(`[Automation] recipe ${recipe.id} failed:`, err);
    }
  }
}
