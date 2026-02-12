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
  const [syncPending, setSyncPending] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (connected) {
    const label = connected.provider === "gmail" ? "Gmail" : connected.provider;
    return (
      <div className="space-y-2">
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
          {connected.provider === "gmail" && (
            <Button
              variant="outline"
              size="sm"
              disabled={syncPending}
              onClick={async () => {
                setSyncPending(true);
                setSyncMessage(null);
                try {
                  const res = await fetch("/api/email/sync", { method: "POST" });
                  const data = await res.json();
                  if (data.ok) {
                    setSyncMessage(
                      `Synced ${data.synced ?? 0} email(s). ${data.createdContacts ? `Created ${data.createdContacts} new contact(s).` : ""}`
                    );
                    router.refresh();
                  } else {
                    setSyncMessage(data.error ?? "Sync failed");
                  }
                } catch {
                  setSyncMessage("Sync failed");
                }
                setSyncPending(false);
              }}
            >
              {syncPending ? "Syncing…" : "Sync inbox"}
            </Button>
          )}
        </div>
        {syncMessage && (
          <p className="text-sm text-muted-foreground">{syncMessage}</p>
        )}
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
