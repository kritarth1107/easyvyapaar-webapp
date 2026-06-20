import { DashboardPlanCheckoutPage } from "@/components/dashboard/settings/plan-checkout-page";
import { loadPublicPricing } from "@/lib/api/pricing";

export default async function DashboardPlanCheckoutRoute() {
  const pricing = await loadPublicPricing();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardPlanCheckoutPage pricing={pricing} />
    </div>
  );
}
