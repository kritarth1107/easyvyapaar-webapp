import { Suspense } from "react";
import { CreatePaymentPage } from "@/components/dashboard/finance/create-payment-page";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreatePaymentPage />
    </Suspense>
  );
}
