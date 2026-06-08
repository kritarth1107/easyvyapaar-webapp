import { DeferredFeaturePage } from "@/components/dashboard/deferred-feature-page";

export default function GodownsPage() {
  return (
    <DeferredFeaturePage
      titleKey="dashboard.deferred.godownsTitle"
      descriptionKey="dashboard.deferred.godownsDesc"
      backHref="/dashboard/inventory/stock-summary"
    />
  );
}
