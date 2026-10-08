import { redirect } from "next/navigation";

/** Orphan deferred page - redirect to account settings. */
export default function AppSettingsPage() {
  redirect("/dashboard/settings");
}
