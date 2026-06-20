import { PlanPaymentCheckout } from "@/components/auth/plan-payment-checkout";
import { RegisterSidebar } from "@/components/register";
import { loadPublicPricing } from "@/lib/api/pricing";

export default async function PaymentPage() {
  const pricing = await loadPublicPricing();

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden font-sans">
      <RegisterSidebar />
      <PlanPaymentCheckout pricing={pricing} />
    </div>
  );
}
