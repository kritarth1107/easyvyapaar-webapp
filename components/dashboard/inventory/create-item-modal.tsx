"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CategorySelect } from "@/components/dashboard/inventory/category-select";
import { CreateCategoryModal } from "@/components/dashboard/inventory/create-category-modal";
import { CreateUnitModal } from "@/components/dashboard/inventory/create-unit-modal";
import { SerialNumbersSection } from "@/components/dashboard/inventory/serial-numbers-section";
import { UnitSelect } from "@/components/dashboard/inventory/unit-select";
import { ModernSelect } from "@/components/ui/modern-select";
import { MOCK_INVENTORY_ITEMS } from "@/lib/dashboard/mock-inventory-items";
import {
  createInitialItemForm,
  createSerialRow,
  generateItemCode,
  getInitialCategoryList,
  getInitialUnitList,
  GST_RATE_OPTIONS,
  normalizeUnitName,
  type CreateItemFormState,
  type CreateItemSection,
} from "@/lib/inventory/create-item-form";
import { useTranslation, type TranslationKey } from "@/lib/localization";

type CreateItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: (saveAndNew: boolean) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FieldLabel({
  children,
  required,
  hint,
  className = "",
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium leading-5 text-brand-primary ${className}`}>
      {children}
      {required && <span className="text-brand-orange-1"> *</span>}
      {hint && (
        <span className="ml-1 text-xs font-normal text-brand-primary-muted" title={hint}>
          ⓘ
        </span>
      )}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const inputErrorClass =
  "h-10 w-full rounded-md border border-red-300 bg-red-50/50 px-3 text-sm text-brand-primary outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200";

const formGridClass = "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start";

/** Aligns a control in the right column with the input row in the left column (below label). */
function AlignedFieldColumn({
  label,
  required,
  hint,
  children,
  footer,
  reserveFooter,
}: {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  reserveFooter?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      {typeof label === "string" ? (
        <FieldLabel required={required} hint={hint}>
          {label}
        </FieldLabel>
      ) : (
        label
      )}
      <div className="mt-1.5">{children}</div>
      {(footer || reserveFooter) && (
        <div className="mt-2 flex min-h-5 items-center">{footer}</div>
      )}
    </div>
  );
}

function InvisibleLabelSpacer({ text }: { text: string }) {
  return (
    <FieldLabel className="invisible select-none" aria-hidden>
      {text}
    </FieldLabel>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
  footer,
  reserveFooter,
  labelSrOnly,
}: {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  reserveFooter?: boolean;
  labelSrOnly?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {typeof label === "string" ? (
        <FieldLabel
          required={required}
          hint={hint}
          className={labelSrOnly ? "sr-only" : ""}
        >
          {label}
        </FieldLabel>
      ) : (
        label
      )}
      <div className="mt-1.5">{children}</div>
      {(footer || reserveFooter) && (
        <div className="mt-2 flex min-h-5 items-center">{footer}</div>
      )}
    </div>
  );
}

export function CreateItemModal({ open, onClose, onSaved }: CreateItemModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<CreateItemSection>("basic");
  const [form, setForm] = useState<CreateItemFormState>(createInitialItemForm);
  const [nameError, setNameError] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(() =>
    getInitialCategoryList(MOCK_INVENTORY_ITEMS.map((i) => i.category))
  );
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [units, setUnits] = useState<string[]>(() => getInitialUnitList());
  const [createUnitOpen, setCreateUnitOpen] = useState(false);

  const patch = useCallback(
    (partial: Partial<CreateItemFormState>) => setForm((prev) => ({ ...prev, ...partial })),
    []
  );

  const resetForm = useCallback(() => {
    setForm(createInitialItemForm());
    setSection("basic");
    setNameError(false);
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSerialisationChange = (enabled: boolean) => {
    if (enabled) {
      patch({
        serialised: true,
        serialNumbers:
          form.serialNumbers.length > 0 ? form.serialNumbers : [createSerialRow()],
      });
      setSection("serial");
      setSerialError(null);
    } else {
      patch({ serialised: false, serialNumbers: [] });
      setSerialError(null);
      if (section === "serial") setSection("basic");
    }
  };

  const validate = () => {
    const nameOk = form.name.trim().length > 0;
    setNameError(!nameOk);
    if (!nameOk) {
      setSection("basic");
      return false;
    }

    if (form.serialised) {
      const serials = form.serialNumbers
        .map((r) => r.serialNumber.trim())
        .filter(Boolean);
      if (serials.length === 0) {
        setSerialError(t("dashboard.inventory.createItem.serialRequired"));
        setSection("serial");
        return false;
      }
      const lower = serials.map((s) => s.toLowerCase());
      if (new Set(lower).size !== lower.length) {
        setSerialError(t("dashboard.inventory.createItem.serialDuplicate"));
        setSection("serial");
        return false;
      }
      setSerialError(null);
    }

    return true;
  };

  const handleSave = (saveAndNew: boolean) => {
    if (!validate()) return;
    onSaved?.(saveAndNew);
    if (saveAndNew) resetForm();
    else onClose();
  };

  const sections = useMemo(() => {
    const list: { id: CreateItemSection; label: string; required?: boolean; group?: string }[] = [
      { id: "basic", label: t("dashboard.inventory.createItem.sections.basic"), required: true },
    ];
    if (form.serialised) {
      list.push({
        id: "serial",
        label: t("dashboard.inventory.createItem.sections.serial"),
        required: true,
      });
    }
    list.push(
      { id: "stock", label: t("dashboard.inventory.createItem.sections.stock"), group: "advance" },
      { id: "pricing", label: t("dashboard.inventory.createItem.sections.pricing"), group: "advance" },
      { id: "party", label: t("dashboard.inventory.createItem.sections.party"), group: "advance" },
      { id: "custom", label: t("dashboard.inventory.createItem.sections.custom"), group: "advance" }
    );
    return list;
  }, [form.serialised, t]);

  const primarySections = useMemo(
    () => sections.filter((s) => !s.group),
    [sections]
  );
  const advanceSections = useMemo(
    () => sections.filter((s) => s.group === "advance"),
    [sections]
  );

  useEffect(() => {
    if (form.serialised && section !== "serial" && !sections.some((s) => s.id === section)) {
      setSection("basic");
    }
    if (!form.serialised && section === "serial") {
      setSection("basic");
    }
  }, [form.serialised, section, sections]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-3 backdrop-blur-[3px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-item-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(760px,90vh)] w-[min(920px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_24px_60px_-16px_rgba(3,31,73,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <h2 id="create-item-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.inventory.createItem.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <nav
            className="hidden w-[252px] shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-brand-surface/35 px-3 py-5 sm:flex"
            aria-label={t("dashboard.inventory.createItem.navLabel")}
          >
            <div className="space-y-1.5">
              {primarySections.map((s) => (
                <NavSectionButton
                  key={s.id}
                  section={s}
                  active={section === s.id}
                  onSelect={() => setSection(s.id)}
                />
              ))}
            </div>

            {advanceSections.length > 0 && (
              <div className="mt-6 border-t border-slate-200/90 pt-5">
                <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-primary-muted">
                  {t("dashboard.inventory.createItem.advanceGroup")}
                </p>
                <div className="space-y-1.5">
                  {advanceSections.map((s) => (
                    <NavSectionButton
                      key={s.id}
                      section={s}
                      active={section === s.id}
                      onSelect={() => setSection(s.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:hidden">
              <ModernSelect
                value={section}
                onChange={(v) => setSection(v as CreateItemSection)}
                options={sections.map((s) => ({
                  value: s.id,
                  label: s.required ? `${s.label} *` : s.label,
                }))}
                aria-label={t("dashboard.inventory.createItem.navLabel")}
              />
            </div>

            <div className="scrollbar-brand min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {section === "basic" && (
                <BasicSection
                  form={form}
                  patch={patch}
                  nameError={nameError}
                  categories={categories}
                  units={units}
                  onAddCategory={() => setCreateCategoryOpen(true)}
                  onAddUnit={() => setCreateUnitOpen(true)}
                  onSerialisationChange={handleSerialisationChange}
                  t={t}
                />
              )}
              {section === "serial" && form.serialised && (
                <SerialNumbersSection
                  form={form}
                  patch={patch}
                  serialError={serialError}
                  units={units}
                  onAddUnit={() => setCreateUnitOpen(true)}
                />
              )}
              {section === "stock" && (
                <StockSection
                  form={form}
                  patch={patch}
                  units={units}
                  onAddUnit={() => setCreateUnitOpen(true)}
                  t={t}
                />
              )}
              {section === "pricing" && <PricingSection form={form} patch={patch} t={t} />}
              {section === "party" && <PartySection form={form} setForm={setForm} t={t} />}
              {section === "custom" && <CustomSection form={form} setForm={setForm} t={t} />}
            </div>
          </div>
        </div>

        <footer className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-brand-surface/30 px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-200/90 bg-white px-5 text-sm font-semibold text-brand-primary transition-colors hover:bg-slate-50"
          >
            {t("dashboard.inventory.createItem.cancel")}
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="h-10 rounded-md border border-slate-200/90 bg-white px-5 text-sm font-semibold text-brand-primary transition-colors hover:border-brand-orange-1/40 hover:bg-brand-surface-warm"
            >
              {t("dashboard.inventory.createItem.saveAndNew")}
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="h-10 rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(246,62,22,0.4)] transition-all hover:brightness-105"
            >
              {t("dashboard.inventory.createItem.saveItem")}
            </button>
          </div>
        </footer>
      </div>

      <CreateCategoryModal
        open={createCategoryOpen}
        onClose={() => setCreateCategoryOpen(false)}
        onAdd={(name) => {
          setCategories((prev) => getInitialCategoryList([...prev, name]));
          patch({ category: name });
        }}
      />
      <CreateUnitModal
        open={createUnitOpen}
        onClose={() => setCreateUnitOpen(false)}
        onAdd={(name) => {
          const unit = normalizeUnitName(name);
          setUnits((prev) => getInitialUnitList([...prev, unit]));
          patch({ unit });
        }}
      />
    </div>,
    document.body
  );
}

function NavSectionButton({
  section,
  active,
  onSelect,
}: {
  section: { id: CreateItemSection; label: string; required?: boolean };
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[15px] font-medium leading-snug transition-colors ${
        active
          ? "bg-white text-brand-primary shadow-[0_1px_8px_-2px_rgba(3,31,73,0.12)] ring-1 ring-slate-200/90"
          : "text-brand-primary-mid hover:bg-white/80 hover:text-brand-primary"
      }`}
    >
      <SectionIcon id={section.id} active={active} />
      <span className="min-w-0 flex-1 leading-snug">
        {section.label}
        {section.required && <span className="text-brand-orange-1"> *</span>}
      </span>
    </button>
  );
}

