"use client";

import type { ApiFieldError } from "@/lib/api/field-errors";
import type { TranslationKey } from "@/lib/localization";

export function FieldErrorText({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages.join(" · ")}</p>;
}

const FIELD_LABEL_KEYS: Array<[RegExp, TranslationKey]> = [
  [/^partyId/, "dashboard.purchaseFieldErrors.supplier"],
  [/^(paidAmount|amountPaid|fullyPaid|paymentMode)/, "dashboard.purchaseFieldErrors.payment"],
  [/^tds/, "dashboard.purchaseFieldErrors.tds"],
  [/^additionalCharges/, "dashboard.purchaseFieldErrors.charges"],
  [/^(discount|roundOff|autoRoundOff)/, "dashboard.purchaseFieldErrors.discount"],
  [/^notes/, "dashboard.purchaseFieldErrors.notes"],
];

export function purchaseFieldLabel(path: string, t: (key: TranslationKey) => string): string {
  const hit = FIELD_LABEL_KEYS.find(([pattern]) => pattern.test(path));
  return hit ? t(hit[1]) : path;
}

/** Field errors that have no inline slot on the form. */
export function OtherFieldErrors({
  errors,
  label,
}: {
  errors: ApiFieldError[];
  label: (path: string) => string;
}) {
  if (!errors.length) return null;
  return (
    <ul className="mt-1 list-disc pl-5 text-xs text-red-600">
      {errors.map((issue) => (
        <li key={`${issue.path}:${issue.message}`}>
          <span className="font-semibold">{label(issue.path)}:</span> {issue.message}
        </li>
      ))}
    </ul>
  );
}
