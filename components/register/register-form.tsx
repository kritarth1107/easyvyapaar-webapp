"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { useCallback, useMemo, useState } from "react";
import { OtpInput } from "@/components/login/otp-input";
import {
  APP_LANGUAGES,
  APP_LANGUAGE_FONT,
  useTranslation,
  type LocaleCode,
  type TranslationKey,
} from "@/lib/localization";
import { ORGANISATION_TYPES, type OrganisationType } from "@/lib/constants/organisation-types";
import { OrganisationSelectModal } from "@/components/auth/organisation-select-modal";
import { completeAuthSessionOrganisation } from "@/lib/auth/complete-auth-session";
import { setStoredActiveOrganisationId } from "@/lib/auth/active-organisation";
import { DASHBOARD_PATH } from "@/lib/auth/session";
import {
  AUTH_ERROR_MOBILE_ALREADY_REGISTERED,
  type CheckGstSuccessResponse,
  type OrganisationSummary,
  type RegisterSuccessResponse,
  type VerifyOtpSuccessResponse,
  isApiErrorResponse,
} from "@/lib/types/auth-api";
import { normalizeIndianMobileInput } from "@/lib/validators/indian-mobile";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

type RegisterFormProps = {
  initialMobile?: string;
};

type RegisterStep = 1 | 2 | 3 | 4;

type StepIndicatorProps = {
  step: RegisterStep;
  stepLabels: readonly [string, string, string];
};

function GstVerifiedBanner({ gstin, verifiedLabel }: { gstin: string; verifiedLabel: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xs border border-emerald-200 bg-emerald-50 px-3.5 py-3"
      role="status"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20"
        aria-hidden
      >
        <svg viewBox="0 0 12 12" className="h-4 w-4" fill="none">
          <path
            d="M2.5 6.25 4.75 8.5 9.5 3.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-semibold tracking-wide text-emerald-950">
          {gstin}
        </p>
        <p className="mt-0.5 text-xs font-medium text-emerald-700">GSTIN</p>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
        <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10.28 3.72a.75.75 0 00-1.06-1.06L5.25 6.69 3.78 5.22a.75.75 0 10-1.06 1.06l2 2a.75.75 0 001.06 0l5.5-5.5z"
            clipRule="evenodd"
          />
        </svg>
        {verifiedLabel}
      </span>
    </div>
  );
}

function StepCheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <path
        d="M2 6l2.5 2.5L10 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepIndicator({ step, stepLabels }: StepIndicatorProps) {
  const displayStep = step >= 4 ? 3 : step;
  const slideIndex = displayStep - 1;
  const steps = [
    { id: 1 as const, label: stepLabels[0] },
    { id: 2 as const, label: stepLabels[1] },
    { id: 3 as const, label: stepLabels[2] },
  ];

  return (
    <nav
      className="register-stepper mb-10 mt-8 overflow-visible px-1 sm:mt-10 sm:px-2"
      aria-label={`Registration progress, step ${displayStep} of ${steps.length}`}
    >
      <div className="w-max min-w-full">
      <ol className="relative z-10 flex w-max flex-nowrap items-center gap-x-1 sm:gap-x-2">
        {steps.map((item, index) => {
          const active = item.id === displayStep;
          const done = item.id < displayStep;
          const connectorDone = item.id < displayStep;

          return (
            <li key={item.id} className="register-step-item flex shrink-0 items-center">
              <div className="flex shrink-0 items-center gap-2.5 px-0.5 sm:gap-3 sm:px-1">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                    done
                      ? "bg-brand-primary text-white"
                      : active
                        ? "scale-105 border-2 border-brand-orange-1 bg-white text-brand-orange-2"
                        : "border-2 border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {done ? (
                    <StepCheckIcon />
                  ) : active ? (
                    <StepCheckIcon className="h-3 w-3" />
                  ) : null}
                </div>
                <span
                  className={`whitespace-nowrap text-xs leading-snug transition-colors duration-300 sm:text-sm ${
                    active || done ? "font-medium text-brand-primary" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className="register-step-connector mx-3 h-px w-6 shrink-0 overflow-hidden rounded-full bg-slate-200 sm:mx-4 sm:w-10 md:mx-5 md:w-12"
                  aria-hidden
                >
                  <div
                    className={`register-step-connector-fill h-full rounded-full ${
                      connectorDone ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="register-step-slider h-full w-1/3 rounded-full"
          style={{ transform: `translateX(${slideIndex * 100}%)` }}
        />
      </div>
      </div>
    </nav>
  );
}

export function RegisterForm({ initialMobile = "" }: RegisterFormProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [step, setStep] = useState<RegisterStep>(1);
  const stepLabels = useMemo(
    () =>
      [
        t("register.steps.language"),
        t("register.steps.gst"),
        t("register.steps.detailsOtp"),
      ] as const,
    [t]
  );
  const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileFieldError, setMobileFieldError] = useState<string | null>(null);
  const [mobileShake, setMobileShake] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [pendingOrganisations, setPendingOrganisations] = useState<OrganisationSummary[]>([]);
  const [pendingDefaultOrgId, setPendingDefaultOrgId] = useState<string | undefined>();

  const [gstin, setGstin] = useState("");
  const [gstVerified, setGstVerified] = useState(false);
  const [gstSkipped, setGstSkipped] = useState(false);

  const [contactName, setContactName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [organisationType, setOrganisationType] = useState<OrganisationType | "">("");
  const [mobile, setMobile] = useState(normalizeIndianMobileInput(initialMobile));

  const [verificationToken, setVerificationToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));

  const otpValue = otpDigits.join("");
  const isValidMobile = INDIAN_MOBILE_REGEX.test(mobile);
  const normalizedGst = normalizeGstin(gstin);
  const gstFieldsLocked = gstVerified && !gstSkipped;

  const goToStep = useCallback((next: RegisterStep) => {
    setStep((prev) => {
      setSlideDirection(next > prev ? "forward" : "back");
      return next;
    });
  }, []);

  const triggerMobileShake = useCallback(() => {
    setMobileShake(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMobileShake(true));
    });
    window.setTimeout(() => setMobileShake(false), 450);
  }, []);

  const isMobileAlreadyRegisteredError = useCallback((data: unknown) => {
    if (!isApiErrorResponse(data)) return false;
    if (data.error.errorCode === AUTH_ERROR_MOBILE_ALREADY_REGISTERED) return true;
    const text = `${data.message} ${data.error.details ?? ""} ${data.error.description}`.toLowerCase();
    return text.includes("mobile already registered");
  }, []);

  function handleLanguageContinue() {
    setError(null);
    setInfoMessage(null);
    goToStep(2);
  }

  function selectLanguage(code: LocaleCode) {
    setLocale(code);
    setError(null);
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidGstin(normalizedGst)) {
      setError(t("register.gst.invalidGstin"));
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/authentication/register/check-gst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstin: normalizedGst }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const message = isApiErrorResponse(data)
          ? data.error.details ?? data.message
          : (data as { error?: string })?.error ?? t("register.gst.verifyFailed");
        setError(message);
        return;
      }

      const success = data as CheckGstSuccessResponse;
      setGstSkipped(false);
      setGstin(success.data?.gstin ?? normalizedGst);
      setGstVerified(success.data?.gstVerified ?? true);

      if (success.data?.legalName) {
        setContactName(success.data.legalName);
      }

      if (success.data?.tradeName) {
        setTradeName(success.data.tradeName);
      } else if (success.data?.legalName) {
        setTradeName(success.data.legalName);
      }

      const mapped = success.data?.mappedOrganisationType;
      if (mapped && ORGANISATION_TYPES.includes(mapped as OrganisationType)) {
        setOrganisationType(mapped as OrganisationType);
      }

      setInfoMessage(success.details || success.message);
      goToStep(3);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function handleSkipGst() {
    setGstin("");
    setGstVerified(false);
    setGstSkipped(true);
    setError(null);
    setInfoMessage(t("register.details.skipGstInfo"));
    goToStep(3);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();

    if (contactName.trim().length < 2) {
      setError(t("register.details.contactNameError"));
      return;
    }
    if (tradeName.trim().length < 2) {
      setError(t("register.details.tradeNameError"));
      return;
    }
    if (!organisationType) {
      setError(t("register.details.orgTypeError"));
      return;
    }
    if (!isValidMobile) {
      setError(t("register.details.mobileError"));
      return;
    }

    setLoading(true);
    setError(null);
    setMobileFieldError(null);
    setInfoMessage(null);

    try {
      const registerPayload: Record<string, string> = {
        userName: contactName.trim(),
        organisationName: tradeName.trim(),
        organisationType,
        mobile,
        preferredLanguage: locale,
      };
      if (gstVerified && isValidGstin(normalizedGst)) {
        registerPayload.gstin = normalizedGst;
      }

      const res = await fetch("/api/authentication/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerPayload),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        if (isMobileAlreadyRegisteredError(data)) {
          setMobileFieldError(t("register.details.mobileAlreadyRegistered"));
          triggerMobileShake();
          return;
        }

        const message = isApiErrorResponse(data)
          ? data.error.details ?? data.message
          : (data as { error?: string })?.error ?? t("register.details.registerFailed");
        setError(message);
        return;
      }

      const success = data as RegisterSuccessResponse;
      if (!success.success || !success.data?.verificationToken) {
        setError(t("register.details.unexpectedResponse"));
        return;
      }

      setVerificationToken(success.data.verificationToken);
      setInfoMessage(success.details || success.message);
      goToStep(4);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setError(t("register.otp.enterOtpError"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/authentication/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationToken, otp: otpValue }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const message = isApiErrorResponse(data)
          ? data.error.details ?? data.message
          : (data as { error?: string })?.error ?? t("register.otp.verifyFailed");
        setError(message);
        return;
      }

      const success = data as VerifyOtpSuccessResponse;
      if (!success.success || !success.data) {
        setError(t("register.otp.verifyFailed"));
        return;
      }

      const { needsSelection, organisations, defaultOrganisationId } =
        completeAuthSessionOrganisation(success.data);

      if (needsSelection) {
        setPendingOrganisations(organisations);
        setPendingDefaultOrgId(defaultOrganisationId);
        setOrgModalOpen(true);
        setLoading(false);
        return;
      }

      router.push(`${DASHBOARD_PATH}?utm=new_registration`);
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "login-input-focus w-full rounded-xs border border-slate-300/90 bg-white px-4 py-3 text-base text-brand-primary placeholder:text-slate-400 outline-none transition-all disabled:cursor-not-allowed disabled:bg-slate-100";

  function handleOrganisationSelect(organisationId: string) {
    setStoredActiveOrganisationId(organisationId);
    setOrgModalOpen(false);
    router.push(`${DASHBOARD_PATH}?utm=new_registration`);
    router.refresh();
  }

  return (
    <>
      <OrganisationSelectModal
        open={orgModalOpen}
        organisations={pendingOrganisations}
        defaultOrganisationId={pendingDefaultOrgId}
        primaryBadge={t("orgSelect.primaryBadge")}
        title={t("orgSelect.loginTitle")}
        subtitle={t("orgSelect.loginSubtitle")}
        continueLabel={t("orgSelect.loginHint")}
        onSelect={handleOrganisationSelect}
      />
    <div className="flex min-h-screen flex-1 flex-col justify-start bg-white px-8 py-10 sm:px-12 lg:px-16 xl:px-24 2xl:px-28">
      <div className="w-full max-w-lg overflow-visible">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Image
            src={BRAND_LOGO}
            alt={t("common.brandName")}
            width={96}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="text-lg font-semibold text-brand-primary">{t("common.brandName")}</span>
        </div>

        <h1 className="text-2xl font-bold text-brand-primary xl:text-3xl">
          {t("register.createAccount")}
        </h1>

        <StepIndicator step={step} stepLabels={stepLabels} />

        <div className="relative overflow-x-hidden">
          <div
            key={step}
            className={
              slideDirection === "forward"
                ? "register-step-panel register-step-panel--forward"
                : "register-step-panel register-step-panel--back"
            }
          >
        {step === 1 && (
          <div>
            <p className="text-sm font-semibold text-brand-primary">{t("register.language.title")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("register.language.subtitle")}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {APP_LANGUAGES.map((lang) => {
                const selected = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => selectLanguage(lang.code)}
                    className={`rounded-xs border px-3 py-3 text-left transition-all duration-200 ${
                      selected
                        ? "border-brand-orange-1 bg-brand-surface-warm shadow-sm ring-1 ring-brand-orange-1/50"
                        : "border-slate-300/90 bg-white hover:border-slate-400"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className="block text-base font-semibold leading-snug text-brand-primary"
                      style={{ fontFamily: APP_LANGUAGE_FONT[lang.code] }}
                      lang={lang.code}
                    >
                      {lang.native}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">{lang.label}</span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleLanguageContinue}
              className="login-btn-primary mt-6 w-full rounded-xs px-4 py-3.5 text-sm font-semibold"
            >
              {t("common.continue")}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleStep1}>
            <label htmlFor="gstin" className="block text-sm font-semibold text-brand-primary">
              {t("register.gst.label")}{" "}
              <span className="font-normal text-slate-500">{t("common.optional")}</span>
            </label>
            <input
              id="gstin"
              name="gstin"
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              className={`${fieldClass} mt-2 font-mono tracking-wide`}
              autoComplete="off"
            />
            <p className="mt-2 text-xs text-slate-500">{t("register.gst.hint")}</p>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isValidGstin(normalizeGstin(gstin))}
              className="login-btn-primary mt-6 w-full rounded-xs px-4 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("register.gst.verifying") : t("register.gst.verifyContinue")}
            </button>

            <p className="mt-5 text-center">
              <button
                type="button"
                onClick={handleSkipGst}
                disabled={loading}
                className="text-sm font-medium text-brand-primary-mid underline-offset-4 transition-colors hover:text-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("register.gst.skip")}
              </button>
            </p>

            <button
              type="button"
              onClick={() => {
                goToStep(1);
                setError(null);
                setInfoMessage(null);
              }}
              disabled={loading}
              className="mt-4 w-full rounded-xs border border-slate-300 px-4 py-3.5 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("common.back")}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep2} className="space-y-5">
            {gstVerified && (
              <GstVerifiedBanner
                gstin={normalizedGst}
                verifiedLabel={t("register.details.gstVerified")}
              />
            )}
            {gstSkipped && !gstVerified && (
              <p className="rounded-xs bg-slate-100 px-3 py-2 text-xs text-slate-600">
                {t("register.details.noGst")}
              </p>
            )}

            <div>
              <label htmlFor="contactName" className="block text-sm font-semibold text-brand-primary">
                {t("register.details.contactName")}
              </label>
              <input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t("register.details.contactPlaceholder")}
                className={`${fieldClass} mt-2`}
              />
            </div>

            <div>
              <label htmlFor="tradeName" className="block text-sm font-semibold text-brand-primary">
                {t("register.details.tradeName")}
                {gstFieldsLocked && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {t("common.fromGst")}
                  </span>
                )}
              </label>
              <input
                id="tradeName"
                value={tradeName}
                readOnly={gstFieldsLocked}
                disabled={gstFieldsLocked}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder={t("register.details.tradePlaceholder")}
                className={`${fieldClass} mt-2 ${gstFieldsLocked ? "cursor-not-allowed bg-slate-50 text-slate-600" : ""}`}
              />
            </div>

            <div>
              <label htmlFor="orgType" className="block text-sm font-semibold text-brand-primary">
                {t("register.details.selectType")}
                {gstFieldsLocked && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {t("common.fromGst")}
                  </span>
                )}
              </label>
              <select
                id="orgType"
                value={organisationType}
                disabled={gstFieldsLocked}
                onChange={(e) => setOrganisationType(e.target.value as OrganisationType)}
                className={`${fieldClass} mt-2 ${gstFieldsLocked ? "cursor-not-allowed bg-slate-50 text-slate-600" : ""}`}
              >
                <option value="">{t("register.details.chooseOrgType")}</option>
                {ORGANISATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`register.orgTypes.${type}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold text-brand-primary">
                {t("register.details.mobileLabel")}
              </label>
              <div
                className={`relative mt-2 ${mobileShake ? "register-field-shake" : ""}`}
              >
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm font-medium text-brand-primary-light">
                  +91
                </span>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={mobile}
                  aria-invalid={mobileFieldError ? true : undefined}
                  aria-describedby={mobileFieldError ? "mobile-error" : undefined}
                  onChange={(e) => {
                    setMobile(normalizeIndianMobileInput(e.target.value));
                    setMobileFieldError(null);
                  }}
                  onInput={(e) => {
                    setMobile(normalizeIndianMobileInput(e.currentTarget.value));
                    setMobileFieldError(null);
                  }}
                  placeholder="98765 43210"
                  className={`${fieldClass} pl-14 ${
                    mobileFieldError ? "login-input-focus--error border-red-500" : ""
                  }`}
                />
              </div>
              {mobileFieldError && (
                <p id="mobile-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {mobileFieldError}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {infoMessage && !error && (
              <p className="text-sm text-brand-primary-mid" role="status">
                {infoMessage}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  goToStep(2);
                  setError(null);
                  if (!gstSkipped) setInfoMessage(null);
                }}
                className="w-full rounded-xs border border-slate-300 px-4 py-3.5 text-sm font-semibold text-brand-primary hover:bg-slate-50"
              >
                {t("common.back")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="login-btn-primary w-full rounded-xs px-4 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("common.pleaseWait") : t("common.next")}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleStep3}>
            <p className="text-sm text-slate-600">
              {t("register.otp.sentTo")}{" "}
              <span className="font-semibold text-brand-primary">+91 {mobile}</span>
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-brand-primary">
                {t("register.otp.enterOtp")}
              </label>
              <OtpInput value={otpDigits} onChange={setOtpDigits} disabled={loading} />
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {infoMessage && !error && (
              <p className="mt-4 text-sm text-brand-primary-mid" role="status">
                {infoMessage}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  goToStep(3);
                  setError(null);
                  setOtpDigits(Array(6).fill(""));
                }}
                className="w-full rounded-xs border border-slate-300 px-4 py-3.5 text-sm font-semibold text-brand-primary hover:bg-slate-50"
              >
                {t("common.back")}
              </button>
              <button
                type="submit"
                disabled={loading || otpValue.length !== 6}
                className="login-btn-primary w-full rounded-xs px-4 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("register.otp.verifying") : t("register.otp.verifyComplete")}
              </button>
            </div>
          </form>
        )}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-slate-600">
          {t("register.alreadyHaveAccount")}{" "}
          <Link href="/auth/login" className="login-link font-semibold hover:underline">
            {t("register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
