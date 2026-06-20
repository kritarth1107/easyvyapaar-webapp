"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { useUserMe } from "@/components/providers/user-me-provider";
import { INDUSTRY_TYPE_OPTIONS, type IndustryType } from "@/lib/constants/industry-types";
import {
  ORGANISATION_TYPES,
  type OrganisationType,
} from "@/lib/constants/organisation-types";
import { useTranslation, type TranslationKey } from "@/lib/localization";
import {
  createAdditionalBusiness,
  fetchBusinessCreationEligibility,
  type BusinessCreationEligibility,
} from "@/lib/user/create-business-api-client";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";

const inputClass =
  "h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

type CreateBusinessModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateBusinessModal({ open, onClose }: CreateBusinessModalProps) {
  const { t } = useTranslation();
  const { refresh, switchActiveOrganisation } = useUserMe();

  const [mounted, setMounted] = useState(false);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<BusinessCreationEligibility | null>(null);
  const [organisationName, setOrganisationName] = useState("");
  const [organisationType, setOrganisationType] = useState<OrganisationType | "">("");
  const [industryType, setIndustryType] = useState<IndustryType | "">("");
  const [gstin, setGstin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organisationTypeOptions = useMemo(
    () =>
      ORGANISATION_TYPES.map((type) => ({
        value: type,
        label: t(`register.orgTypes.${type}` as TranslationKey),
      })),
    [t],
  );

  const industryOptions = useMemo(
    () =>
      INDUSTRY_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    [],
  );

  const loadEligibility = useCallback(async () => {
    setLoadingEligibility(true);
    setError(null);
    try {
      const data = await fetchBusinessCreationEligibility();
      setEligibility(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createBusiness.loadError"));
      setEligibility(null);
    } finally {
      setLoadingEligibility(false);
    }
  }, [t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setOrganisationName("");
    setOrganisationType("");
    setIndustryType("");
    setGstin("");
    setError(null);
    void loadEligibility();
  }, [open, loadEligibility]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility?.canCreate) return;

    const name = organisationName.trim();
    if (name.length < 2) {
      setError(t("createBusiness.nameRequired"));
      return;
    }
    if (!organisationType) {
      setError(t("createBusiness.orgTypeRequired"));
      return;
    }
    if (!industryType) {
      setError(t("createBusiness.industryRequired"));
      return;
    }

    const normalizedGst = normalizeGstin(gstin);
    if (normalizedGst && !isValidGstin(normalizedGst)) {
      setError(t("register.gst.invalidGstin"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createAdditionalBusiness({
        organisationName: name,
        organisationType,
        industryType,
        gstin: normalizedGst || undefined,
      });
      await refresh(created.organisationId, { silent: true });
      await switchActiveOrganisation(created.organisationId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createBusiness.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  const showUpgrade = eligibility && !eligibility.canCreate;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-business-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary-muted hover:bg-slate-100"
          aria-label={t("common.close")}
        >
          ×
        </button>

        <h2 id="create-business-title" className="pr-10 text-lg font-bold text-brand-primary">
          {t("createBusiness.title")}
        </h2>
        <p className="mt-2 text-sm text-brand-primary-muted">{t("createBusiness.subtitle")}</p>

        {loadingEligibility ? (
          <p className="mt-6 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
        ) : showUpgrade ? (
          <div className="mt-6 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-4 text-sm text-amber-950">
            <p className="font-semibold">{t("createBusiness.upgradeTitle")}</p>
            <p className="mt-2">{eligibility.message ?? t("createBusiness.upgradeHint")}</p>
            <p className="mt-2 text-xs text-amber-900/90">
              {t("createBusiness.upgradePlanHint")} {eligibility.upgradePlanHint}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/settings/subscription"
                className="login-btn-primary rounded-xs px-4 py-2 text-sm font-semibold"
                onClick={onClose}
              >
                {t("createBusiness.upgradeCta")}
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xs border border-slate-200/90 px-4 py-2 text-sm font-semibold text-brand-primary"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            {error ? (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
                {t("createBusiness.tradeName")}
              </label>
              <input
                type="text"
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                placeholder={t("createBusiness.tradeNamePlaceholder")}
                className={inputClass}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
                  {t("createBusiness.orgType")}
                </label>
                <ModernSelect
                  value={organisationType}
                  onChange={(v) => setOrganisationType(v as OrganisationType)}
                  options={organisationTypeOptions}
                  placeholder={t("createBusiness.orgTypePlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
                  {t("createBusiness.industry")}
                </label>
                <ModernSelect
                  value={industryType}
                  onChange={(v) => setIndustryType(v as IndustryType)}
                  options={industryOptions}
                  placeholder={t("createBusiness.industryPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
                {t("createBusiness.gstin")}
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder={t("createBusiness.gstinPlaceholder")}
                className={inputClass}
                maxLength={15}
              />
              <p className="mt-1 text-xs text-brand-primary-muted">{t("createBusiness.gstinHint")}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xs border border-slate-200/90 px-4 py-2.5 text-sm font-semibold text-brand-primary"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="login-btn-primary rounded-xs px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? t("common.pleaseWait") : t("createBusiness.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
