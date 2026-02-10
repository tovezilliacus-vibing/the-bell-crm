import { redirect } from "next/navigation";

// Customers = contacts in Action stage. Use Contacts filtered by Action.
export default function CustomersRedirect() {
  redirect("/contacts?stage=ACTION");
}
