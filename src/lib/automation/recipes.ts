import type { AutomationRecipe } from "./types";

/**
 * Preconfigured AIDA-focused automation recipes (v1).
 * Toggle on/off per user in the Automation page.
 */
export const AUTOMATION_RECIPES: AutomationRecipe[] = [
  {
    id: "nurture-awareness-7d",
    name: "Awareness nurture (7 days)",
    description:
      "When a new contact is created in Awareness: send a 3-step nurture email sequence over 7 days, then create a follow-up task.",
    trigger: { type: "contact_created", stage: "AWARENESS" },
    actions: [
      { type: "send_email", templateId: "nurture-1", subject: "Welcome – here’s how we can help", contactIdFromEvent: true },
      { type: "create_task", title: "Follow-up: nurture day 3", dueDays: 3, contactIdFromEvent: true },
      { type: "send_email", templateId: "nurture-2", subject: "Quick tip for you", contactIdFromEvent: true },
      { type: "create_task", title: "Follow-up: nurture day 7 – check engagement", dueDays: 7, contactIdFromEvent: true },
      { type: "send_email", templateId: "nurture-3", subject: "One more thing...", contactIdFromEvent: true },
    ],
  },
  {
    id: "desire-demo-and-task",
    name: "Desire: schedule demo",
    description:
      "When a contact moves to Desire: create a task to schedule a demo and send a calendar link email.",
    trigger: { type: "stage_changed", toStage: "DESIRE" },
    actions: [
      { type: "create_task", title: "Schedule demo", dueDays: 2, contactIdFromEvent: true },
      { type: "send_email", templateId: "demo-calendar-link", subject: "Book a time for your demo", contactIdFromEvent: true },
    ],
  },
  {
    id: "action-welcome",
    name: "Action: welcome customer",
    description:
      "When a contact moves to Action: create a short-term check-in task.",
    trigger: { type: "stage_changed", toStage: "ACTION" },
    actions: [
      { type: "create_task", title: "Check-in with new customer", dueDays: 7, contactIdFromEvent: true },
    ],
  },
  {
    id: "interest-resource",
    name: "Interest: send resource",
    description:
      "When a contact moves to Interest: send a resource email and create a follow-up task.",
    trigger: { type: "stage_changed", toStage: "INTEREST" },
    actions: [
      { type: "send_email", templateId: "interest-resource", subject: "Resources you might find useful", contactIdFromEvent: true },
      { type: "create_task", title: "Follow up on resource", dueDays: 5, contactIdFromEvent: true },
    ],
  },
  {
    id: "task-done-next-step",
    name: "After task: next step",
    description:
      "When any task is completed for a contact: create a short follow-up task (e.g. log activity or next touch).",
    trigger: { type: "task_completed" },
    actions: [
      { type: "create_task", title: "Next step after completed task", dueDays: 1, contactIdFromEvent: true },
    ],
  },
];
