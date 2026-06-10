"use client";

import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

type UnitSelectProps = {
  value: string;
  units: string[];
  onChange: (unit: string) => void;
  onAddUnit: () => void;
};

export function UnitSelect({ value, units, onChange, onAddUnit }: UnitSelectProps) {
  const { t } = useTranslation();

  return (
    <ModernSelect
      value={value}
      onChange={onChange}
      options={units.map((u) => ({ value: u, label: u }))}
      searchable
      searchPlaceholder={t("dashboard.inventory.createItem.searchUnit")}
      emptyMessage={t("dashboard.inventory.createItem.noUnits")}
      footer={({ close }) => (
        <button
          type="button"
          onClick={() => {
            close();
            onAddUnit();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-brand-orange-1/45 bg-brand-surface-warm/60 px-3 py-2.5 text-sm font-semibold text-brand-orange-2 transition-colors hover:border-brand-orange-1/70 hover:bg-brand-surface-warm hover:text-brand-orange-1"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-brand-orange-1/10 text-brand-orange-2">
            +
          </span>
          {t("dashboard.inventory.createItem.addUnitOption")}
        </button>
      )}
    />
  );
}
