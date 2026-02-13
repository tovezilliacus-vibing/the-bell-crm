"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompany } from "../actions";
import type { CompanyLifecycle } from "@prisma/client";

const LIFECYCLE_OPTIONS: { value: CompanyLifecycle; label: string }[] = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
];

type CompanyForEdit = {
  id: string;
  name: string;
  lifecycleStage: CompanyLifecycle;
  industry: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
};

export function EditCompanyForm({ company }: { company: CompanyForEdit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(company.name);
  const [lifecycle, setLifecycle] = useState<CompanyLifecycle>(company.lifecycleStage);
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [streetAddress, setStreetAddress] = useState(company.streetAddress ?? "");
  const [city, setCity] = useState(company.city ?? "");
  const [state, setState] = useState(company.state ?? "");
  const [country, setCountry] = useState(company.country ?? "");
  const [vatNumber, setVatNumber] = useState(company.vatNumber ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(company.registrationNumber ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = name?.trim();
    if (!trimmed) {
      setError("Company name is required.");
      return;
    }
    setPending(true);
    const result = await updateCompany(company.id, {
      name: trimmed,
      lifecycleStage: lifecycle,
      industry: industry.trim() || null,
      streetAddress: streetAddress.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
      vatNumber: vatNumber.trim() || null,
      registrationNumber: registrationNumber.trim() || null,
    });
    setPending(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update company.");
    }
  }

  function resetForm() {
    setName(company.name);
    setLifecycle(company.lifecycleStage);
    setIndustry(company.industry ?? "");
    setStreetAddress(company.streetAddress ?? "");
    setCity(company.city ?? "");
    setState(company.state ?? "");
    setCountry(company.country ?? "");
    setVatNumber(company.vatNumber ?? "");
    setRegistrationNumber(company.registrationNumber ?? "");
    setError(null);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => { setOpen(true); resetForm(); }}>
        Edit company
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit company</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); resetForm(); }}>
          Cancel
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Company name, industry, address, and invoicing details.
      </p>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
      )}

      <div>
        <Label htmlFor="edit-company-name">Company name</Label>
        <Input
          id="edit-company-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label>Lifecycle stage</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
          value={lifecycle}
          onChange={(e) => setLifecycle(e.target.value as CompanyLifecycle)}
        >
          {LIFECYCLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="edit-industry">Industry</Label>
        <Input
          id="edit-industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Technology, Healthcare"
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Address</span>
        <div>
          <Label htmlFor="edit-streetAddress" className="text-muted-foreground font-normal">Street address</Label>
          <Input
            id="edit-streetAddress"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Street and number"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="edit-city" className="text-muted-foreground font-normal">City</Label>
            <Input
              id="edit-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-state" className="text-muted-foreground font-normal">State / Region</Label>
            <Input
              id="edit-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="edit-country" className="text-muted-foreground font-normal">Country</Label>
          <Input
            id="edit-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Invoicing details</span>
        <div>
          <Label htmlFor="edit-vatNumber" className="text-muted-foreground font-normal">VAT number</Label>
          <Input
            id="edit-vatNumber"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder="e.g. SE123456789001"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="edit-registrationNumber" className="text-muted-foreground font-normal">Registration number</Label>
          <Input
            id="edit-registrationNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Company / org number"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
