import { Suspense } from "react";
import { PayrollGeneratePage } from "@/components/dashboard/staff/payroll-generate-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-primary-muted">Loading…</div>}>
      <PayrollGeneratePage />
    </Suspense>
  );
}
