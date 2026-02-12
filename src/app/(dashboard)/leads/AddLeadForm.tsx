"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { SearchableCountrySelect } from "@/components/ui/searchable-country-select";
import { LEAD_SOURCE_OPTIONS } from "@/lib/leads";
import type { LeadSource } from "@prisma/client";
import { createLead } from "./actions";

/** Default industry options when none are defined in Settings. */
const DEFAULT_INDUSTRIES: SelectOption[] = [
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance", label: "Finance" },
  { value: "Retail", label: "Retail" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Professional services", label: "Professional services" },
  { value: "Education", label: "Education" },
  { value: "Construction", label: "Construction" },
  { value: "Hospitality", label: "Hospitality" },
  { value: "Other", label: "Other" },
];

type Company = { id: string; name: string };
type ProspectOption = { id: string; fieldType: string; value: string };

export function AddLeadForm({
  companies,
  industryOptions,
  sizeTurnoverOptions,
  sizePersonnelOptions,
  buttonLabel = "Add lead",
  formTitle = "New lead",
}: {
  companies: Company[];
  industryOptions: ProspectOption[];
  sizeTurnoverOptions: ProspectOption[];
  sizePersonnelOptions: ProspectOption[];
  buttonLabel?: string;
  formTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNewCompany, setUseNewCompany] = useState(false);
  const [leadSource, setLeadSource] = useState<string>("");

  const industrySelectOptions: SelectOption[] =
    industryOptions?.length > 0
      ? industryOptions.map((o) => ({ value: o.value, label: o.value }))
      : DEFAULT_INDUSTRIES;
  const sizeTurnoverSelectOptions: SelectOption[] = sizeTurnoverOptions.map(
    (o) => ({ value: o.value, label: o.value })
  );
  const sizePersonnelSelectOptions: SelectOption[] = sizePersonnelOptions.map(
    (o) => ({ value: o.value, label: o.value })
  );
  const showReferralFrom = leadSource === "REFERRAL";

  useEffect(() => {
    if (open) setLeadSource("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const companyValue = formData.get("companyId") as string;

    const isNewCompany = companyValue === "__new__";
    const companyId =
      !isNewCompany && companyValue ? companyValue : null;
    const newCompanyName = isNewCompany
      ? (formData.get("newCompanyName") as string)
      : undefined;

    setPending(true);
    const result = await createLead({
      firstName: (formData.get("firstName") as string) ?? "",
      lastName: (formData.get("lastName") as string) ?? "",
      email: (formData.get("email") as string) ?? "",
      phone: (formData.get("phone") as string) ?? "",
      leadSource: ((formData.get("leadSource") as string) ?? "") as LeadSource | "",
      referralFrom: (formData.get("referralFrom") as string) ?? "",
      companyId,
      newCompanyName,
      industry: (formData.get("industry") as string) || undefined,
      sizeTurnover: (formData.get("sizeTurnover") as string) || undefined,
      sizePersonnel: (formData.get("sizePersonnel") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
    });
    setPending(false);
    if (result.ok) {
      form.reset();
      setUseNewCompany(false);
      setLeadSource("");
      setOpen(false);
    } else {
      setError(result.error ?? "Something went wrong");
    }
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <Button onClick={() => setOpen(true)}>{buttonLabel}</Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-4 space-y-4 max-w-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{formTitle}</h2>
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
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" placeholder="First name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" placeholder="Last name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 234 567 8900"
            />
            <p className="text-xs text-muted-foreground">
              Stored as entered; use for direct calling (tel: link).
            </p>
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <select
              name="companyId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              onChange={(e) => setUseNewCompany(e.target.value === "__new__")}
            >
              <option value="">— No company —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">+ New company</option>
            </select>
          </div>
          {useNewCompany && (
            <div className="rounded-md border p-4 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="newCompanyName">Company name</Label>
                <Input
                  id="newCompanyName"
                  name="newCompanyName"
                  placeholder="Company name"
                  required={useNewCompany}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    name="industry"
                    options={industrySelectOptions}
                    placeholder="Select industry"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size (turnover)</Label>
                  <Select
                    name="sizeTurnover"
                    options={sizeTurnoverSelectOptions}
                    placeholder="Select"
                  />
                  {sizeTurnoverSelectOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Define options in Settings → Prospect key metrics.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Size (personnel)</Label>
                  <Select
                    name="sizePersonnel"
                    options={sizePersonnelSelectOptions}
                    placeholder="Select"
                  />
                  {sizePersonnelSelectOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Define options in Settings → Prospect key metrics.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" placeholder="State" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <SearchableCountrySelect
                    id="country"
                    name="country"
                    placeholder="Search or select country"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Lead source</Label>
            <Select
              name="leadSource"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              options={LEAD_SOURCE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              placeholder="Select source"
            />
          </div>
          {showReferralFrom && (
            <div className="space-y-2" id="referralFromSection">
              <Label htmlFor="referralFrom">Referral from (who?)</Label>
              <Input
                id="referralFrom"
                name="referralFrom"
                placeholder="Name or source of referral"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save lead"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
