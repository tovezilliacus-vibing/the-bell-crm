import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { AUTOMATION_RECIPES } from "@/lib/automation/recipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeToggle } from "./RecipeToggle";

export default async function AutomationPage() {
  const { userId } = await auth();

  let enabledByRecipeId: Map<string, boolean>;
  try {
    const settings = userId
      ? await prisma.automationRecipeSetting.findMany({
          where: { userId },
          select: { recipeId: true, enabled: true },
        })
      : [];
    enabledByRecipeId = new Map(settings.map((s) => [s.recipeId, s.enabled]));
  } catch (e) {
    console.error("[Automation] load failed:", e);
    const { PageUnavailable } = await import("@/components/PageUnavailable");
    return <PageUnavailable message="We couldn't load automation. Please try again." />;
  }

  return (
    <div className="p-6 space-y-6">
      {!userId && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          Sign in to manage automation.
        </p>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automation</h1>
        <p className="text-muted-foreground">
          AIDA-focused recipes. Turn on the ones you want; they run when contacts are created, stages change, or tasks are completed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
          <CardDescription>
            Preconfigured automations. Enable or disable per recipe. Email sending is stubbed until you connect a provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!userId ? (
            <p className="text-sm text-muted-foreground">Sign in to see recipes.</p>
          ) : (
            <ul className="space-y-4">
              {AUTOMATION_RECIPES.map((recipe) => (
                <li
                  key={recipe.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{recipe.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recipe.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Trigger: {recipe.trigger.type}
                      {recipe.trigger.type === "contact_created" && "stage" in recipe.trigger && recipe.trigger.stage && ` (${recipe.trigger.stage})`}
                      {recipe.trigger.type === "stage_changed" && "toStage" in recipe.trigger && recipe.trigger.toStage && ` → ${recipe.trigger.toStage}`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <RecipeToggle
                      recipeId={recipe.id}
                      enabled={enabledByRecipeId.get(recipe.id) ?? false}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
