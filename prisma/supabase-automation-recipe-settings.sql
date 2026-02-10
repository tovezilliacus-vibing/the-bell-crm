-- Run in Supabase SQL Editor. Per-user enable/disable for automation recipes.
CREATE TABLE IF NOT EXISTS "automation_recipe_settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_recipe_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automation_recipe_settings_userId_recipeId_key"
  ON "automation_recipe_settings"("userId", "recipeId");
CREATE INDEX IF NOT EXISTS "automation_recipe_settings_userId_idx"
  ON "automation_recipe_settings"("userId");
