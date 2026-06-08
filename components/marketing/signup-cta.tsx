import Link from "next/link";

export function SignupCta({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";

  return (
    <div className={`flex w-full max-w-md flex-col gap-3 sm:flex-row ${className}`}>
      <div
        className={`flex h-12 flex-1 items-center rounded-sm border px-4 text-sm ${
          isDark
            ? "border-white/20 bg-white/10 text-white placeholder:text-white/50"
            : "border-slate-200 bg-white text-brand-primary shadow-sm"
        }`}
      >
        <span className={isDark ? "text-white/70" : "text-brand-primary-muted"}>+91</span>
        <span className={`mx-2 ${isDark ? "text-white/30" : "text-slate-300"}`}>|</span>
        <span className={isDark ? "text-white/50" : "text-brand-primary-muted/70"}>
          Mobile number
        </span>
      </div>
      <Link
        href="/auth/register"
        className={`inline-flex h-12 shrink-0 items-center justify-center rounded-sm px-6 text-sm font-semibold transition-opacity hover:opacity-90 ${
          isDark
            ? "bg-white text-brand-primary"
            : "brand-gradient-orange-h text-white shadow-md shadow-brand-orange-1/25"
        }`}
      >
        Sign up free →
      </Link>
    </div>
  );
}
