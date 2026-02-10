/**
 * Billing tier limits (soft limits for "simple, generous" plans).
 * Free: 1 user. Starter: 2–10 users. Growth: 11–50 users.
 */

import type { BillingTier } from "@prisma/client";

export type PlanLimits = {
  users: number;
  contacts: number;
  deals: number;
};

export const PLAN_LIMITS: Record<BillingTier, PlanLimits> = {
  FREE: {
    users: 1,
    contacts: 5_000,
    deals: 500,
  },
  STARTER: {
    users: 10,
    contacts: 10_000,
    deals: 1_000,
  },
  GROWTH: {
    users: 50,
    contacts: 50_000,
    deals: 10_000,
  },
  PAID: {
    // legacy; same as GROWTH
    users: 50,
    contacts: 50_000,
    deals: 10_000,
  },
};

export function getPlanLimits(plan: BillingTier): PlanLimits {
  return PLAN_LIMITS[plan];
}
