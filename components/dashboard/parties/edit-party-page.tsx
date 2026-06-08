"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ModernSelect } from "@/components/ui/modern-select";
import { PartyBankAccountsSection } from "@/components/dashboard/parties/party-bank-accounts-section";
import { useUserMe } from "@/components/providers/user-me-provider";
import type { PartyType } from "@/lib/types/parties-api";
import { getBankSelectOptions } from "@/lib/parties/bank-catalog";
import {
  createPartyCustomFieldRow,
  CUSTOM_FIELD_TYPE_LABEL_KEYS,
  getPartyCustomFieldInputType,
  isPartyCustomFieldDateType,
  PARTY_CUSTOM_FIELD_TYPES,
  type PartyCustomFieldRow,
  type PartyCustomFieldTypeId,
} from "@/lib/parties/party-custom-field-types";
import {
  extractPanFromGstin,
  type EditPartyFormState,
  type PartyStatus,
} from "@/lib/parties/create-party-form";
import { mapPartyDetailToForm } from "@/lib/parties/map-party-detail-to-form";
import { mapUpdatePartyFormToRequest } from "@/lib/parties/map-update-party-request";
import { getPartyCategoryOptions } from "@/lib/parties/party-categories";
import { formatPartyInr } from "@/lib/parties/party-detail-utils";
import { fetchPartyDetail, updateParty } from "@/lib/parties/parties-api-client";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

const textareaClass =
  "w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

