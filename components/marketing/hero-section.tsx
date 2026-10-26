import Link from "next/link";
import { HERO } from "@/lib/marketing/site-content";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function CheckCircleIcon({ className = "" }: { className?: string }) {
  // Phosphor "check-circle" (regular)
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden className={className}>
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
    </svg>
  );
}

const NAV = ["Dashboard", "Point of sale", "Sales and billing", "Inventory", "Parties", "Reports", "Staff"];

const CATALOGUE = [
  { name: "Samsung Galaxy A15 128GB", meta: "IMEI tracked", price: "₹11,990" },
  { name: "Tempered screen guard", meta: "42 in stock", price: "₹149" },
  { name: "Silicone back cover", meta: "18 in stock", price: "₹249" },
  { name: "Type C cable 1m", meta: "63 in stock", price: "₹179" },
  { name: "20W fast charger", meta: "27 in stock", price: "₹649" },
];

const CART = [
  { name: "Samsung Galaxy A15 128GB", detail: "HSN 8517 · GST 18%", qty: 1, rate: "₹11,990", amount: "₹14,148.20" },
  { name: "Tempered screen guard", detail: "HSN 3926 · GST 18%", qty: 2, rate: "₹149", amount: "₹351.64" },
  { name: "Silicone back cover", detail: "HSN 3926 · GST 18%", qty: 1, rate: "₹249", amount: "₹293.82" },
];

function Stepper({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-white text-base text-brand-primary">
        −
      </span>
      <span className="flex h-8 min-w-12 items-center justify-center rounded-sm border border-slate-200 bg-white px-2 text-sm font-semibold tabular-nums text-brand-primary">
        {value}
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-white text-base text-brand-primary">
        +
      </span>
    </div>
  );
}

function ProductWindow() {
  return (
    <div
      role="img"
      aria-label="Mahajaan point of sale screen with a cart of three items, GST split, and a bill total of 14,793 rupees 66 paise"
      className="select-none rounded-2xl border border-slate-200 bg-brand-surface p-2 shadow-[0_24px_64px_-32px_rgba(3,31,73,0.4)]"
    >
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* App bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
          <p className="text-xs font-semibold text-brand-primary-muted">Point of sale</p>
          <span className="rounded-sm bg-brand-surface px-2 py-1 text-xs font-semibold text-brand-primary">
            Bill 2026-27/18
          </span>
        </div>

        <div className="grid overflow-hidden lg:h-[480px] lg:grid-cols-[176px_minmax(0,1fr)_368px]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-200 bg-white p-3 lg:block">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li
                  key={item}
                  className={`rounded-sm px-3 py-2 text-sm font-medium ${
                    item === "Point of sale" ? "bg-brand-primary text-white" : "text-brand-primary-muted"
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          {/* Catalogue */}
          <div className="hidden border-r border-slate-200 bg-brand-surface p-4 lg:block">
            <div className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-brand-primary-muted">
              Search item, SKU, or scan barcode
            </div>
            <ul className="mt-4 space-y-2">
              {CATALOGUE.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-primary">{item.name}</p>
                    <p className="text-xs text-brand-primary-muted">{item.meta}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-brand-primary">{item.price}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Cart */}
          <div className="flex flex-col bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-primary">Cart</p>
              <p className="text-xs text-brand-primary-muted">Walk in customer</p>
            </div>

            <ul className="mt-3 space-y-2">
              {CART.map((line) => (
                <li key={line.name} className="rounded-sm border border-slate-200 bg-brand-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-primary">{line.name}</p>
                      <p className="text-xs text-brand-primary-muted">{line.detail}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-brand-primary">{line.amount}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <Stepper value={String(line.qty)} />
                    <span className="text-xs text-brand-primary-muted">at</span>
                    <Stepper value={line.rate} />
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm lg:mt-auto">
              <div className="flex justify-between text-brand-primary-muted">
                <dt>Taxable value</dt>
                <dd className="tabular-nums">₹12,537.00</dd>
              </div>
              <div className="flex justify-between text-brand-primary-muted">
                <dt>CGST 9%</dt>
                <dd className="tabular-nums">₹1,128.33</dd>
              </div>
              <div className="flex justify-between text-brand-primary-muted">
                <dt>SGST 9%</dt>
                <dd className="tabular-nums">₹1,128.33</dd>
              </div>
              <div className="flex items-center justify-between pt-2 text-base font-semibold text-brand-primary">
                <dt>Total</dt>
                <dd className="tabular-nums">₹14,793.66</dd>
              </div>
            </dl>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
              {["Cash", "UPI", "Card", "Credit"].map((mode) => (
                <span
                  key={mode}
                  className={`rounded-sm border px-2 py-2 ${
                    mode === "UPI"
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-slate-200 bg-white text-brand-primary"
                  }`}
                >
                  {mode}
                </span>
              ))}
            </div>
            <span className="mt-3 flex items-center justify-center rounded-sm bg-brand-orange-2 px-4 py-3 text-base font-semibold text-white">
              Save bill ₹14,793.66
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white font-sans">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:pb-24 lg:pt-24">
        <div className="mx-auto flex flex-col items-center text-center">
          <h1
            className="hero-rise max-w-[680px] text-balance bg-[linear-gradient(90deg,#000000,#666666)] bg-clip-text pb-1 text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "0ms" }}
          >
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p
            className="hero-rise mt-6 max-w-[680px] text-pretty text-base text-brand-primary-muted sm:text-lg"
            style={{ animationDelay: "60ms" }}
          >
            {HERO.subtitle}
          </p>

          <div
            className="hero-rise mt-8 flex flex-col items-center gap-4 sm:flex-row"
            style={{ animationDelay: "120ms" }}
          >
            <Link
              href="/auth/register"
              className={`inline-flex items-center justify-center rounded-lg bg-brand-orange-2 px-6 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-300 ${EASE} hover:bg-brand-orange-1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-2 focus-visible:ring-offset-2`}
            >
              {HERO.cta}
            </Link>
            <p className="flex items-center gap-2 text-sm text-brand-primary-muted">
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-brand-primary" />
              {HERO.proof}
            </p>
          </div>
        </div>

        <div className="hero-rise mx-auto mt-16 max-w-5xl" style={{ animationDelay: "180ms" }}>
          <ProductWindow />
          <p className="mt-3 text-center text-xs text-brand-primary-muted">{HERO.visualNote}</p>
        </div>
      </div>
    </section>
  );
}
