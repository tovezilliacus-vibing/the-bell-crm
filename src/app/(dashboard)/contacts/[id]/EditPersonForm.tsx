"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateContact } from "../actions";
import { createCompany } from "../../companies/actions";
import type { CompanyLifecycle } from "@prisma/client";

type Company = { id: string; name: string };

const LIFECYCLE_OPTIONS: { value: CompanyLifecycle; label: string }[] = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
];

function displayNameFromParts(
  firstName: string | null,
  lastName: string | null,
  name: string | null
): string {
  const first = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (first) return first;
  if (name?.trim()) return name.trim();
  return "";
}

export function EditPersonForm({
  contactId,
  initialName,
  initialFirstName,
  initialLastName,
  initialEmail,
  initialPhone,
  initialCompanyId,
  companies,
}: {
  contactId: string;
  initialName: string | null;
  initialFirstName: string | null;
  initialLastName: string | null;
  initialEmail: string | null;
  initialPhone: string | null;
  initialCompanyId: string | null;
  companies: Company[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(
    () =>
      initialName?.trim() ||
      displayNameFromParts(initialFirstName, initialLastName, initialName)
  );
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");
  const [companyInput, setCompanyInput] = useState("");
  const [companySuggestionsOpen, setCompanySuggestionsOpen] = useState(false);
  const [addNewCompanyOpen, setAddNewCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLifecycle, setNewCompanyLifecycle] =
    useState<CompanyLifecycle>("PROSPECT");
  const [pendingNewCompany, setPendingNewCompany] = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const companyListRef = useRef<HTMLDivElement>(null);

  const selectedCompany = companies.find((c) => c.id === companyId);
  const query = companyInput.trim().toLowerCase();
  const suggestions = query
    ? companies.filter((c) => c.name.toLowerCase().includes(query))
    : companies;
  const exactMatch = companies.find(
    (c) => c.name.toLowerCase() === query
  );
  const showAddNew =
    addNewCompanyOpen ||
    (query.length > 0 && !exactMatch && suggestions.length === 0);

  useEffect(() => {
    if (!open) return;
    const initialCompanyName = selectedCompany?.name ?? "";
    setCompanyInput(initialCompanyName);
  }, [open, initialCompanyId, companies, selectedCompany?.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        companyListRef.current &&
        !companyListRef.current.contains(event.target as Node) &&
        companyInputRef.current &&
        !companyInputRef.current.contains(event.target as Node)
      ) {
        setCompanySuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateContact(contactId, {
      name: name.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      companyId: companyId.trim() || null,
    });
    setPending(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update person.");
    }
  }

  function handleOpen() {
    setName(
      initialName?.trim() ||
        displayNameFromParts(initialFirstName, initialLastName, initialName)
    );
    setEmail(initialEmail ?? "");
    setPhone(initialPhone ?? "");
    setCompanyId(initialCompanyId ?? "");
    setCompanyInput(
      companies.find((c) => c.id === initialCompanyId)?.name ?? ""
    );
    setAddNewCompanyOpen(false);
    setNewCompanyName("");
    setNewCompanyLifecycle("PROSPECT");
    setError(null);
    setOpen(true);
  }

  function selectCompany(id: string, companyName: string) {
    setCompanyId(id);
    setCompanyInput(companyName);
    setCompanySuggestionsOpen(false);
    setAddNewCompanyOpen(false);
  }

  function clearCompany() {
    setCompanyId("");
    setCompanyInput("");
    setCompanySuggestionsOpen(false);
    setAddNewCompanyOpen(false);
  }

  function openAddNewCompany() {
    setNewCompanyName(companyInput.trim() || "");
    setNewCompanyLifecycle("PROSPECT");
    setAddNewCompanyOpen(true);
    setCompanySuggestionsOpen(false);
  }

  async function handleCreateCompany() {
    const toCreate = newCompanyName.trim() || companyInput.trim();
    if (!toCreate) return;
    setPendingNewCompany(true);
    const result = await createCompany({
      name: toCreate,
      lifecycleStage: newCompanyLifecycle,
    });
    setPendingNewCompany(false);
    if (result.ok && result.companyId) {
      setCompanyId(result.companyId);
      setCompanyInput(toCreate);
      setAddNewCompanyOpen(false);
      setNewCompanyName("");
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={handleOpen}>
        Edit person
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit person</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="edit-phone">Phone</Label>
        <Input
          id="edit-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          className="mt-1"
        />
      </div>
      <div className="relative" ref={companyListRef}>
        <Label htmlFor="edit-company">Company</Label>
        <Input
          ref={companyInputRef}
          id="edit-company"
          type="text"
          value={companyInput}
          onChange={(e) => {
            setCompanyInput(e.target.value);
            setCompanySuggestionsOpen(true);
            if (companyId) setCompanyId("");
          }}
          onFocus={() => setCompanySuggestionsOpen(true)}
          placeholder="Type to search or add new company"
          className="mt-1"
          autoComplete="off"
        />
        {companySuggestionsOpen && (
          <div className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
            {query && (
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                onClick={clearCompany}
              >
                <span className="text-muted-foreground">No company</span>
              </button>
            )}
            {suggestions.slice(0, 8).map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => selectCompany(c.id, c.name)}
              >
                {c.name}
              </button>
            ))}
            {query.length > 0 && !exactMatch && (
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-muted border-t"
                onClick={openAddNewCompany}
              >
                + Add &quot;{companyInput.trim() || query}&quot; as new company
              </button>
            )}
          </div>
        )}
      </div>

      {showAddNew && addNewCompanyOpen && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Add new company</p>
          <div>
            <Label htmlFor="new-company-name">Company name</Label>
            <Input
              id="new-company-name"
              value={newCompanyName || companyInput}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Lifecycle</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
              value={newCompanyLifecycle}
              onChange={(e) =>
                setNewCompanyLifecycle(e.target.value as CompanyLifecycle)
              }
            >
              {LIFECYCLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCompany}
              disabled={pendingNewCompany || !(newCompanyName.trim() || companyInput.trim())}
            >
              {pendingNewCompany ? "Adding…" : "Add company"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddNewCompanyOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
