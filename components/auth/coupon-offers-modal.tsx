"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PlanCouponExploreItem } from "@/lib/types/auth-api";

type CouponOffersModalProps = {
  open: boolean;
  coupons: PlanCouponExploreItem[];
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  appliedCouponCode?: string | null;
  busy?: boolean;
  onClose: () => void;
  onApply: (couponCode: string) => void;
};

export function CouponOffersModal({
  open,
  coupons,
  couponInput,
  onCouponInputChange,
  appliedCouponCode,
  busy,
  onClose,
  onApply,
}: CouponOffersModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const applyCode = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || busy) return;
    onCouponInputChange(normalized);
    onApply(normalized);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close offers"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-offers-title"
        className="relative w-full max-w-lg overflow-hidden rounded-xs border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-brand-surface/50 px-6 py-5">
          <div>
            <h2 id="coupon-offers-title" className="text-lg font-bold text-brand-primary">
              Available offers
            </h2>
            <p className="mt-0.5 text-sm text-brand-primary-muted">
              Enter a code or tap an offer below
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xs p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => onCouponInputChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCode(couponInput);
              }}
              placeholder="Enter coupon code"
              disabled={busy}
              className="min-w-0 flex-1 rounded-xs border border-slate-300 px-3 py-2.5 text-sm font-mono uppercase tracking-wide text-brand-primary outline-none focus:border-brand-orange-1 disabled:opacity-60"
            />
            <button
              type="button"
              disabled={busy || !couponInput.trim()}
              onClick={() => applyCode(couponInput)}
              className="shrink-0 rounded-xs border border-brand-primary bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="max-h-[min(52vh,400px)] space-y-3 overflow-y-auto p-5 scrollbar-brand">
          {coupons.map((coupon) => {
            const isApplied = appliedCouponCode === coupon.couponCode;
            const canApply = coupon.isEligible && !busy && !isApplied;

            return (
              <button
                key={coupon.couponCode}
                type="button"
                disabled={!canApply}
                onClick={() => applyCode(coupon.couponCode)}
                className={`w-full rounded-xs border px-4 py-4 text-left transition ${
                  isApplied
                    ? "border-emerald-200 bg-emerald-50/70"
                    : coupon.isEligible
                      ? "border-slate-200 bg-white hover:border-brand-orange-1/60 hover:bg-brand-surface/50"
                      : "border-slate-100 bg-slate-50/50"
                } disabled:cursor-default`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-xs bg-brand-orange-2/10 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand-orange-2">
                    {coupon.couponCode}
                  </span>
                  <span
                    className={`shrink-0 rounded-xs px-2.5 py-0.5 text-xs font-bold ${
                      coupon.isEligible
                        ? "bg-brand-primary text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {coupon.discountLabel}
                  </span>
                </div>

                <p className="mt-2.5 text-sm font-semibold text-brand-primary">{coupon.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-snug text-brand-primary-muted">
                  {coupon.description}
                </p>

                {isApplied ? (
                  <p className="mt-2.5 text-xs font-semibold text-emerald-700">Applied</p>
                ) : coupon.isEligible ? (
                  <p className="mt-2.5 text-xs font-semibold text-brand-orange-2">Tap to apply</p>
                ) : (
                  <p className="mt-2.5 text-xs text-brand-primary-muted">
                    {coupon.reason ?? "Not eligible for your selection"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