const readOnlyClass =
  "flex h-10 w-full items-center rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary-muted";

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-slate-200/90 bg-white p-4 lg:p-5 ${className}`}>
      <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-brand-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-brand-primary">
      {children}
      {required && <span className="text-brand-orange-1"> *</span>}
    </label>
  );
}

export function EditPartyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ partyId: string }>();
  const partyId = params.partyId?.trim() ?? "";
  const { activeOrganisationId } = useUserMe();

  const [form, setForm] = useState<EditPartyFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(() => getPartyCategoryOptions(), []);
  const bankOptions = useMemo(() => getBankSelectOptions(), []);

  const partyTypeOptions = useMemo(
    () => [
      { value: "customer", label: t("dashboard.partiesPage.typeCustomer") },
      { value: "supplier", label: t("dashboard.partiesPage.typeSupplier") },
      { value: "both", label: t("dashboard.partiesPage.typeBoth") },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: t("dashboard.editParty.statusActive") },
      { value: "INACTIVE", label: t("dashboard.editParty.statusInactive") },
    ],
    [t],
  );

  useEffect(() => {
    const organisationId = activeOrganisationId?.trim();
    if (!organisationId || !partyId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchPartyDetail(organisationId, partyId)
      .then((party) => {
        if (!cancelled) {
          setForm(mapPartyDetailToForm(party));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t("dashboard.editParty.loadError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, partyId, t]);

  const patch = (updates: Partial<EditPartyFormState>) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (updates.sameAsBilling === true || (updates.billingAddress !== undefined && next.sameAsBilling)) {
        next.shippingAddress = updates.billingAddress ?? next.billingAddress;
      }
      return next;
    });
  };

  const validate = (): boolean => {
    if (!form) return false;
    const next: Record<string, string> = {};
    if (!form.partyType) next.partyType = t("dashboard.createParty.validationType");
    if (!form.partyCategory.trim()) next.partyCategory = t("dashboard.createParty.validationCategory");
    if (!form.name.trim()) next.name = t("dashboard.createParty.validationName");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!form || !validate()) return;
    const organisationId = activeOrganisationId?.trim();
    if (!organisationId) {
      window.alert(t("dashboard.editParty.noOrganisation"));
      return;
    }

    setSaving(true);
    try {
      await updateParty(organisationId, partyId, mapUpdatePartyFormToRequest(form, t));
      router.push(`/dashboard/parties/${encodeURIComponent(partyId)}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("dashboard.editParty.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = () => {
    if (!form) return;
    patch({ customFields: [...form.customFields, createPartyCustomFieldRow()] });
  };

  const updateCustomField = (id: string, updates: Partial<PartyCustomFieldRow>) => {
    if (!form) return;
    patch({
      customFields: form.customFields.map((row) => (row.id === id ? { ...row, ...updates } : row)),
    });
  };

  const removeCustomField = (id: string) => {
    if (!form) return;
    patch({ customFields: form.customFields.filter((row) => row.id !== id) });
  };

  const getCustomFieldOptions = (currentRowId: string) => {
    if (!form) return [];
    const usedTypes = new Set(
      form.customFields
        .filter((row) => row.id !== currentRowId && row.fieldType && row.fieldType !== "other")
        .map((row) => row.fieldType),
    );

    return PARTY_CUSTOM_FIELD_TYPES.filter(
      (type) => type.id === "other" || !usedTypes.has(type.id),
    ).map((type) => ({
      value: type.id,
      label: t(CUSTOM_FIELD_TYPE_LABEL_KEYS[type.id]),
    }));
  };

  const openingBalanceLabel = form
    ? `${formatPartyInr(Number(form.openingBalance) || 0)} (${
        form.openingBalanceType === "to_collect"
          ? t("dashboard.createParty.toCollect")
          : t("dashboard.createParty.toPay")
      })`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-brand-primary-muted">
        {t("dashboard.editParty.loading")}
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{loadError ?? t("dashboard.editParty.loadError")}</p>
        <Link
          href="/dashboard/parties/all-parties"
          className="mt-4 inline-flex text-sm font-semibold text-brand-orange-2 hover:underline"
        >
          {t("dashboard.createParty.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/parties/${encodeURIComponent(partyId)}`}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200/90 bg-white text-brand-primary hover:bg-slate-50"
            aria-label={t("dashboard.editParty.back")}
          >
            <BackIcon />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.editParty.title")}
          </h1>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] hover:brightness-110 disabled:opacity-60"
        >
          {saving ? t("dashboard.editParty.saving") : t("dashboard.editParty.save")}
        </button>
      </div>

      <div className="mx-auto max-w-5xl space-y-4">
        <SectionCard title={t("dashboard.createParty.sections.classification")} className="border-brand-primary/15 bg-brand-primary/[0.02]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel required>{t("dashboard.createParty.partyType")}</FieldLabel>
              <ModernSelect
                value={form.partyType}
                onChange={(value) => patch({ partyType: value as PartyType })}
                options={partyTypeOptions}
                placeholder={t("dashboard.createParty.selectType")}
              />
              {errors.partyType && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.partyType}</p>
              )}
            </div>
            <div>
              <FieldLabel required>{t("dashboard.createParty.partyCategory")}</FieldLabel>
              <ModernSelect
                value={form.partyCategory}
                onChange={(value) => patch({ partyCategory: value })}
                options={categoryOptions}
                searchable
                searchPlaceholder={t("dashboard.createParty.searchCategories")}
                placeholder={t("dashboard.createParty.selectCategory")}
              />
              {errors.partyCategory && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.partyCategory}</p>
              )}
            </div>
            <div>
              <FieldLabel>{t("dashboard.editParty.status")}</FieldLabel>
              <ModernSelect
                value={form.status}
                onChange={(value) => patch({ status: value as PartyStatus })}
                options={statusOptions}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.createParty.sections.general")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <FieldLabel required>{t("dashboard.createParty.partyName")}</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={t("dashboard.createParty.partyNamePlaceholder")}
                className={errors.name ? `${inputClass} border-red-300` : inputClass}
              />
              {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.mobile")}</FieldLabel>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="9876543210"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.email")}</FieldLabel>
              <input
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="party@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.openingBalance")}</FieldLabel>
              <div className={readOnlyClass} title={t("dashboard.editParty.openingBalanceReadOnly")}>
                {openingBalanceLabel}
              </div>
              <p className="mt-1 text-[11px] text-brand-primary-muted">
                {t("dashboard.editParty.openingBalanceReadOnly")}
              </p>
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.gstin")}</FieldLabel>
              <input
                value={form.gstin}
                onChange={(e) => {
                  const gstin = e.target.value.toUpperCase();
                  const pan = extractPanFromGstin(gstin);
                  patch({
                    gstin,
                    ...(pan ? { pan } : {}),
                  });
                }}
                placeholder="22AAAAA0000A1Z5"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.pan")}</FieldLabel>
              <input
                value={form.pan}
                onChange={(e) => patch({ pan: e.target.value.toUpperCase() })}
                placeholder="AAAAA0000A"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.createParty.sections.address")}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.createParty.billingAddress")}</FieldLabel>
              <textarea
                value={form.billingAddress}
                onChange={(e) =>
                  patch({
                    billingAddress: e.target.value,
                    ...(form.sameAsBilling && { shippingAddress: e.target.value }),
                  })
                }
                rows={4}
                placeholder={t("dashboard.createParty.billingPlaceholder")}
                className={textareaClass}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <FieldLabel>{t("dashboard.createParty.shippingAddress")}</FieldLabel>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-brand-primary">
                  <input
                    type="checkbox"
                    checked={form.sameAsBilling}
                    onChange={(e) =>
                      patch({
                        sameAsBilling: e.target.checked,
                        shippingAddress: e.target.checked ? form.billingAddress : form.shippingAddress,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/30"
                  />
                  {t("dashboard.createParty.sameAsBilling")}
                </label>
              </div>
              <textarea
                value={form.shippingAddress}
                onChange={(e) => patch({ shippingAddress: e.target.value, sameAsBilling: false })}
                disabled={form.sameAsBilling}
                rows={4}
                placeholder={t("dashboard.createParty.shippingPlaceholder")}
                className={`${textareaClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-brand-primary-muted`}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.createParty.creditPeriod")}</FieldLabel>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  value={form.creditPeriodDays}
                  onChange={(e) => patch({ creditPeriodDays: e.target.value })}
                  className={`${inputClass} rounded-r-none`}
                />
                <span className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-slate-200/90 bg-slate-50 px-3 text-sm text-brand-primary-muted">
                  {t("dashboard.createParty.days")}
                </span>
              </div>
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.creditLimit")}</FieldLabel>
              <div className="flex">
                <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-slate-200/90 bg-slate-50 px-2.5 text-sm text-brand-primary-muted">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.creditLimit}
                  onChange={(e) => patch({ creditLimit: e.target.value })}
                  className={`${inputClass} rounded-l-none`}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.createParty.sections.contact")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.createParty.contactPerson")}</FieldLabel>
              <input
                value={form.contactPersonName}
                onChange={(e) => patch({ contactPersonName: e.target.value })}
                placeholder={t("dashboard.createParty.contactPlaceholder")}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.createParty.dob")}</FieldLabel>
              <input
                type="date"
                value={form.contactPersonDob}
                onChange={(e) => patch({ contactPersonDob: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.createParty.sections.bank")}>
          <PartyBankAccountsSection
            accounts={form.bankAccounts}
            onAccountsChange={(bankAccounts) => patch({ bankAccounts })}
            bankOptions={bankOptions}
            collapsible
          />
        </SectionCard>

        <SectionCard title={t("dashboard.createParty.sections.custom")}>
          <p className="mb-4 text-sm text-brand-primary-muted">{t("dashboard.createParty.customHint")}</p>
          {form.customFields.length === 0 ? (
            <button
              type="button"
              onClick={addCustomField}
              className="text-sm font-semibold text-brand-orange-2 hover:underline"
            >
              + {t("dashboard.createParty.addCustomField")}
            </button>
          ) : (
            <div className="space-y-4">
              {form.customFields.map((row) => {
                const isOther = row.fieldType === "other";
                const isDate = isPartyCustomFieldDateType(row.fieldType);
                const valueInputType = getPartyCustomFieldInputType(row.fieldType);

                return (
                  <div
                    key={row.id}
                    className="rounded-md border border-slate-200/90 bg-brand-surface/20 p-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel>{t("dashboard.createParty.fieldLabel")}</FieldLabel>
                        <ModernSelect
                          value={row.fieldType}
                          onChange={(value) =>
                            updateCustomField(row.id, {
                              fieldType: value as PartyCustomFieldTypeId,
                              value: isPartyCustomFieldDateType(value as PartyCustomFieldTypeId)
                                ? ""
                                : row.value,
                              ...(value !== "other" ? { customLabel: "" } : {}),
                            })
                          }
                          options={getCustomFieldOptions(row.id)}
                          placeholder={t("dashboard.createParty.selectField")}
                        />
                        {isOther && (
                          <input
                            type="text"
                            value={row.customLabel}
                            onChange={(e) => updateCustomField(row.id, { customLabel: e.target.value })}
                            placeholder={t("dashboard.createParty.customFieldNamePlaceholder")}
                            className={`${inputClass} mt-2`}
                          />
                        )}
                      </div>
                      <div>
                        <FieldLabel>{t("dashboard.createParty.valueLabel")}</FieldLabel>
                        <input
                          type={isDate ? "date" : valueInputType}
                          value={row.value}
                          onChange={(e) => updateCustomField(row.id, { value: e.target.value })}
                          placeholder={
                            isDate ? undefined : t("dashboard.createParty.valuePlaceholder")
                          }
                          disabled={!row.fieldType || (isOther && !row.customLabel.trim())}
                          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-brand-primary-muted`}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeCustomField(row.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        {t("dashboard.createParty.removeCustomField")}
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addCustomField}
                className="text-sm font-semibold text-brand-orange-2 hover:underline"
              >
                + {t("dashboard.createParty.addCustomField")}
              </button>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
