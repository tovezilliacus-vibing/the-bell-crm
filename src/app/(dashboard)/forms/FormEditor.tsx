"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateForm, createFormField, updateFormField, deleteFormField, reorderFormFields } from "./actions";
import type { FormFieldType } from "@prisma/client";
import type { Form, FormField } from "@prisma/client";
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Text",
  email: "Email",
  textarea: "Textarea",
  select: "Select",
  checkbox: "Checkbox",
  hidden: "Hidden",
};

function FieldRow({
  field,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateLabel,
  onUpdateName,
}: {
  field: FormField;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdateLabel: (label: string) => Promise<unknown>;
  onUpdateName: (name: string) => Promise<unknown>;
}) {
  const [label, setLabel] = useState(field.label);
  const [name, setName] = useState(field.name);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLabel(field.label);
    setName(field.name);
  }, [field.id, field.label, field.name]);

  const handleLabelBlur = () => {
    const trimmed = label.trim() || field.label;
    if (trimmed === field.label) return;
    setPending(true);
    onUpdateLabel(trimmed).finally(() => setPending(false));
  };

  const handleNameBlur = () => {
    const normalized = name.trim().replace(/\s+/g, "_") || field.name;
    if (normalized === field.name) return;
    setPending(true);
    onUpdateName(name).finally(() => setPending(false));
  };

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </span>
      <Input
        className="h-8 max-w-[180px] font-medium"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={handleLabelBlur}
        placeholder="Label"
        title="Label (what visitors see)"
      />
      <span className="text-muted-foreground text-xs">→</span>
      <Input
        className="h-8 max-w-[120px] text-xs font-mono"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        placeholder="name"
        title="Field name (for mapping)"
      />
      <span className="text-xs text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
      {field.required && <span className="text-xs text-muted-foreground">Required</span>}
      {pending && <span className="text-xs text-muted-foreground">Saving…</span>}
      <div className="flex items-center gap-0">
        <Button type="button" variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onMoveDown} disabled={index === total - 1}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </li>
  );
}

export function FormEditor({
  form,
}: {
  form: Form & { fields: FormField[] };
}) {
  const router = useRouter();
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? "");
  const [thankYouMessage, setThankYouMessage] = useState(form.thankYouMessage ?? "");
  const [redirectUrl, setRedirectUrl] = useState(form.redirectUrl ?? "");
  const [pending, setPending] = useState(false);

  async function saveSettings() {
    setPending(true);
    await updateForm(form.id, {
      name,
      description: description || null,
      thankYouMessage: thankYouMessage || null,
      redirectUrl: redirectUrl || null,
    });
    setPending(false);
    router.refresh();
  }

  async function addField(type: FormFieldType) {
    const label = type === "email" ? "Email" : type === "hidden" ? "Hidden" : "New field";
    const name = type === "email" ? "email" : type === "hidden" ? "hidden" : `field_${form.fields.length}`;
    await createFormField(form.id, { label, name, type, required: type === "email" });
    router.refresh();
  }

  async function moveField(fieldId: string, direction: "up" | "down") {
    const ids = form.fields.map((f) => f.id);
    const i = ids.indexOf(fieldId);
    if (i < 0) return;
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await reorderFormFields(form.id, ids);
    router.refresh();
  }

  async function removeField(fieldId: string) {
    if (confirm("Remove this field?")) {
      await deleteFormField(fieldId);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Name, thank-you message, and redirect after submit. Changes save when you leave a field.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Form name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveSettings} placeholder="e.g. Contact us" />
          </div>
          <div className="grid gap-2">
            <Label>Description (internal)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveSettings} />
          </div>
          <div className="grid gap-2">
            <Label>Thank-you message (shown if no redirect)</Label>
            <Input
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              onBlur={saveSettings}
              placeholder="Thanks for reaching out!"
            />
          </div>
          <div className="grid gap-2">
            <Label>Redirect URL (optional)</Label>
            <Input
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              onBlur={saveSettings}
              placeholder="https://..."
            />
          </div>
          {pending && <p className="text-sm text-muted-foreground">Saving…</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
          <CardDescription>Add fields with the buttons below. Click a field&apos;s label or name to edit. Use names like <code className="bg-muted px-1 rounded text-xs">email</code> or <code className="bg-muted px-1 rounded text-xs">name</code> so submissions map to contacts.</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {(["text", "email", "textarea", "checkbox", "hidden"] as FormFieldType[]).map((type) => (
              <Button key={type} variant="outline" size="sm" onClick={() => addField(type)}>
                + {FIELD_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {form.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields yet. Click a button above to add one (e.g. + Text or + Email).</p>
          ) : (
            <ul className="space-y-2">
              {form.fields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  index={index}
                  total={form.fields.length}
                  onMoveUp={() => moveField(field.id, "up")}
                  onMoveDown={() => moveField(field.id, "down")}
                  onRemove={() => removeField(field.id)}
                  onUpdateLabel={(label) => updateFormField(field.id, { label }).then(() => router.refresh())}
                  onUpdateName={(name) => updateFormField(field.id, { name: name.trim().replace(/\s+/g, "_") || field.name }).then(() => router.refresh())}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