function SectionIcon({ id, active }: { id: CreateItemSection; active: boolean }) {
  const cls = `h-5 w-5 shrink-0 ${active ? "text-brand-orange-2" : "text-brand-primary-muted"}`;
  if (id === "basic") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
        <path d="M6 4h8v12H6V4zM8 7h4M8 10h4M8 13h2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "serial") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.35" />
        <path d="M10 7v3l2 1.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "stock") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
        <path d="M4 7l6-3 6 3v8l-6 3-6-3V7z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "pricing") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
        <path d="M6 6h8v8H6V6zM8 9h4M8 12h2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "party") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
        <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.35" />
        <path d="M5 16c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cls} aria-hidden>
      <path d="M5 6h10M5 10h10M5 14h6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function SwitchOnly({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand-orange-1" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <SwitchOnly checked={checked} onChange={onChange} ariaLabel={label} />
      <span className="text-sm font-medium text-brand-primary">{label}</span>
    </div>
  );
}

function GstRateSelect({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <FormField label={t("dashboard.inventory.createItem.gstRate")}>
      <ModernSelect
        value={value}
        onChange={onChange}
        options={GST_RATE_OPTIONS.map((rate) => ({
          value: rate,
          label:
            rate === "none"
              ? t("dashboard.inventory.createItem.gstNone")
              : `${rate}%`,
        }))}
        placeholder={t("dashboard.inventory.createItem.gstNone")}
      />
    </FormField>
  );
}

