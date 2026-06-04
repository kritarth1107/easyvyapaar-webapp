"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";

type OtpInputProps = {
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
};

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function updateDigit(index: number, digit: string) {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    updateDigit(index, digit);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = Array.from({ length: 6 }, (_, i) => pasted[i] ?? "");
    onChange(next);

    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex justify-between gap-2">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="login-input-focus h-12 w-full rounded-xs border border-slate-300/90 bg-white text-center text-lg font-semibold text-brand-primary outline-none transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
      ))}
    </div>
  );
}
