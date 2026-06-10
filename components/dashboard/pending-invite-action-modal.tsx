"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { OtpInput } from "@/components/login/otp-input";
import { useTranslation } from "@/lib/localization";
import {
  acceptOrganisationInvite,
  declineOrganisationInvite,
  requestInviteActionOtp,
  type PendingInvite,
} from "@/lib/permissions/team-api-client";

type PendingInviteActionModalProps = {
  open: boolean;
  invite: PendingInvite | null;
  action: "accept" | "decline" | null;
  onClose: () => void;
  onComplete: () => void;
};

export function PendingInviteActionModal({
  open,
  invite,
  action,
  onClose,
  onComplete,
}: PendingInviteActionModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !invite || !action) {
      setVerificationToken("");
      setOtpDigits(Array(6).fill(""));
      setOtpHint(null);
      setError(null);
      setLoading(false);
      setSendingOtp(false);
      return;
    }

    let cancelled = false;
    setSendingOtp(true);
    setError(null);
    void requestInviteActionOtp(invite.organisationId, action)
      .then((result) => {
        if (cancelled) return;
        setVerificationToken(result.verificationToken);
        setOtpHint(result.details ?? t("dashboard.teamSettings.inviteActionOtpHint"));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("dashboard.teamSettings.otpError"));
        }
      })
      .finally(() => {
        if (!cancelled) setSendingOtp(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, invite, action, t]);

  const handleConfirm = async () => {
    if (!invite || !action || !verificationToken) return;
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError(t("dashboard.teamSettings.otpIncomplete"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (action === "accept") {
        await acceptOrganisationInvite(invite.organisationId, verificationToken, otp);
      } else {
        await declineOrganisationInvite(invite.organisationId, verificationToken, otp);
      }
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.teamSettings.otpVerifyError"));
    } finally {
      setLoading(false);
    }
  };

  if (!open || !mounted || !invite || !action) return null;

  const title =
    action === "accept"
      ? t("dashboard.teamSettings.acceptInviteTitle")
      : t("dashboard.teamSettings.declineInviteTitle");

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200/90 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-brand-primary">{title}</h3>
        <p className="mt-2 text-sm text-brand-primary-muted">
          {invite.organisationName} · {invite.role}
        </p>

        {sendingOtp ? (
          <p className="mt-4 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
        ) : (
          <>
            {otpHint ? (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-brand-primary-muted">
                {otpHint}
              </p>
            ) : null}
            <div className="mt-4">
              <label className="mb-3 block text-center text-sm font-semibold text-brand-primary">
                {t("dashboard.teamSettings.enterOtp")}
              </label>
              <OtpInput value={otpDigits} onChange={setOtpDigits} disabled={loading} />
            </div>
          </>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading || sendingOtp || !verificationToken}
            className="h-10 flex-1 rounded-xl bg-brand-primary text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {loading
              ? t("common.pleaseWait")
              : action === "accept"
                ? t("dashboard.teamSettings.confirmAccept")
                : t("dashboard.teamSettings.confirmDecline")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