function PriceWithTax({
  label,
  value,
  taxMode,
  onValue,
  onTaxMode,
  t,
}: {
  label: string;
  value: string;
  taxMode: "with_tax" | "without_tax";
  onValue: (v: string) => void;
  onTaxMode: (v: "with_tax" | "without_tax") => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1.5 flex overflow-visible rounded-md border border-slate-200/90 focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15">
        <span className="flex h-10 items-center rounded-l-md bg-slate-50 px-3 text-sm font-medium text-brand-primary-muted">
          ₹
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={t("dashboard.inventory.createItem.pricePlaceholder")}
          className="h-10 min-w-0 flex-1 border-0 bg-white px-2 text-sm text-brand-primary outline-none"
        />
        <ModernSelect
          value={taxMode}
          onChange={(v) => onTaxMode(v as "with_tax" | "without_tax")}
          variant="compact"
          alignMenu="end"
          options={[
            { value: "with_tax", label: t("dashboard.inventory.createItem.withTax") },
            { value: "without_tax", label: t("dashboard.inventory.createItem.withoutTax") },
          ]}
        />
      </div>
    </div>
  );
}

function BasicSection({
  form,
  patch,
  nameError,
  categories,
  units,
  onAddCategory,
  onAddUnit,
  onSerialisationChange,
  t,
}: {
  form: CreateItemFormState;
  patch: (p: Partial<CreateItemFormState>) => void;
  nameError: boolean;
  categories: string[];
  units: string[];
  onAddCategory: () => void;
  onAddUnit: () => void;
  onSerialisationChange: (enabled: boolean) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="space-y-5">
      <div className={formGridClass}>
        <AlignedFieldColumn label={t("dashboard.inventory.createItem.itemType")} required>
          <div className="flex h-10 items-center gap-5">
            {(["product", "service"] as const).map((type) => (
              <label key={type} className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="itemType"
                  checked={form.itemType === type}
                  onChange={() => patch({ itemType: type })}
                  className="h-4 w-4 border-slate-300 text-brand-orange-1 focus:ring-brand-orange-1/30"
                />
                <span className="text-sm font-medium text-brand-primary">
                  {type === "product"
                    ? t("dashboard.inventory.createItem.product")
                    : t("dashboard.inventory.createItem.service")}
                </span>
              </label>
            ))}
          </div>
        </AlignedFieldColumn>
        <AlignedFieldColumn label={t("dashboard.inventory.createItem.category")}>
          <CategorySelect
            value={form.category}
            categories={categories}
            onChange={(category) => patch({ category })}
            onAddCategory={onAddCategory}
          />
        </AlignedFieldColumn>
      </div>

      <div className={formGridClass}>
        <AlignedFieldColumn
          label={t("dashboard.inventory.createItem.itemName")}
          required
          footer={
            nameError ? (
              <p className="text-xs font-medium text-red-600">
                {t("dashboard.inventory.createItem.nameRequired")}
              </p>
            ) : undefined
          }
          reserveFooter={nameError}
        >
          <input
            type="text"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder={t("dashboard.inventory.createItem.namePlaceholder")}
            className={nameError ? inputErrorClass : inputClass}
          />
        </AlignedFieldColumn>

        <AlignedFieldColumn label={<InvisibleLabelSpacer text={t("dashboard.inventory.createItem.itemName")} />}>
          <div className="flex h-10 items-center">
            <Toggle
              checked={form.showInOnlineStore}
              onChange={(v) => patch({ showInOnlineStore: v })}
              label={t("dashboard.inventory.createItem.onlineStore")}
            />
          </div>
        </AlignedFieldColumn>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PriceWithTax
          label={t("dashboard.inventory.createItem.salesPrice")}
          value={form.salesPrice}
          taxMode={form.salesTaxMode}
          onValue={(v) => patch({ salesPrice: v })}
          onTaxMode={(v) => patch({ salesTaxMode: v })}
          t={t}
        />
        <GstRateSelect value={form.gstRate} onChange={(gstRate) => patch({ gstRate })} t={t} />
      </div>

      <div className={formGridClass}>
        <AlignedFieldColumn label={t("dashboard.inventory.createItem.openingStock")}>
          <div className="flex h-10 overflow-hidden rounded-md border border-slate-200/90 focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15">
            <input
              type="text"
              inputMode="decimal"
              value={form.openingStock}
              onChange={(e) => patch({ openingStock: e.target.value })}
              placeholder={t("dashboard.inventory.createItem.stockPlaceholder")}
              className="min-w-0 flex-1 border-0 bg-white px-3 text-sm text-brand-primary outline-none"
            />
            <span className="flex h-10 items-center border-l border-slate-200/90 bg-slate-50 px-3 text-xs font-semibold text-brand-primary-muted">
              {form.unit}
            </span>
          </div>
        </AlignedFieldColumn>
        <AlignedFieldColumn label={t("dashboard.inventory.createItem.measuringUnit")}>
          <UnitSelect
            value={form.unit}
            units={units}
            onChange={(unit) => patch({ unit })}
            onAddUnit={onAddUnit}
          />
        </AlignedFieldColumn>
      </div>

      <div className="rounded-md border border-slate-200/80 bg-brand-surface/50 px-4 py-3.5">
        <Toggle
          checked={form.serialised}
          onChange={onSerialisationChange}
          label={t("dashboard.inventory.createItem.serialisation")}
        />
        <p className="mt-2 text-xs text-brand-primary-muted">
          {t("dashboard.inventory.createItem.serialisationHint")}
        </p>
      </div>
    </div>
  );
}

