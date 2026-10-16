"use client";

import { ModernSelect } from "@/components/ui/modern-select";
import { clampLineDiscount, lineGrossAmount } from "@/lib/sales/invoice-tax";

const inputGroupClass =
  "flex h-9 overflow-hidden rounded-sm border border-slate-200/90 bg-white focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15";
const inputGroupInnerClass =
  "h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm text-brand-primary outline-none tabular-nums placeholder:text-brand-primary-muted/60";

export type LineDiscountType = "percent" | "amount";

export function LineDiscountField({
  discount,
  discountType,
  qty,
  pricePerItem,
  onChange,
  ariaLabel,
}: {
  discount: number;
  discountType: LineDiscountType;
  qty: number;
  pricePerItem: number;
  onChange: (next: { discount: number; discountType: LineDiscountType }) => void;
  ariaLabel: string;
}) {
  const apply = (partial: { discount?: number; discountType?: LineDiscountType }) => {
    const nextType = partial.discountType ?? discountType;
    const nextValue = partial.discount ?? discount;
    onChange({
      discountType: nextType,
      discount: clampLineDiscount(nextValue, nextType, lineGrossAmount(qty, pricePerItem)),
    });
  };

  return (
    <div className={`${inputGroupClass} w-[168px]`}>
      <div className="h-full w-[52px] shrink-0">
        <ModernSelect
          value={discountType}
          onChange={(v) => apply({ discountType: v as LineDiscountType })}
          options={[
            { value: "percent", label: "%" },
            { value: "amount", label: "₹" },
          ]}
          variant="compact"
          compactAttached
          aria-label={ariaLabel}
          className="h-full w-full"
        />
      </div>
      <input
        type="number"
        min={0}
        max={discountType === "percent" ? 100 : undefined}
        step="0.01"
        value={discount}
        onChange={(e) => apply({ discount: Number(e.target.value) || 0 })}
        className={`${inputGroupInnerClass} border-l border-slate-200/90`}
      />
    </div>
  );
}
