import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageUnavailable({ message = "We couldn't load this page. Please try again." }: { message?: string }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">Page unavailable</h2>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <Button asChild className="mt-4">
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </div>
  );
}
