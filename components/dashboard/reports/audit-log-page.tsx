"use client";

import { useState } from "react";
import { AuditLogList, ENTITY_KEYS } from "@/components/dashboard/reports/audit-log-list";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
} from "@/lib/reports/audit-log-api-client";
import { useTranslation, type TranslationKey } from "@/lib/localization";
import { useOrganisationPermissions } from "@/components/providers/organisation-permissions-provider";

const ACTION_LABEL_KEYS: Record<AuditAction, TranslationKey> = {
  create: "dashboard.auditLog.actionCreate",
  edit: "dashboard.auditLog.actionEdit",
  delete: "dashboard.auditLog.actionDelete",
  cancel: "dashboard.auditLog.actionCancel",
  mark_unpaid: "dashboard.auditLog.actionMarkUnpaid",
  payment: "dashboard.auditLog.actionPayment",
  convert: "dashboard.auditLog.actionConvert",
};

const selectClass = "h-9 rounded-sm border border-slate-200 bg-white px-2 text-sm text-brand-primary";

export function AuditLogPage() {
  const { t } = useTranslation();
  const [entityType, setEntityType] = useState<AuditEntityType | "">("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { can, loading } = useOrganisationPermissions();

  if (loading) return null;
  if (!can("audit.read")) {
    return (
      <div className="p-4 lg:p-6">
        <h2 className="text-xl font-bold tracking-tight text-brand-primary">{t("dashboard.auditLog.title")}</h2>
        <p className="mt-2 text-sm text-brand-primary-muted">{t("dashboard.auditLog.noAccess")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">{t("dashboard.auditLog.title")}</h2>
        <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.auditLog.subtitle")}</p>
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-sm border border-slate-200/90 bg-white p-3">
        <label className="text-xs font-semibold text-brand-primary-muted">
          <span className="mb-1 block">{t("dashboard.auditLog.filterEntity")}</span>
          <select className={selectClass} value={entityType} onChange={(e) => setEntityType(e.target.value as AuditEntityType | "")}>
            <option value="">{t("dashboard.auditLog.all")}</option>
            {AUDIT_ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(ENTITY_KEYS[type])}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-brand-primary-muted">
          <span className="mb-1 block">{t("dashboard.auditLog.filterAction")}</span>
          <select className={selectClass} value={action} onChange={(e) => setAction(e.target.value as AuditAction | "")}>
            <option value="">{t("dashboard.auditLog.all")}</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {t(ACTION_LABEL_KEYS[a])}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-brand-primary-muted">
          <span className="mb-1 block">{t("dashboard.auditLog.fromDate")}</span>
          <input type="date" className={selectClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-brand-primary-muted">
          <span className="mb-1 block">{t("dashboard.auditLog.toDate")}</span>
          <input type="date" className={selectClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
      </div>
      <AuditLogList
        filters={{
          ...(entityType ? { entityType } : {}),
          ...(action ? { action } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        }}
      />
    </div>
  );
}
