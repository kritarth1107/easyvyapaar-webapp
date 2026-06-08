import { CustomerWhatsappAutoplay } from "@/components/marketing/customer-whatsapp-autoplay";
import {
  AI_FEATURES_CUSTOMER,
  AI_FEATURES_RETAILER,
  AI_FEATURES_SECTION,
} from "@/lib/marketing/site-content";

function RetailerCard({
  title,
  description,
  example,
}: {
  title: string;
  description: string;
  example: string;
}) {
  return (
    <div className="rounded-sm border border-slate-200/90 bg-white p-4 shadow-sm">
      <h3 className="font-bold text-brand-primary">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-brand-primary-muted">{description}</p>
      <p className="mt-3 rounded-sm bg-brand-surface px-3 py-2 text-xs font-medium text-brand-primary">
        <span className="text-brand-orange-2">→</span> {example}
      </p>
    </div>
  );
}

export function AiFeaturesSection() {
  return (
    <section className="relative overflow-hidden border-y border-slate-200/80 bg-brand-surface py-16 sm:py-20">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-brand-orange-1/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">
            {AI_FEATURES_SECTION.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-brand-primary sm:text-4xl">{AI_FEATURES_SECTION.title}</h2>
          <p className="mt-4 text-base leading-8 text-brand-primary-muted">{AI_FEATURES_SECTION.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm brand-gradient-orange text-sm font-bold text-white">
                You
              </div>
              <div>
                <p className="text-sm font-bold text-brand-primary">Shop owner & staff</p>
                <p className="text-xs text-brand-primary-muted">Chat, dashboard, Hindi & English</p>
              </div>
            </div>
            <div className="space-y-3">
              {AI_FEATURES_RETAILER.map((item) => (
                <RetailerCard key={item.title} {...item} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#25D366] text-lg text-white">
                WA
              </div>
              <div>
                <p className="text-sm font-bold text-brand-primary">Your customers</p>
                <p className="text-xs text-brand-primary-muted">
                  Priya orders on WhatsApp — pay, bill, review. Amit gets auto reminder.
                </p>
              </div>
            </div>

            <CustomerWhatsappAutoplay />

            <ul className="mt-4 space-y-2">
              {AI_FEATURES_CUSTOMER.map((item) => (
                <li key={item.title} className="flex gap-2 text-xs text-brand-primary-muted">
                  <span className="font-bold text-[#25D366]">✓</span>
                  <span>
                    <strong className="text-brand-primary">{item.title}</strong> — {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "For you", value: "Manage by chat", hint: "Sales, stock, khata, bills" },
            { label: "For customers", value: "Stay on WhatsApp", hint: "Order, pay, ask, review" },
            { label: "Under the hood", value: "One ERP", hint: "Same stock & ledger everywhere" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm border border-slate-200/90 bg-white px-4 py-4 text-center shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary-muted">{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-brand-primary">{stat.value}</p>
              <p className="mt-0.5 text-xs text-brand-primary-muted">{stat.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
