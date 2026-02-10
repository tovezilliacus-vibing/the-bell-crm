"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function CopyEmbedButton({
  publicKey,
  baseUrl = "https://YOUR_DOMAIN",
}: {
  publicKey: string;
  baseUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${baseUrl.replace(/\/$/, "")}/api/forms/${publicKey}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      setCopied(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="h-3 w-3 mr-1" />
      {copied ? "Copied" : "Copy URL"}
    </Button>
  );
}
