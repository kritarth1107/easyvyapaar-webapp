"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { OtpInput } from "@/components/login/otp-input";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  previewInviteMobile,
  requestInviteConsentOtp,
  verifyInviteConsentOtp,
} from "@/lib/permissions/team-api-client";
import type { UserRole } from "@/lib/permissions/role-permissions";
import { normalizeIndianMobileInput } from "@/lib/validators/indian-mobile";
import {
  ROLE_LABEL_KEYS,
  RoleCardGrid,
  RolePermissionsPanel,
} from "./team-role-ui";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

type InviteStep = "details" | "verify" | "done";

type TeamInviteWizardProps = {
  organisationId: string;
  onSuccess: () => void;
  onError: (message: string | null) => void;
  variant?: "card" | "modal";
};

function StepIndicator({ step, t }: { step: InviteStep; t: (key: TranslationKey) => string }) {
  const steps: { id: InviteStep; label: TranslationKey }[] = [
    { id: "details", label: "dashboard.teamSettings.stepDetails" },
    { id: "verify", label: "dashboard.teamSettings.stepVerify" },
    { id: "done", label: "dashboard.teamSettings.stepDone" },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);

  return (
    <ol className="mb-6 flex items-center gap-2">
      {steps.map((s, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-brand-primary text-white"
                    : "bg-slate-100 text-brand-primary-muted"
              }`}
            >
              {done ? "✓" : index + 1}
            </div>
            <span
              className={`hidden text-xs font-semibold sm:inline ${
                active ? "text-brand-primary" : "text-brand-primary-muted"
              }`}
            >
              {t(s.label)}
            </span>
            {index < steps.length - 1 ? (
              <div
                className={`mx-1 h-px flex-1 ${done ? "bg-emerald-300" : "bg-slate-200"}`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function TeamInviteWizard({
  organisationId,
  onSuccess,
  onError,
  variant = "card",
}: TeamInviteWizardProps) {
  const isModal = variant === "modal";
  const { t } = useTranslation();
  const { user } = useUserMe();
  const yourMobileDisplay = user?.mobile?.trim() ?? "";
  const [step, setStep] = useState<InviteStep>("details");
  const [mobile, setMobile] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [existingName, setExistingName] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("Staff");
  const [verificationToken, setVerificationToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const resetWizard = () => {
    setStep("details");
    setMobile("");
    setInviteeName("");
    setExistingName("");
    setNeedsProfile(false);
    setRole("Staff");
    setVerificationToken("");
    setOtpDigits(Array(6).fill(""));
  };

  useEffect(() => {
    const normalized = normalizeIndianMobileInput(mobile);
    if (!normalized || normalized.length !== 10) {
      setNeedsProfile(false);
      setInviteeName("");
      setExistingName("");
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    void previewInviteMobile(organisationId, normalized)
      .then((preview) => {
        if (cancelled) return;
        setNeedsProfile(preview.needsProfile);
        if (preview.needsProfile) {
          setInviteeName("");
          setExistingName("");
        } else {
          setInviteeName("");
          setExistingName(preview.existingName ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNeedsProfile(false);
          setExistingName("");
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mobile, organisationId]);

  const handleSendOtp = async () => {
    const normalized = normalizeIndianMobileInput(mobile);
    if (!normalized) {
      onError(t("dashboard.teamSettings.invalidMobile"));
      return;
    }
    if (needsProfile && !inviteeName.trim()) {
      onError(t("dashboard.teamSettings.inviteeNameRequired"));
      return;
    }
    setSendingOtp(true);
    onError(null);
    try {
      const result = await requestInviteConsentOtp(
        organisationId,
        normalized,
        role,
        needsProfile ? inviteeName : undefined,
      );
      setVerificationToken(result.verificationToken);
      setMobile(result.mobile);
      setRole(result.role);
      setStep("verify");
    } catch (err) {
      onError(err instanceof Error ? err.message : t("dashboard.teamSettings.otpError"));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      onError(t("dashboard.teamSettings.otpIncomplete"));
      return;
    }
    setVerifying(true);
    onError(null);
    try {
      await verifyInviteConsentOtp(organisationId, verificationToken, otp);
      if (isModal) {
        resetWizard();
        onSuccess();
      } else {
        setStep("done");
        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : t("dashboard.teamSettings.otpVerifyError"));
    } finally {
      setVerifying(false);
    }
  };

  const wizardBody = (
    <>
        <StepIndicator step={step} t={t} />

        {step === "details" ? (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-primary">
                {t("dashboard.teamSettings.mobile")}
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t("dashboard.teamSettings.mobilePlaceholder")}
                className={inputClass}
              />
              <p className="mt-2 text-xs text-brand-primary-muted">
                {t("dashboard.teamSettings.consentHintInviter")}
              </p>
            </div>

            {needsProfile ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-primary">
                  {t("dashboard.teamSettings.inviteeName")}
                </label>
                <input
                  type="text"
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  placeholder={t("dashboard.teamSettings.inviteeNamePlaceholder")}
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-brand-primary-muted">
                  {t("dashboard.teamSettings.inviteeNameHint")}
                </p>
              </div>
            ) : previewLoading ? (
              <p className="text-xs text-brand-primary-muted">{t("common.pleaseWait")}</p>
            ) : existingName ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-primary">
                  {t("dashboard.teamSettings.inviteeName")}
                </label>
                <input
                  type="text"
                  value={existingName}
                  disabled
                  className={`${inputClass} cursor-not-allowed bg-slate-50 text-brand-primary-muted`}
                />
                <p className="mt-2 text-xs text-brand-primary-muted">
                  {t("dashboard.teamSettings.registeredNameHint")}
                </p>
              </div>
            ) : null}

            <div>
              <label className="mb-3 block text-sm font-semibold text-brand-primary">
                {t("dashboard.teamSettings.chooseRole")}
              </label>
              <RoleCardGrid selectedRole={role} onSelect={setRole} t={t} />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-brand-primary">
                {formatMessage(t("dashboard.teamSettings.permissionsForRole"), {
                  role: t(ROLE_LABEL_KEYS[role]),
                })}
              </p>
              <div className="mt-3">
                <RolePermissionsPanel role={role} t={t} />
              </div>
            </div>

            <button
              type="button"
              disabled={sendingOtp}
              onClick={() => void handleSendOtp()}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 disabled:opacity-60 sm:w-auto"
            >
              {sendingOtp ? t("common.pleaseWait") : t("dashboard.teamSettings.sendConsentOtp")}
            </button>
          </div>
        ) : null}

        {step === "verify" ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5 text-sm text-amber-900">
              <p className="font-semibold">{t("dashboard.teamSettings.verifyConsentTitle")}</p>
              <p className="mt-1.5 leading-relaxed text-amber-800/90">
                {formatMessage(t("dashboard.teamSettings.verifyConsentHint"), {
                  yourMobile: yourMobileDisplay,
                  role: t(ROLE_LABEL_KEYS[role]),
                })}
              </p>
            </div>

            <div className="w-full">
              <label className="mb-3 block text-sm font-semibold text-brand-primary">
                {t("dashboard.teamSettings.enterOtp")}
              </label>
              <OtpInput value={otpDigits} onChange={setOtpDigits} disabled={verifying} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={verifying}
                onClick={() => {
                  setStep("details");
                  setOtpDigits(Array(6).fill(""));
                }}
                className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-brand-primary transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                {t("common.back")}
              </button>
              <button
                type="button"
                disabled={verifying}
                onClick={() => void handleVerify()}
                className="h-11 flex-1 rounded-xl bg-brand-primary text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
              >
                {verifying ? t("common.pleaseWait") : t("dashboard.teamSettings.confirmInvite")}
              </button>
            </div>

            <button
              type="button"
              disabled={sendingOtp}
              onClick={() => void handleSendOtp()}
              className="w-full text-center text-xs font-medium text-brand-orange-2 hover:underline disabled:opacity-60"
            >
              {sendingOtp ? t("common.pleaseWait") : t("dashboard.teamSettings.resendOtp")}
            </button>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="mx-auto max-w-md py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
              ✓
            </div>
            <h3 className="text-lg font-bold text-brand-primary">{t("dashboard.teamSettings.inviteSent")}</h3>
            <p className="mt-2 text-sm text-brand-primary-muted">
              {formatMessage(t("dashboard.teamSettings.inviteSentDetail"), {
                mobile,
                role: t(ROLE_LABEL_KEYS[role]),
              })}
            </p>
            <button
              type="button"
              onClick={resetWizard}
              className="mt-6 h-10 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white"
            >
              {t("dashboard.teamSettings.inviteAnother")}
            </button>
          </div>
        ) : null}
    </>
  );

  if (isModal) {
    return <div className="py-1">{wizardBody}</div>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.04] to-brand-orange-1/[0.06] px-5 py-5 lg:px-6">
        <h2 className="text-lg font-bold text-brand-primary">{t("dashboard.teamSettings.inviteTitle")}</h2>
        <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.teamSettings.inviteHintOtp")}</p>
      </div>
      <div className="p-5 lg:p-6">{wizardBody}</div>
    </section>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type TeamInviteModalProps = {
  open: boolean;
  organisationId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string | null) => void;
};

export function TeamInviteModal({
  open,
  organisationId,
  onClose,
  onSuccess,
  onError,
}: TeamInviteModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-invite-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[min(90vh,880px)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
          aria-label={t("common.close")}
        >
          <CloseIcon />
        </button>
        <div className="border-b border-slate-100 px-6 py-5 pr-14">
          <h2 id="team-invite-modal-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.teamSettings.inviteTitle")}
          </h2>
          <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.teamSettings.inviteHintOtp")}</p>
        </div>
        <div className="overflow-y-auto px-6 py-5 scrollbar-brand">
          <TeamInviteWizard
            key={organisationId}
            organisationId={organisationId}
            variant="modal"
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
