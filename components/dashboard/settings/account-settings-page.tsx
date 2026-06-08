"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { orgInitials } from "@/components/dashboard/business-switch";
import { OtpInput } from "@/components/login/otp-input";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { setStoredActiveOrganisationId } from "@/lib/auth/active-organisation";
import { APP_LANGUAGES } from "@/lib/localization/languages";
import { useTranslation } from "@/lib/localization";
import type { OrganisationMembership } from "@/lib/types/user-settings-api";
import {
  fetchOrganisationMemberships,
  leaveOrganisation,
  requestMobileChangeOtp,
  updateUserProfile,
  verifyMobileChangeOtp,
} from "@/lib/user/user-settings-api-client";
import { normalizeIndianMobileInput } from "@/lib/validators/indian-mobile";

const inputClass =
  "h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

const MOCK_MOBILE_CHANGE_OTP = "654321";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const { user, activeOrganisationId, refresh } = useUserMe();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [memberships, setMemberships] = useState<OrganisationMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);
  const [leavingOrgId, setLeavingOrgId] = useState<string | null>(null);

  const [mobileEditOpen, setMobileEditOpen] = useState(false);
  const [newMobile, setNewMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [verificationToken, setVerificationToken] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "otp-sent">("idle");
  const [mobileSaving, setMobileSaving] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [mobileMessage, setMobileMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email ?? "");
    setPreferredLanguage(user.preferredLanguage || "en");
  }, [user]);

  const loadMemberships = useCallback(async () => {
    setMembershipsLoading(true);
    setMembershipsError(null);
    try {
      const rows = await fetchOrganisationMemberships();
      setMemberships(rows);
    } catch (err) {
      setMembershipsError(err instanceof Error ? err.message : t("dashboard.userSettings.loadOrgsError"));
    } finally {
      setMembershipsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      await updateUserProfile(
        {
          name: name.trim(),
          email: email.trim(),
          preferredLanguage,
        },
        activeOrganisationId,
      );
      await refresh(activeOrganisationId, { silent: true });
      setProfileMessage(t("dashboard.userSettings.saved"));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : t("dashboard.userSettings.saveError"));
    } finally {
      setProfileSaving(false);
    }
  };

  const resetMobileFlow = () => {
    setMobileEditOpen(false);
    setNewMobile("");
    setOtpDigits(Array(6).fill(""));
    setVerificationToken("");
    setOtpStep("idle");
    setMobileError(null);
    setMobileMessage(null);
  };

  const handleRequestMobileOtp = async () => {
    const national = normalizeIndianMobileInput(newMobile);
    if (!/^[6-9]\d{9}$/.test(national)) {
      setMobileError(t("login.invalidMobile"));
      return;
    }

    setMobileSaving(true);
    setMobileError(null);
    setMobileMessage(null);
    try {
      const result = await requestMobileChangeOtp(national);
      setVerificationToken(result.verificationToken);
      setOtpStep("otp-sent");
      setMobileMessage(
        formatMessage(t("dashboard.userSettings.otpSentMock"), { otp: MOCK_MOBILE_CHANGE_OTP }),
      );
    } catch (err) {
      setMobileError(err instanceof Error ? err.message : t("dashboard.userSettings.otpError"));
    } finally {
      setMobileSaving(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    const otp = otpDigits.join("");
    if (!/^\d{6}$/.test(otp)) {
      setMobileError(t("login.enterOtpError"));
      return;
    }

    setMobileSaving(true);
    setMobileError(null);
    try {
      await verifyMobileChangeOtp(verificationToken, otp, activeOrganisationId);
      await refresh(activeOrganisationId, { silent: true });
      resetMobileFlow();
      setProfileMessage(t("dashboard.userSettings.mobileUpdated"));
    } catch (err) {
      setMobileError(err instanceof Error ? err.message : t("dashboard.userSettings.otpVerifyError"));
    } finally {
      setMobileSaving(false);
    }
  };

  const handleLeaveOrganisation = async (orgId: string, orgName: string) => {
    const confirmed = window.confirm(
      formatMessage(t("dashboard.userSettings.leaveConfirm"), { name: orgName }),
    );
    if (!confirmed) return;

    setLeavingOrgId(orgId);
    setMembershipsError(null);
    try {
      const profile = await leaveOrganisation(orgId, activeOrganisationId);
      const nextActive = profile.activeOrganisation?.orgId ?? profile.organisations[0]?.orgId;
      if (nextActive) {
        setStoredActiveOrganisationId(nextActive);
      }
      await refresh(nextActive ?? null, { silent: true });
      await loadMemberships();
      setProfileMessage(formatMessage(t("dashboard.userSettings.leftOrg"), { name: orgName }));
    } catch (err) {
      setMembershipsError(
        err instanceof Error ? err.message : t("dashboard.userSettings.leaveError"),
      );
    } finally {
      setLeavingOrgId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-brand-primary-muted">
        {t("common.pleaseWait")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary hover:bg-slate-50"
          aria-label={t("common.back")}
        >
          <BackIcon />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-brand-primary lg:text-2xl">
            {t("dashboard.userSettings.title")}
          </h1>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.userSettings.subtitle")}</p>
        </div>
      </div>

      {(profileMessage || profileError) && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            profileError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {profileError ?? profileMessage}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-brand-primary">
          {t("dashboard.userSettings.personalInfo")}
        </h2>
        <p className="mt-1 text-sm text-brand-primary-muted">
          {t("dashboard.userSettings.personalInfoHint")}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.userSettings.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.userSettings.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("dashboard.userSettings.emailPlaceholder")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.userSettings.mobile")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={user.mobile}
                readOnly
                className={`${inputClass} bg-slate-50`}
              />
              <button
                type="button"
                onClick={() => {
                  setMobileEditOpen((open) => !open);
                  setMobileError(null);
                  setMobileMessage(null);
                }}
                className="shrink-0 rounded-md border border-slate-200/90 px-3 text-sm font-semibold text-brand-primary hover:bg-slate-50"
              >
                {t("dashboard.userSettings.changeMobile")}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.userSettings.language")}
            </label>
            <ModernSelect
              value={preferredLanguage}
              onChange={setPreferredLanguage}
              options={APP_LANGUAGES.map((lang) => ({
                value: lang.code,
                label: `${lang.label} (${lang.native})`,
              }))}
            />
          </div>
        </div>

        {mobileEditOpen ? (
          <div className="mt-4 rounded-lg border border-dashed border-brand-orange-1/40 bg-brand-orange-1/5 p-4">
            <h3 className="text-sm font-semibold text-brand-primary">
              {t("dashboard.userSettings.changeMobileTitle")}
            </h3>
            <p className="mt-1 text-xs text-brand-primary-muted">
              {t("dashboard.userSettings.changeMobileHint")}
            </p>

            {otpStep === "idle" ? (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.userSettings.newMobile")}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={newMobile}
                    onChange={(e) => setNewMobile(normalizeIndianMobileInput(e.target.value))}
                    placeholder="9876543210"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  disabled={mobileSaving}
                  onClick={() => void handleRequestMobileOtp()}
                  className="h-10 rounded-sm bg-brand-orange-1 px-4 text-sm font-semibold text-white hover:bg-brand-orange-1/90 disabled:opacity-50"
                >
                  {mobileSaving ? t("common.pleaseWait") : t("dashboard.userSettings.sendOtp")}
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <OtpInput value={otpDigits} onChange={setOtpDigits} disabled={mobileSaving} />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={mobileSaving}
                    onClick={() => void handleVerifyMobileOtp()}
                    className="h-10 rounded-sm bg-brand-orange-1 px-4 text-sm font-semibold text-white hover:bg-brand-orange-1/90 disabled:opacity-50"
                  >
                    {mobileSaving ? t("common.pleaseWait") : t("dashboard.userSettings.verifyOtp")}
                  </button>
                  <button
                    type="button"
                    onClick={resetMobileFlow}
                    className="h-10 rounded-sm border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            {(mobileError || mobileMessage) && (
              <p
                className={`mt-3 text-sm ${mobileError ? "text-red-600" : "text-emerald-700"}`}
              >
                {mobileError ?? mobileMessage}
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={profileSaving || !name.trim()}
            onClick={() => void handleSaveProfile()}
            className="h-10 rounded-sm bg-brand-orange-1 px-5 text-sm font-semibold text-white hover:bg-brand-orange-1/90 disabled:opacity-50"
          >
            {profileSaving ? t("common.pleaseWait") : t("common.save")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-brand-primary">
          {t("dashboard.userSettings.organisations")}
        </h2>
        <p className="mt-1 text-sm text-brand-primary-muted">
          {t("dashboard.userSettings.organisationsHint")}
        </p>

        {membershipsError ? (
          <p className="mt-4 text-sm text-red-600">{membershipsError}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {membershipsLoading ? (
            <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
          ) : memberships.length === 0 ? (
            <p className="text-sm text-brand-primary-muted">
              {t("dashboard.userSettings.noOrganisations")}
            </p>
          ) : (
            memberships.map((membership) => (
              <div
                key={membership.orgId}
                className="flex flex-col gap-3 rounded-lg border border-slate-200/90 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {membership.logo ? (
                    <Image
                      src={membership.logo}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-md border border-slate-200/90 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-primary/10 text-sm font-bold text-brand-primary">
                      {orgInitials(membership.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-brand-primary">{membership.name}</p>
                      {membership.isDefault ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          {t("dashboard.userSettings.defaultOrg")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-brand-primary-muted">
                      {t("dashboard.userSettings.role")}: {membership.userRole}
                    </p>
                    {!membership.canLeave && membership.leaveBlockedReason ? (
                      <p className="mt-1 text-xs text-amber-700">{membership.leaveBlockedReason}</p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!membership.canLeave || leavingOrgId === membership.orgId}
                  onClick={() => void handleLeaveOrganisation(membership.orgId, membership.name)}
                  className="h-9 shrink-0 rounded-sm border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {leavingOrgId === membership.orgId
                    ? t("common.pleaseWait")
                    : t("dashboard.userSettings.leaveOrg")}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
