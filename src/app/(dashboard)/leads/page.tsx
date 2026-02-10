import { redirect } from "next/navigation";

// Leads = early-stage contacts (Awareness + Interest). Use Contacts with stage tabs.
export default function LeadsRedirect() {
  redirect("/contacts");
}