function StockSection({
  form,
  patch,
  units,
  onAddUnit,
  t,
}: {
  form: CreateItemFormState;
  patch: (p: Partial<CreateItemFormState>) => void;
  units: string[];
  onAddUnit: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>{t("dashboard.inventory.createItem.itemCode")}</FieldLabel>
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={form.itemCode}
              onChange={(e) => patch({ itemCode: e.target.value })}
              placeholder={t("dashboard.inventory.createItem.codePlaceholder")}
              className={`${inputClass} mt-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => patch({ itemCode: generateItemCode() })}
              className="shrink-0 rounded-md border border-brand-orange-1/30 bg-brand-surface-warm px-3 text-xs font-semibold text-brand-orange-2 transition-colors hover:border-brand-orange-1/60 hover:text-brand-orange-1"
            >
              {t("dashboard.inventory.createItem.generateBarcode")}
            </button>
          </div>
        </div>
        <div>
          <FieldLabel>{t("dashboard.inventory.createItem.hsnCode")}</FieldLabel>
          <input
            type="text"
            value={form.hsn}
            onChange={(e) => patch({ hsn: e.target.value })}
            placeholder={t("dashboard.inventory.createItem.hsnPlaceholder")}
            className={inputClass}
          />
          <button type="button" className="mt-1.5 text-xs font-semibold text-brand-orange-2 hover:underline">
            {t("dashboard.inventory.createItem.findHsn")}
          </button>
        </div>
      </div>

      <div className={formGridClass}>
        <FormField label={t("dashboard.inventory.createItem.openingStock")} reserveFooter>
          <div className="flex h-10 overflow-hidden rounded-md border border-slate-200/90 focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15">
            <input
              type="text"
              inputMode="decimal"
              value={form.openingStock}
              onChange={(e) => patch({ openingStock: e.target.value })}
              placeholder={t("dashboard.inventory.createItem.stockPlaceholder")}
              className="min-w-0 flex-1 border-0 bg-white px-3 text-sm text-brand-primary outline-none"
            />
            <span className="flex h-10 items-center border-l border-slate-200/90 bg-slate-50 px-3 text-xs font-semibold text-brand-primary-muted">
              {form.unit}
            </span>
          </div>
        </FormField>
        <FormField
          label={t("dashboard.inventory.createItem.measuringUnit")}
          reserveFooter
          footer={
            <button
              type="button"
              className="text-xs font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline"
            >
              + {t("dashboard.inventory.createItem.alternativeUnit")}
            </button>
          }
        >
          <UnitSelect
            value={form.unit}
            units={units}
            onChange={(unit) => patch({ unit })}
            onAddUnit={onAddUnit}
          />
        </FormField>
      </div>

      <div className={formGridClass}>
        <AlignedFieldColumn label={t("dashboard.inventory.createItem.asOfDate")}>
          <input
            type="date"
            value={form.asOfDate}
            onChange={(e) => patch({ asOfDate: e.target.value })}
            className={inputClass}
          />
        </AlignedFieldColumn>

        {form.lowStockWarning ? (
          <AlignedFieldColumn label={t("dashboard.inventory.createItem.lowStockWarning")}>
            <div className="space-y-2">
              <div className="flex h-10 items-center">
                <SwitchOnly
                  checked={form.lowStockWarning}
                  onChange={(v) => patch({ lowStockWarning: v })}
                  ariaLabel={t("dashboard.inventory.createItem.lowStockWarning")}
                />
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={form.lowStockQty}
                onChange={(e) => patch({ lowStockQty: e.target.value })}
                placeholder={t("dashboard.inventory.createItem.lowStockPlaceholder")}
                className={inputClass}
              />
            </div>
          </AlignedFieldColumn>
        ) : (
          <AlignedFieldColumn
            label={<InvisibleLabelSpacer text={t("dashboard.inventory.createItem.asOfDate")} />}
          >
            <button
              type="button"
              onClick={() => patch({ lowStockWarning: true })}
              className="flex h-10 w-full items-center rounded-md border border-dashed border-brand-orange-1/35 bg-brand-surface-warm/50 px-3 text-left text-xs font-semibold text-brand-orange-2 transition-colors hover:border-brand-orange-1/55 hover:bg-brand-surface-warm hover:text-brand-orange-1"
            >
              + {t("dashboard.inventory.createItem.enableLowStock")}
            </button>
          </AlignedFieldColumn>
        )}
      </div>

      <FormField label={t("dashboard.inventory.createItem.description")}>
        <textarea
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={4}
          placeholder={t("dashboard.inventory.createItem.descriptionPlaceholder")}
          className={`${inputClass} min-h-[100px] resize-y py-2.5`}
        />
      </FormField>

      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white text-brand-primary-muted ring-1 ring-slate-200/80">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path
                  d="M12 16V8m0 0l-3 3m3-3l3 3M5 20h14a1 1 0 001-1V6l-5-4H5a1 1 0 00-1 1v17z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="text-xs leading-relaxed text-brand-primary-muted">
              {t("dashboard.inventory.createItem.uploadHint")}
            </p>
          </div>
          <label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary transition-colors hover:bg-slate-50">
            {t("dashboard.inventory.createItem.selectFile")}
            <input type="file" className="sr-only" accept="image/png,image/jpeg" multiple />
          </label>
        </div>
      </div>
    </div>
  );
}

function PricingSection({
  form,
  patch,
  t,
}: {
  form: CreateItemFormState;
  patch: (p: Partial<CreateItemFormState>) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <PriceWithTax
          label={t("dashboard.inventory.createItem.salesPrice")}
          value={form.salesPrice}
          taxMode={form.salesTaxMode}
          onValue={(v) => patch({ salesPrice: v })}
          onTaxMode={(v) => patch({ salesTaxMode: v })}
          t={t}
        />
        <PriceWithTax
          label={t("dashboard.inventory.createItem.purchasePrice")}
          value={form.purchasePrice}
          taxMode={form.purchaseTaxMode}
          onValue={(v) => patch({ purchasePrice: v })}
          onTaxMode={(v) => patch({ purchaseTaxMode: v })}
          t={t}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <GstRateSelect value={form.gstRate} onChange={(gstRate) => patch({ gstRate })} t={t} />
        <div>
          <FieldLabel hint={t("dashboard.inventory.createItem.discountHint")}>
            {t("dashboard.inventory.createItem.salesDiscount")}
          </FieldLabel>
          <div className="mt-1.5 flex overflow-hidden rounded-md border border-slate-200/90 focus-within:ring-2 focus-within:ring-brand-orange-1/15">
            <input
              type="text"
              inputMode="decimal"
              value={form.salesDiscountPercent}
              onChange={(e) => patch({ salesDiscountPercent: e.target.value })}
              placeholder={t("dashboard.inventory.createItem.discountPlaceholder")}
              className="h-10 min-w-0 flex-1 border-0 px-3 text-sm outline-none"
            />
            <span className="flex items-center border-l border-slate-200/90 bg-slate-50 px-3 text-sm font-semibold text-brand-primary-muted">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartySection({
  form,
  setForm,
  t,
}: {
  form: CreateItemFormState;
  setForm: React.Dispatch<React.SetStateAction<CreateItemFormState>>;
  t: (key: TranslationKey) => string;
}) {
  const updateRow = (id: string, field: "partyName" | "price", value: string) => {
    setForm((prev) => ({
      ...prev,
      partyPrices: prev.partyPrices.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      partyPrices: [
        ...prev.partyPrices,
        { id: String(Date.now()), partyName: "", price: "" },
      ],
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-primary-muted">{t("dashboard.inventory.createItem.partyHint")}</p>
      <div className="space-y-3">
        {form.partyPrices.map((row) => (
          <div key={row.id} className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={row.partyName}
              onChange={(e) => updateRow(row.id, "partyName", e.target.value)}
              placeholder={t("dashboard.inventory.createItem.partyNamePlaceholder")}
              className={inputClass}
            />
            <div className="flex overflow-hidden rounded-md border border-slate-200/90">
              <span className="flex items-center bg-slate-50 px-3 text-sm text-brand-primary-muted">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={row.price}
                onChange={(e) => updateRow(row.id, "price", e.target.value)}
                placeholder={t("dashboard.inventory.createItem.pricePlaceholder")}
                className="h-10 min-w-0 flex-1 border-0 px-2 text-sm outline-none"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline"
      >
        + {t("dashboard.inventory.createItem.addPartyPrice")}
      </button>
    </div>
  );
}

function CustomSection({
  form,
  setForm,
  t,
}: {
  form: CreateItemFormState;
  setForm: React.Dispatch<React.SetStateAction<CreateItemFormState>>;
  t: (key: TranslationKey) => string;
}) {
  const updateRow = (id: string, field: "label" | "value", val: string) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((r) =>
        r.id === id ? { ...r, [field]: val } : r
      ),
    }));
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { id: String(Date.now()), label: "", value: "" }],
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-primary-muted">{t("dashboard.inventory.createItem.customHint")}</p>
      {form.customFields.map((row) => (
        <div key={row.id} className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={row.label}
            onChange={(e) => updateRow(row.id, "label", e.target.value)}
            placeholder={t("dashboard.inventory.createItem.customLabelPlaceholder")}
            className={inputClass}
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => updateRow(row.id, "value", e.target.value)}
            placeholder={t("dashboard.inventory.createItem.customValuePlaceholder")}
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-semibold text-brand-orange-2 hover:underline"
      >
        + {t("dashboard.inventory.createItem.addCustomField")}
      </button>
    </div>
  );
}
