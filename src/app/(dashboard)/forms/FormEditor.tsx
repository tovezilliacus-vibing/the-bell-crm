"use client";

import { useState } from "react";
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
          <CardDescription>Name, thank-you message, and redirect after submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveSettings} />
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
          <CardDescription>Add and order fields. Submissions map by field name (e.g. email, name).</CardDescription>
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
            <p className="text-sm text-muted-foreground">No fields yet. Add one above.</p>
          ) : (
            <ul className="space-y-2">
              {form.fields.map((field, index) => (
                <li
                  key={field.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <span className="text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="flex-1 font-medium">{field.label}</span>
                  <span className="text-xs text-muted-foreground">{field.name}</span>
                  <span className="text-xs">{FIELD_TYPE_LABELS[field.type]}</span>
                  {field.required && <span className="text-xs text-muted-foreground">Required</span>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveField(field.id, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveField(field.id, "down")}
                    disabled={index === form.fields.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
