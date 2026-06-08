"use client";

import { useState } from "react";
import { OtpInput } from "@/components/login/otp-input";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";
import {
  MOCK_INVITE_CONSENT_OTP,
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

export function TeamInviteWizard({ organisationId, onSuccess, onError }: TeamInviteWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<InviteStep>("details");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<UserRole>("Staff");
  const [verificationToken, setVerificationToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const resetWizard = () => {
    setStep("details");
    setMobile("");
    setRole("Staff");
    setVerificationToken("");
    setOtpDigits(Array(6).fill(""));
    setOtpHint(null);
  };

  const handleSendOtp = async () => {
    const normalized = normalizeIndianMobileInput(mobile);
    if (!normalized) {
      onError(t("dashboard.teamSettings.invalidMobile"));
      return;
    }
    setSendingOtp(true);
    onError(null);
    try {
      const result = await requestInviteConsentOtp(organisationId, normalized, role);
      setVerificationToken(result.verificationToken);
      setMobile(result.mobile);
      setRole(result.role);
      setOtpHint(
        formatMessage(t("dashboard.teamSettings.otpSentMock"), { otp: MOCK_INVITE_CONSENT_OTP }),
      );
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
      setStep("done");
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : t("dashboard.teamSettings.otpVerifyError"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.04] to-brand-orange-1/[0.06] px-5 py-5 lg:px-6">
        <h2 className="text-lg font-bold text-brand-primary">{t("dashboard.teamSettings.inviteTitle")}</h2>
        <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.teamSettings.inviteHintOtp")}</p>
      </div>

      <div className="p-5 lg:p-6">
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
                {t("dashboard.teamSettings.consentHint")}
              </p>
            </div>

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
          <div className="mx-auto max-w-md space-y-6">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">{t("dashboard.teamSettings.verifyConsentTitle")}</p>
              <p className="mt-1 text-amber-800/90">
                {formatMessage(t("dashboard.teamSettings.verifyConsentHint"), {
                  mobile,
                  role: t(ROLE_LABEL_KEYS[role]),
                })}
              </p>
            </div>

            {otpHint ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-brand-primary-muted">
                {otpHint}
              </p>
            ) : null}

            <div>
              <label className="mb-3 block text-center text-sm font-semibold text-brand-primary">
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
      </div>
    </section>
  );
}
