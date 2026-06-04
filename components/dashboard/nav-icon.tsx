import type { DashboardNavIconId } from "@/lib/dashboard/navigation";

type NavIconProps = {
  id: DashboardNavIconId;
  className?: string;
};

export function NavIcon({ id, className = "h-[18px] w-[18px]" }: NavIconProps) {
  const cn = className;

  switch (id) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pos":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M6 8h12M6 8a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2M6 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "sales":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M8 4h8l1 4H7l1-4zM6 8h12v11a1 1 0 01-1 1H7a1 1 0 01-1-1V8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 12h4M10 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "parties":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6M16 7.5a2.5 2.5 0 110 5M21 20c0-2.5-1.5-4.5-4-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "inventory":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4M4 17l8 4 8-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "purchases":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M4 6h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M4 10h16M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "payments":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "expenses":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path d="M5 19V5M5 19h14M9 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "staff":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "document":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M8 4h6l4 4v12a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 4v4h4M10 13h4M10 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path d="M6 18V10M12 18V6M18 18v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "warehouse":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M3 10l9-5 9 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <path
            d="M4 8h16a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M17 12h3M4 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cn} aria-hidden>
          <circle cx="10" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 19c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M17 10h4M17 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
