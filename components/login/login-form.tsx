"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { useCallback, useRef, useState } from "react";
import { OtpInput } from "./otp-input";
import { useTranslation } from "@/lib/localization";
import { normalizeIndianMobileInput } from "@/lib/validators/indian-mobile";
import {
  AUTH_ERROR_USER_NOT_FOUND,
  type ApiErrorResponse,
  type GetOtpSuccessResponse,
  type VerifyOtpSuccessResponse,
  isApiErrorResponse,
} from "@/lib/types/auth-api";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [mobileLocked, setMobileLocked] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const lastOtpRequestRef = useRef<string | null>(null);

  const isValidMobile = INDIAN_MOBILE_REGEX.test(mobile);
  const otpValue = otpDigits.join("");

  const resetOtpFlow = useCallback(() => {
    setOtpSent(false);
    setMobileLocked(false);
    setVerificationToken("");
    setOtpDigits(Array(6).fill(""));
    setSuccessMessage(null);
    setError(null);
    lastOtpRequestRef.current = null;
  }, []);

  const requestOtp = useCallback(
    async (nationalMobile: string) => {
      if (lastOtpRequestRef.current === nationalMobile && otpSent) return;

      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const res = await fetch("/api/authentication/login/get-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: nationalMobile }),
        });

        const data: unknown = await res.json();

        if (res.status === 404 && isApiErrorResponse(data)) {
          if (data.error.errorCode === AUTH_ERROR_USER_NOT_FOUND) {
            router.push(`/auth/register?mobile=${nationalMobile}`);
            return;
          }
        }

        if (!res.ok) {
          const message = isApiErrorResponse(data)
            ? data.error.details ?? data.message
            : (data as { error?: string })?.error ?? t("login.getOtp");
          setError(message);
          lastOtpRequestRef.current = null;
          return;
        }

        const success = data as GetOtpSuccessResponse;
        if (!success.success || !success.data?.verificationToken) {
          setError("Unexpected response from server");
          lastOtpRequestRef.current = null;
          return;
        }

        lastOtpRequestRef.current = nationalMobile;
        setVerificationToken(success.data.verificationToken);
        setOtpSent(true);
        setMobileLocked(true);
        setSuccessMessage(success.details || success.message);
      } catch {
        setError(t("common.networkError"));
        lastOtpRequestRef.current = null;
      } finally {
        setLoading(false);
      }
    },
    [otpSent, router, t]
  );

  function handleEditMobile() {
    resetOtpFlow();
  }

  function handleMobileChange(value: string) {
    if (mobileLocked) return;
    setMobile(normalizeIndianMobileInput(value));
    setError(null);
    setSuccessMessage(null);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!verificationToken || otpValue.length !== 6) {
      setError(t("login.enterOtpError"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/authentication/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationToken, otp: otpValue }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message = isApiErrorResponse(data)
          ? data.error.details ?? data.message
          : (data as { error?: string })?.error ?? t("login.loginFailed");
        setError(message);
        return;
      }

      const success = data as VerifyOtpSuccessResponse;
      if (!success.success) {
        setError(t("login.loginFailed"));
        return;
      }

      router.push("/dashboard?utm=login");
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otpSent) {
      void handleVerifyOtp(e);
      return;
    }
    if (isValidMobile) {
      void requestOtp(mobile);
    } else {
      setError(t("login.invalidMobile"));
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center border-l border-slate-200/80 bg-white px-6 py-10 sm:px-8 lg:w-[38%] lg:px-10 xl:px-12">
      <div className="w-full max-w-sm">
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

        <p className="text-xs font-bold uppercase tracking-widest text-brand-orange-2">
          {t("login.signIn")}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-primary xl:text-2xl">
          {t("login.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t("login.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="mobile" className="block text-sm font-semibold text-brand-primary">
              {t("login.mobileLabel")}
            </label>
            {mobileLocked && (
              <button
                type="button"
                onClick={handleEditMobile}
                className="login-link inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                aria-label="Edit mobile number"
              >
                <PencilIcon />
                {t("login.editMobile")}
              </button>
            )}
          </div>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-primary-light">
              +91
            </span>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={mobile}
              disabled={mobileLocked || loading}
              onChange={(e) => handleMobileChange(e.target.value)}
              onInput={(e) => handleMobileChange(e.currentTarget.value)}
              className="login-input-focus w-full rounded-xs border border-slate-300/90 bg-white py-3 pl-14 pr-4 text-base text-brand-primary placeholder:text-slate-400 outline-none transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {otpSent && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-brand-primary">
                {t("login.enterOtp")}
              </label>
              <OtpInput
                value={otpDigits}
                onChange={setOtpDigits}
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {successMessage && !error && (
            <p className="mt-4 text-sm text-brand-primary-mid" role="status">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (!otpSent && !isValidMobile) ||
              (otpSent && otpValue.length !== 6)
            }
            className="login-btn-primary mt-5 w-full rounded-xs px-4 py-3.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? t("common.pleaseWait")
              : otpSent
                ? t("login.verifyLogin")
                : t("login.getOtp")}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-600">
          {t("login.trouble")}{" "}
          <Link href="#" className="login-link font-semibold hover:underline">
            {t("login.getHelp")}
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">{t("common.or")}</p>

        <p className="mt-4 text-center text-xs">
          <Link href="/auth/register" className="login-link font-semibold hover:underline">
            {t("login.createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
