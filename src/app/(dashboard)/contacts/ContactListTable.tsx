"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { personDisplayName } from "@/lib/leads";
import { FUNNEL_STAGE_LABELS } from "@/lib/funnel";
import type { FunnelStage } from "@prisma/client";
import { deleteContacts } from "./actions";

export type ContactRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  funnelStage: FunnelStage;
  lastActivity: string | null;
  nextTaskDue: string | null;
};

function escapeCsvCell(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value).trim();
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportSelectedAsCsv(contacts: ContactRow[], selectedIds: Set<string>) {
  const rows = contacts.filter((c) => selectedIds.has(c.id));
  if (rows.length === 0) return;
  const headers = [
    "First name",
    "Last name",
    "Name",
    "Email",
    "Phone",
    "Company",
    "Stage",
    "Last activity",
    "Next task due",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((c) =>
      [
        escapeCsvCell(c.firstName),
        escapeCsvCell(c.lastName),
        escapeCsvCell(c.name),
        escapeCsvCell(c.email),
        escapeCsvCell(c.phone),
        escapeCsvCell(c.companyName),
        escapeCsvCell(FUNNEL_STAGE_LABELS[c.funnelStage]),
        escapeCsvCell(c.lastActivity),
        escapeCsvCell(c.nextTaskDue),
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ContactListTable({
  contacts,
  stageFilter,
}: {
  contacts: ContactRow[];
  stageFilter: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const allIds = contacts.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  function handleExportCsv() {
    exportSelectedAsCsv(contacts, selected);
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} contact(s)? This cannot be undone.`)) return;
    setPending(true);
    const result = await deleteContacts(Array.from(selected));
    setPending(false);
    setSelected(new Set());
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error ?? "Delete failed");
    }
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {stageFilter && stageFilter !== "ALL"
          ? `No contacts in ${FUNNEL_STAGE_LABELS[stageFilter as FunnelStage]}.`
          : "No contacts yet."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={pending}>
            Export as CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
            disabled={pending}
          >
            Clear selection
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all"
                className="h-4 w-4 rounded border-input"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Last activity</TableHead>
            <TableHead>Next task due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="w-10">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleOne(c.id)}
                  aria-label={`Select ${personDisplayName(c.firstName, c.lastName, c.name)}`}
                  className="h-4 w-4 rounded border-input"
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/contacts/${c.id}`}
                  className="text-primary hover:underline"
                >
                  {personDisplayName(c.firstName, c.lastName, c.name)}
                </Link>
              </TableCell>
              <TableCell>{c.companyName ?? "—"}</TableCell>
              <TableCell>{FUNNEL_STAGE_LABELS[c.funnelStage]}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {c.lastActivity ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {c.nextTaskDue ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
