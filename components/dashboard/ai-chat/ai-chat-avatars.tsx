export function AiSparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2l1.2 4.2L17 7.2l-4.2 1.2L12 12l-1.2-4.2L7 7.2l4.2-1.2L12 2z"
        fill="currentColor"
      />
      <path
        d="M19 14l.8 2.8L22 17l-2.8.8L19 20l-.8-2.8L16 17l2.8-.8L19 14z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M5 15l.6 2.1L7.5 18l-2.1.6L5 20.6l-.6-2.1L2.5 18l2.1-.6L5 15z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export function AiAssistantAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div
      className={`${dim} relative flex shrink-0 items-center justify-center rounded-full brand-gradient-orange text-white shadow-md shadow-orange-500/20 ring-2 ring-white`}
    >
      <AiSparkleIcon className={icon} />
    </div>
  );
}

export function UserAvatar({
  size = "md",
  initial,
}: {
  size?: "sm" | "md";
  initial?: string;
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const letter = initial?.trim().charAt(0).toUpperCase() || "";
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white shadow-md ring-2 ring-white`}
    >
      {letter ? (
        <span aria-hidden>{letter}</span>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 opacity-90" aria-hidden>
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}
