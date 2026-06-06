"use client";

import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

export type CategoryOption = {
  categoryId: string;
  name: string;
};

type CategorySelectProps = {
  value: string;
  categories: CategoryOption[];
  onChange: (categoryId: string) => void;
  onAddCategory: () => void;
};

export function CategorySelect({
  value,
  categories,
  onChange,
  onAddCategory,
}: CategorySelectProps) {
  const { t } = useTranslation();

  return (
    <ModernSelect
      value={value}
      onChange={onChange}
      options={categories.map((c) => ({ value: c.categoryId, label: c.name }))}
      placeholder={t("dashboard.inventory.createItem.categoryPlaceholder")}
      searchable
      searchPlaceholder={t("dashboard.inventory.createItem.searchCategories")}
      emptyMessage={t("dashboard.inventory.createItem.noCategories")}
      footer={
        <button
          type="button"
          onClick={onAddCategory}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-brand-orange-1/45 bg-brand-surface-warm/60 px-3 py-2.5 text-sm font-semibold text-brand-orange-2 transition-colors hover:border-brand-orange-1/70 hover:bg-brand-surface-warm hover:text-brand-orange-1"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-brand-orange-1/10 text-brand-orange-2">
            +
          </span>
          {t("dashboard.inventory.createItem.addCategoryOption")}
        </button>
      }
    />
  );
}
