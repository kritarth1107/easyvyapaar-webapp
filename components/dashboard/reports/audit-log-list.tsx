"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  fetchAuditLogs,
  formatAuditValue,
  type AuditAction,
  type AuditEntityType,
  type AuditLogEntry,
  type AuditLogQuery,
} from "@/lib/reports/audit-log-api-client";
import { useTranslation, type TranslationKey } from "@/lib/localization";
import { useOrganisationPermissions } from "@/components/providers/organisation-permissions-provider";

const ACTION_KEYS: Record<AuditAction, TranslationKey> = {
  create: "dashboard.auditLog.actionCreate",
  edit: "dashboard.auditLog.actionEdit",
  delete: "dashboard.auditLog.actionDelete",
  cancel: "dashboard.auditLog.actionCancel",
  mark_unpaid: "dashboard.auditLog.actionMarkUnpaid",
  payment: "dashboard.auditLog.actionPayment",
  convert: "dashboard.auditLog.actionConvert",
};

export const ENTITY_KEYS: Record<AuditEntityType, TranslationKey> = {
  sales_invoice: "dashboard.auditLog.entitySalesInvoice",
  purchase_bill: "dashboard.auditLog.entityPurchaseBill",
  inventory_item: "dashboard.auditLog.entityItem",
  party: "dashboard.auditLog.entityParty",
  purchase_return: "dashboard.auditLog.entityPurchaseReturn",
  proforma: "dashboard.auditLog.entityProforma",
  organisation: "dashboard.auditLog.entityOrganisation",
};

const ACTION_STYLES: Record<AuditAction, string> = {
  create: "bg-emerald-50 text-emerald-800",
  edit: "bg-blue-50 text-blue-800",
  delete: "bg-red-50 text-red-800",
  cancel: "bg-amber-50 text-amber-900",
  mark_unpaid: "bg-violet-50 text-violet-800",
  payment: "bg-teal-50 text-teal-800",
  convert: "bg-indigo-50 text-indigo-800",
};

function entityHref(entry: AuditLogEntry): string | null {
  if (entry.action === "delete" || !entry.entityId) return null;
  if (entry.entityType === "sales_invoice") return `/dashboard/sales/invoices/${encodeURIComponent(entry.entityId)}`;
  const id = encodeURIComponent(entry.entityId);
  switch (entry.entityType) {
    case "purchase_bill":
      return `/dashboard/purchases/${id}`;
    case "inventory_item":
      return `/dashboard/inventory/items/${id}`;
    case "party":
      return `/dashboard/parties/${id}`;
    case "proforma":
      return `/dashboard/sales/proforma-invoices/${id}`;
    case "purchase_return":
      return "/dashboard/purchases/purchase-returns"; // no detail page yet
    case "organisation":
      return "/dashboard/settings/business-profile";
    default:
      return null;
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Audit trail list. With entityType+entityId it is a per-document History tab;
 * otherwise it renders whatever the filters select (org-level screen).
 */
export function AuditLogList({
  filters,
  showEntity = true,
  pageSize = 25,
}: {
  filters: Omit<AuditLogQuery, "page" | "limit">;
  showEntity?: boolean;
  pageSize?: number;
}) {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const filterKey = JSON.stringify(filters);

  const load = useCallback(
    async (targetPage: number) => {
      const orgId = activeOrganisationId?.trim();
      if (!orgId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAuditLogs(orgId, {
          ...(JSON.parse(filterKey) as AuditLogQuery),
          page: targetPage,
          limit: pageSize,
        });
        setItems(result.items);
        setTotalPages(result.pagination.totalPages);
        setPage(result.pagination.page);
      } catch (err) {
        setItems([]);
        setError(err instanceof Error ? err.message : t("dashboard.auditLog.loadError"));
      } finally {
        setLoading(false);
      }
    },
    [activeOrganisationId, filterKey, pageSize, t],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="rounded-sm border border-slate-200/90 bg-white">
      {error ? <p className="border-b border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {loading ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">{t("common.pleaseWait")}</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">{t("dashboard.auditLog.empty")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((entry) => {
            const href = showEntity ? entityHref(entry) : null;
            const isOpen = expanded === entry.auditLogId;
            return (
              <li key={entry.auditLogId} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase ${ACTION_STYLES[entry.action]}`}>
                    {t(ACTION_KEYS[entry.action])}
                  </span>
                  {showEntity ? (
                    <span className="text-brand-primary-muted">{t(ENTITY_KEYS[entry.entityType])}</span>
                  ) : null}
                  {showEntity ? (
                    href ? (
                      <Link href={href} className="font-semibold text-brand-primary hover:underline">
                        {entry.entityLabel ?? entry.entityId}
                      </Link>
                    ) : (
                      <span className="font-semibold text-brand-primary">{entry.entityLabel ?? entry.entityId}</span>
                    )
                  ) : null}
                  <span className="ml-auto text-xs text-brand-primary-muted">
                    {entry.actorName ?? entry.actorUserId} · {formatWhen(entry.createdAt)}
                  </span>
                </div>
                {entry.note ? <p className="mt-1 text-xs text-brand-primary-mid">{entry.note}</p> : null}
                {entry.changes.length > 0 ? (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : entry.auditLogId)}
                      className="text-xs font-semibold text-brand-primary hover:underline"
                    >
                      {t("dashboard.auditLog.changes").replace("{count}", String(entry.changes.length))}
                      {isOpen ? " ▲" : " ▼"}
                    </button>
                    {isOpen ? (
                      <table className="mt-2 w-full text-xs">
                        <thead>
                          <tr className="text-left text-[10px] uppercase text-brand-primary-muted">
                            <th className="py-1 pr-2">{t("dashboard.auditLog.colField")}</th>
                            <th className="py-1 pr-2">{t("dashboard.auditLog.colBefore")}</th>
                            <th className="py-1">{t("dashboard.auditLog.colAfter")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.changes.map((change) => (
                            <tr key={change.path} className="border-t border-slate-100 align-top">
                              <td className="py-1 pr-2 font-mono">{change.path}</td>
                              <td className="break-all py-1 pr-2 text-red-700">{formatAuditValue(change.before)}</td>
                              <td className="break-all py-1 text-emerald-700">{formatAuditValue(change.after)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs">
          <span className="text-brand-primary-muted">
            {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => void load(page - 1)}
              className="h-8 rounded-sm border border-slate-200 px-3 font-semibold text-brand-primary disabled:opacity-50"
            >
              ←
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => void load(page + 1)}
              className="h-8 rounded-sm border border-slate-200 px-3 font-semibold text-brand-primary disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Collapsible "History" panel for a single document (invoice / purchase bill / item). */
export function DocumentHistoryPanel({ entityType, entityId }: { entityType: AuditEntityType; entityId: string }) {
  const { t } = useTranslation();
  const { can, loading } = useOrganisationPermissions();
  const [open, setOpen] = useState(false);
  // audit.read: Owner, Admin, CA. Hidden (not disabled) for everyone else.
  if (loading || !can("audit.read")) return null;
  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-brand-primary"
      >
        {t("dashboard.auditLog.historyTab")} {open ? "▲" : "▼"}
      </button>
      {open ? <AuditLogList filters={{ entityType, entityId }} showEntity={false} pageSize={20} /> : null}
    </section>
  );
}
