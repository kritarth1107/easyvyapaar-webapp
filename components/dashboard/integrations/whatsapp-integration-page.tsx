"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/lib/localization";

function buildWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!base) return "/api/v1/whatsapp/webhook";
  return `${base.replace(/\/$/, "")}/whatsapp/webhook`;
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(value)}
      className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-primary hover:bg-slate-50"
    >
      Copy
    </button>
  );
}

export function WhatsAppIntegrationPage() {
  const { t } = useTranslation();
  const webhookUrl = useMemo(() => buildWebhookUrl(), []);

  const envVars = [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_APP_SECRET",
    "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
    "WHATSAPP_API_VERSION",
    "LIVE_FRONTEND_URL",
  ];

  const commands = [
    { label: "Hi / Hello", desc: t("dashboard.whatsappIntegration.cmdHi") },
    { label: "change shop", desc: t("dashboard.whatsappIntegration.cmdChangeShop") },
    { label: "new chat", desc: t("dashboard.whatsappIntegration.cmdNewChat") },
    { label: "help", desc: t("dashboard.whatsappIntegration.cmdHelp") },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-10 lg:p-6">
      <div>
        <Link
          href="/dashboard"
          className="text-xs font-medium text-brand-primary-muted hover:text-brand-primary"
        >
          ← {t("common.back")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-brand-primary">
          {t("dashboard.whatsappIntegration.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t("dashboard.whatsappIntegration.subtitle")}
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5">
        <h2 className="text-sm font-semibold text-emerald-900">
          {t("dashboard.whatsappIntegration.liveBadge")}
        </h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          {t("dashboard.whatsappIntegration.liveHint")}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-primary">
          {t("dashboard.whatsappIntegration.webhookTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {t("dashboard.whatsappIntegration.webhookDesc")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <code className="min-w-0 flex-1 break-all text-xs text-brand-primary">{webhookUrl}</code>
          <CopyButton value={webhookUrl} />
        </div>
        <ol className="mt-4 space-y-2 text-sm text-slate-600 list-decimal pl-5">
          <li>{t("dashboard.whatsappIntegration.stepMetaApp")}</li>
          <li>{t("dashboard.whatsappIntegration.stepCallback")}</li>
          <li>{t("dashboard.whatsappIntegration.stepVerifyToken")}</li>
          <li>{t("dashboard.whatsappIntegration.stepSubscribe")}</li>
          <li>{t("dashboard.whatsappIntegration.stepAppSecret")}</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-primary">
          {t("dashboard.whatsappIntegration.envTitle")}
        </h2>
        <ul className="mt-3 space-y-1.5">
          {envVars.map((key) => (
            <li key={key} className="font-mono text-xs text-slate-700">{key}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-primary">
          {t("dashboard.whatsappIntegration.userFlowTitle")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>{t("dashboard.whatsappIntegration.flowUnregistered")}</li>
          <li>{t("dashboard.whatsappIntegration.flowRegistered")}</li>
          <li>{t("dashboard.whatsappIntegration.flowMultiOrg")}</li>
          <li>{t("dashboard.whatsappIntegration.flowAi")}</li>
        </ul>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Command</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-brand-primary">{row.label}</td>
                  <td className="px-3 py-2 text-slate-600">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-primary">
          {t("dashboard.whatsappIntegration.testTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t("dashboard.whatsappIntegration.testDesc")}</p>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 list-decimal pl-5">
          <li>{t("dashboard.whatsappIntegration.testStep1")}</li>
          <li>{t("dashboard.whatsappIntegration.testStep2")}</li>
          <li>{t("dashboard.whatsappIntegration.testStep3")}</li>
        </ol>
      </section>
    </div>
  );
}
