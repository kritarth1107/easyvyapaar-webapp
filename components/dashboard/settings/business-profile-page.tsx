"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { orgInitials } from "@/components/dashboard/business-switch";
import { InvoiceSignatureInput } from "@/components/dashboard/sales/invoice-signature-input";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import {
  ADDITIONAL_DETAIL_TYPES,
  buildBusinessProfileFromOrg,
  BUSINESS_TYPES,
  type BusinessProfileForm,
  INDUSTRY_OPTIONS,
  REGISTRATION_OPTIONS,
  STATE_OPTIONS,
} from "@/lib/dashboard/business-profile-form";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

const textareaClass =
  "w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  badge,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-brand-primary">{label}</span>
        {badge && (
          <span className="rounded-sm bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
            {badge}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-primary" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-slate-200/90" />
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
        {title}
      </span>
      <div className="h-px flex-1 bg-slate-200/90" />
    </div>
  );
}

export function BusinessProfilePage() {
  const { t } = useTranslation();
  const { activeOrganisation, isWorkspaceLoading } = useUserMe();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BusinessProfileForm>(() =>
    buildBusinessProfileFromOrg(activeOrganisation),
  );
  const [saved, setSaved] = useState<BusinessProfileForm>(() =>
    buildBusinessProfileFromOrg(activeOrganisation),
  );
  const [detailType, setDetailType] = useState<string>(ADDITIONAL_DETAIL_TYPES[0].value);
  const [detailValue, setDetailValue] = useState("");

  useEffect(() => {
    const next = buildBusinessProfileFromOrg(activeOrganisation);
    setForm(next);
    setSaved(next);
  }, [activeOrganisation?.orgId]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  const patch = (partial: Partial<BusinessProfileForm>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const toggleBusinessType = (type: string) => {
    setForm((prev) => {
      const has = prev.businessTypes.includes(type);
      const businessTypes = has
        ? prev.businessTypes.filter((t) => t !== type)
        : [...prev.businessTypes, type];
      return { ...prev, businessTypes: businessTypes.length ? businessTypes : [type] };
    });
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patch({ logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const addDetail = () => {
    const value = detailValue.trim();
    if (!value) return;
    const label = ADDITIONAL_DETAIL_TYPES.find((d) => d.value === detailType)?.label ?? detailType;
    setForm((prev) => ({
      ...prev,
      additionalDetails: [
        ...prev.additionalDetails,
        { id: `${detailType}-${Date.now()}`, type: label, value },
      ],
    }));
    setDetailValue("");
  };

  const removeDetail = (id: string) => {
    setForm((prev) => ({
      ...prev,
      additionalDetails: prev.additionalDetails.filter((d) => d.id !== id),
    }));
  };

  const cancel = () => setForm({ ...saved });
  const save = () => setSaved({ ...form });

  const initials = orgInitials(form.name || "ME");

  return (
    <div className="flex min-h-full flex-col bg-brand-surface">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 px-4 py-4 backdrop-blur-md lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-brand-primary lg:text-2xl">
                {t("dashboard.businessProfile.title")}
              </h1>
              <p className="mt-0.5 text-sm text-brand-primary-muted">
                {t("dashboard.businessProfile.subtitle")}
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex h-9 shrink-0 items-center rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-4 text-sm font-semibold text-white hover:brightness-105"
            >
              {t("dashboard.businessProfile.createNewBusiness")}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200/90 bg-white px-3 text-sm font-medium text-brand-primary-mid hover:bg-slate-50"
            >
              <span aria-hidden>💬</span>
              {t("dashboard.businessProfile.chatSupport")}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200/90 bg-white px-3 text-sm font-medium text-brand-primary-mid hover:bg-slate-50"
            >
              <span aria-hidden>📁</span>
              {t("dashboard.businessProfile.closeFinancialYear")}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={!dirty}
              className="inline-flex h-9 items-center rounded-md border border-brand-primary/25 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-brand-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={save}
              className="inline-flex h-9 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("dashboard.businessProfile.saveChanges")}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">
        {isWorkspaceLoading ? (
          <p className="text-sm text-brand-primary-muted">{t("dashboard.businessProfile.loading")}</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column */}
            <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="group relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50 transition-colors hover:border-brand-primary/30"
                  title={t("dashboard.businessProfile.uploadLogo")}
                >
                  {form.logoDataUrl ? (
                    <Image
                      src={form.logoDataUrl}
                      alt="Business logo"
                      width={88}
                      height={88}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-md bg-[#f63e16] text-lg font-bold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {t("dashboard.businessProfile.change")}
                  </span>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                />
                <div className="min-w-0 flex-1">
                  <FieldLabel required>{t("dashboard.businessProfile.businessName")}</FieldLabel>
                  <input
                    value={form.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    className={inputClass}
                    placeholder={t("dashboard.businessProfile.businessNamePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>{t("dashboard.businessProfile.companyPhone")}</FieldLabel>
                  <input
                    value={form.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    className={inputClass}
                    placeholder="9399576767"
                  />
                </div>
                <div>
                  <FieldLabel>{t("dashboard.businessProfile.companyEmail")}</FieldLabel>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    className={inputClass}
                    placeholder={t("dashboard.businessProfile.companyEmailPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.billingAddress")}</FieldLabel>
                <textarea
                  value={form.billingAddress}
                  onChange={(e) => patch({ billingAddress: e.target.value })}
                  rows={3}
                  className={textareaClass}
                  placeholder={t("dashboard.businessProfile.billingAddressPlaceholder")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>{t("dashboard.businessProfile.state")}</FieldLabel>
                  <ModernSelect
                    value={form.state}
                    onChange={(v) => patch({ state: v })}
                    options={STATE_OPTIONS}
                    placeholder={t("dashboard.businessProfile.selectState")}
                    searchable
                  />
                </div>
                <div>
                  <FieldLabel>{t("dashboard.businessProfile.pincode")}</FieldLabel>
                  <input
                    value={form.pincode}
                    onChange={(e) => patch({ pincode: e.target.value })}
                    className={inputClass}
                    placeholder="497331"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.city")}</FieldLabel>
                <input
                  value={form.city}
                  onChange={(e) => patch({ city: e.target.value })}
                  className={inputClass}
                  placeholder="Baikunthpur"
                />
              </div>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.gstRegistered")}</FieldLabel>
                <div className="flex gap-6">
                  {(["yes", "no"] as const).map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-brand-primary-mid">
                      <input
                        type="radio"
                        name="gst-registered"
                        checked={form.gstRegistered === (opt === "yes")}
                        onChange={() => patch({ gstRegistered: opt === "yes" })}
                        className="accent-brand-primary"
                      />
                      {opt === "yes"
                        ? t("dashboard.businessProfile.yes")
                        : t("dashboard.businessProfile.no")}
                    </label>
                  ))}
                </div>
              </div>

              {form.gstRegistered && (
                <div>
                  <FieldLabel required>{t("dashboard.businessProfile.gstin")}</FieldLabel>
                  <input
                    value={form.gstNumber}
                    onChange={(e) => patch({ gstNumber: e.target.value.toUpperCase() })}
                    className={inputClass}
                    placeholder="22FGDPS5345Q1ZS"
                  />
                </div>
              )}

              <ToggleRow
                checked={form.enableEInvoicing}
                onChange={(v) => patch({ enableEInvoicing: v })}
                label={t("dashboard.businessProfile.enableEInvoicing")}
                badge={t("dashboard.businessProfile.newBadge")}
              />

              <div>
                <FieldLabel>{t("dashboard.businessProfile.panNumber")}</FieldLabel>
                <input
                  value={form.pan}
                  onChange={(e) => patch({ pan: e.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="ABCDE1234F"
                />
              </div>

              <ToggleRow
                checked={form.enableTds}
                onChange={(v) => patch({ enableTds: v })}
                label={t("dashboard.businessProfile.enableTds")}
              />
              <ToggleRow
                checked={form.enableTcs}
                onChange={(v) => patch({ enableTcs: v })}
                label={t("dashboard.businessProfile.enableTcs")}
              />
            </div>

            {/* Right column */}
            <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <p className="text-xs text-brand-primary-muted">
                {t("dashboard.businessProfile.invoiceNote")}
              </p>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.businessType")}</FieldLabel>
                <p className="mb-2 text-[11px] text-brand-primary-muted">
                  {t("dashboard.businessProfile.businessTypeHint")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map((type) => {
                    const active = form.businessTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleBusinessType(type)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-slate-200/90 bg-white text-brand-primary-mid hover:border-brand-primary/30"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.industryType")}</FieldLabel>
                <ModernSelect
                  value={form.industryType}
                  onChange={(v) => patch({ industryType: v })}
                  options={INDUSTRY_OPTIONS}
                  searchable
                />
              </div>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.registrationType")}</FieldLabel>
                <ModernSelect
                  value={form.registrationType}
                  onChange={(v) => patch({ registrationType: v })}
                  options={REGISTRATION_OPTIONS}
                />
              </div>

              <div>
                <FieldLabel>{t("dashboard.businessProfile.signature")}</FieldLabel>
                <InvoiceSignatureInput
                  source={form.signatureSource}
                  dataUrl={form.signatureDataUrl}
                  onSourceChange={(signatureSource) => patch({ signatureSource })}
                  onDataUrlChange={(signatureDataUrl) => patch({ signatureDataUrl })}
                />
              </div>

              <SectionDivider title={t("dashboard.businessProfile.addBusinessDetails")} />
              <p className="text-xs text-brand-primary-muted">
                {t("dashboard.businessProfile.addBusinessDetailsHint")}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="w-full sm:w-[140px]">
                  <ModernSelect
                    value={detailType}
                    onChange={setDetailType}
                    options={ADDITIONAL_DETAIL_TYPES.map((d) => ({
                      value: d.value,
                      label: d.label,
                    }))}
                  />
                </div>
                <input
                  value={detailValue}
                  onChange={(e) => setDetailValue(e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="www.website.com"
                />
                <button
                  type="button"
                  onClick={addDetail}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white hover:brightness-110"
                >
                  {t("dashboard.businessProfile.add")}
                </button>
              </div>

              {form.additionalDetails.length > 0 && (
                <ul className="space-y-2">
                  {form.additionalDetails.map((detail) => (
                    <li
                      key={detail.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-slate-50/60 px-3 py-2 text-sm"
                    >
                      <span className="text-brand-primary-mid">
                        <span className="font-medium text-brand-primary">{detail.type}:</span>{" "}
                        {detail.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDetail(detail.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        {t("dashboard.businessProfile.remove")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Company settings */}
        <div className="mt-8">
          <SectionDivider title={t("dashboard.businessProfile.companySettings")} />
          <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-brand-primary">
                T
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-brand-primary">
                    {t("dashboard.businessProfile.tallyExport")}
                  </h3>
                  <span className="rounded-sm bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                    {t("dashboard.businessProfile.newBadge")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-brand-primary-muted">
                  {t("dashboard.businessProfile.tallyExportHint")}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md border border-slate-200/90 px-3 py-2 text-sm font-medium text-brand-primary-mid hover:bg-slate-50"
              >
                {t("dashboard.businessProfile.configure")}
              </button>
            </div>
          </div>
        </div>

        {/* Add new business */}
        <div className="mt-8 pb-8">
          <SectionDivider title={t("dashboard.businessProfile.addNewBusiness")} />
          <p className="mt-3 text-sm text-brand-primary-muted">
            {t("dashboard.businessProfile.addNewBusinessHint")}
          </p>
          <Link
            href="/auth/register"
            className="mt-3 inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 text-sm font-semibold text-white hover:brightness-105"
          >
            {t("dashboard.businessProfile.createNewBusiness")}
          </Link>
        </div>
      </div>
    </div>
  );
}
