import { DeferredFeaturePage } from "@/components/dashboard/deferred-feature-page";

export default function AppSettingsPage() {
  return (
    <DeferredFeaturePage
      titleKey="dashboard.deferred.settingsTitle"
      descriptionKey="dashboard.deferred.settingsDesc"
      backHref="/dashboard/settings/business-profile"
    />
  );
}
