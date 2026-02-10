"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import type { FormField } from "@prisma/client";

export function EmbedCodeBlock({
  publicKey,
  baseUrl,
  fields,
}: {
  publicKey: string;
  baseUrl: string;
  fields: FormField[];
}) {
  const [copied, setCopied] = useState<"html" | "url" | null>(null);
  const actionUrl = `${baseUrl.replace(/\/$/, "")}/api/forms/${publicKey}`;

  const defaultInputs = [
    { name: "name", type: "text", placeholder: "Your name" },
    { name: "email", type: "email", placeholder: "Your email", required: true },
    { name: "message", type: "textarea", placeholder: "How can we help?" },
  ];
  const fieldInputs = fields.length > 0
    ? fields.map((f) => ({
        name: f.name,
        type: f.type === "textarea" ? "textarea" : f.type === "email" ? "email" : "text",
        placeholder: f.label,
        required: f.required,
      }))
    : defaultInputs;

  const htmlSnippet = `<form action="${actionUrl}" method="POST">
  <input type="hidden" name="form_id" value="${publicKey}" />
${fieldInputs
  .map((f) =>
    f.type === "textarea"
      ? `  <textarea name="${f.name}" placeholder="${f.placeholder}"${f.required ? " required" : ""}></textarea>`
      : `  <input type="${f.type}" name="${f.name}" placeholder="${f.placeholder}"${f.required ? " required" : ""} />`
  )
  .join("\n")}
  <button type="submit">Send</button>
</form>`;

  async function copy(value: string, which: "html" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed code</CardTitle>
        <CardDescription>
          Paste this on your site. Submissions create or update contacts in your CRM (Awareness stage).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Form action URL</p>
          <pre className="rounded bg-muted p-2 text-xs overflow-x-auto">{actionUrl}</pre>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => copy(actionUrl, "url")}
          >
            <Copy className="h-3 w-3 mr-1" />
            {copied === "url" ? "Copied" : "Copy URL"}
          </Button>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">HTML form (copy and paste)</p>
          <pre className="rounded bg-muted p-2 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
            {htmlSnippet}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => copy(htmlSnippet, "html")}
          >
            <Copy className="h-3 w-3 mr-1" />
            {copied === "html" ? "Copied" : "Copy HTML"}
          </Button>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Script embed (optional)</p>
          <p className="text-xs text-muted-foreground mb-1">
            Add a div where the form should appear, then load the script with your form key.
          </p>
          <pre className="rounded bg-muted p-2 text-xs overflow-x-auto">{`<div id="form-container"></div>
<script src="${baseUrl.replace(/\/$/, "")}/embed" data-form="${publicKey}"></script>`}</pre>
        </div>
        <p className="text-xs text-muted-foreground">
          TODO: Rate limiting on submission endpoint; optional captcha.
        </p>
      </CardContent>
    </Card>
  );
}
