import type { FunnelStage } from "@prisma/client";

// —— Triggers (conditions) ——
export type TriggerContactCreated = {
  type: "contact_created";
  stage?: FunnelStage; // if set, only when contact is in this stage (e.g. AWARENESS)
};

export type TriggerStageChanged = {
  type: "stage_changed";
  fromStage?: FunnelStage;
  toStage?: FunnelStage; // e.g. DESIRE
};

export type TriggerTaskCompleted = {
  type: "task_completed";
  taskTitleContains?: string; // optional filter
};

export type AutomationTrigger =
  | TriggerContactCreated
  | TriggerStageChanged
  | TriggerTaskCompleted;

// —— Actions ——
export type ActionCreateTask = {
  type: "create_task";
  title: string;
  dueDays?: number; // days from now
  contactIdFromEvent?: boolean; // use contact from event
};

export type ActionSendEmail = {
  type: "send_email";
  templateId: string;
  subject: string;
  contactIdFromEvent?: boolean;
};

export type ActionUpdateStage = {
  type: "update_stage";
  stage: FunnelStage;
};

export type AutomationAction =
  | ActionCreateTask
  | ActionSendEmail
  | ActionUpdateStage;

// —— Recipe (preconfigured in code) ——
export type AutomationRecipe = {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
};

// —— Events (payload when something happens) ——
export type EventContactCreated = {
  type: "contact_created";
  contactId: string;
  userId: string;
  stage: FunnelStage;
};

export type EventStageChanged = {
  type: "stage_changed";
  contactId: string;
  userId: string;
  fromStage: FunnelStage;
  toStage: FunnelStage;
};

export type EventTaskCompleted = {
  type: "task_completed";
  taskId: string;
  contactId: string | null;
  dealId: string | null;
  userId: string;
  taskTitle: string;
};

export type AutomationEvent =
  | EventContactCreated
  | EventStageChanged
  | EventTaskCompleted;
