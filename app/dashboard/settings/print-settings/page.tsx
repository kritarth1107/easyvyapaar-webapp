import { DeferredFeaturePage } from "@/components/dashboard/deferred-feature-page";

export default function PrintSettingsPage() {
  return (
    <DeferredFeaturePage
      titleKey="dashboard.deferred.printSettingsTitle"
      descriptionKey="dashboard.deferred.printSettingsDesc"
      backHref="/dashboard/settings/business-profile"
    />
  );
}
