"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type EmailItem = {
  id: string;
  direction: string;
  fromAddress: string;
  toAddresses: string;
  subject: string | null;
  bodySnippet: string | null;
  body: string | null;
  sentAt: Date;
};

function mailtoReply(e: EmailItem): string {
  const to = e.direction === "inbound" ? e.fromAddress : e.toAddresses.split(",")[0]?.trim() || "";
  const subject = `Re: ${(e.subject ?? "").replace(/^Re:\s*/i, "")}`;
  const quoted = (e.body ?? e.bodySnippet ?? "")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const body = quoted ? `\n\n${quoted}` : "";
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}

function mailtoForward(e: EmailItem): string {
  const subject = `Fwd: ${e.subject ?? "(No subject)"}`;
  const quoted = [
    `---------- Forwarded message ----------`,
    `From: ${e.fromAddress}`,
    `To: ${e.toAddresses}`,
    `Date: ${new Date(e.sentAt).toLocaleString()}`,
    `Subject: ${e.subject ?? ""}`,
    ``,
    e.body ?? e.bodySnippet ?? "",
  ].join("\n");
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", quoted);
  return `mailto:?${params.toString()}`;
}

export function ContactEmailsList({ emails }: { emails: EmailItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (emails.length === 0) return null;

  return (
    <ul className="space-y-3">
      {emails.map((e) => {
        const isExpanded = expandedId === e.id;
        return (
          <li
            key={e.id}
            className="rounded-md border border-border bg-card text-card-foreground px-3 py-2 text-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : e.id)}
              className="w-full text-left"
            >
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span
                  className={
                    e.direction === "inbound"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-green-600 dark:text-green-400"
                  }
                >
                  {e.direction === "inbound" ? "In" : "Out"}
                </span>
                <span>{new Date(e.sentAt).toLocaleString()}</span>
              </div>
              <p className="font-medium mt-1 text-foreground hover:underline">
                {e.subject ?? "(No subject)"}
              </p>
              {!isExpanded && e.bodySnippet && (
                <p className="text-muted-foreground mt-1 line-clamp-2">{e.bodySnippet}</p>
              )}
            </button>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                <dl className="grid gap-1 text-muted-foreground text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-foreground">From</dt>
                    <dd>{e.fromAddress}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">To</dt>
                    <dd>{e.toAddresses}</dd>
                  </div>
                </dl>
                <div className="rounded bg-muted/50 p-3 text-foreground whitespace-pre-wrap break-words">
                  {(e.body ?? e.bodySnippet ?? "(No body)").slice(0, 50_000)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={mailtoReply(e)}>Reply</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={mailtoForward(e)}>Forward</a>
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
