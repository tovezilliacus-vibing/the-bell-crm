"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { disconnectEmailAccount } from "./email-connect-actions";

export function ConnectedEmailSection({
  connected,
}: {
  connected: { provider: string; email: string } | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (connected) {
    const label = connected.provider === "gmail" ? "Gmail" : connected.provider;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm">
          Connected as <strong>{connected.email}</strong> ({label})
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await disconnectEmailAccount();
            setPending(false);
            router.refresh();
          }}
        >
          {pending ? "…" : "Disconnect"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size="sm">
        <a href="/api/email/connect/google">Connect Gmail</a>
      </Button>
      <span className="text-sm text-muted-foreground">Use your own Gmail for 1:1 sending</span>
    </div>
  );
}
