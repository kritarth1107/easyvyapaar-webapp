export const AUDIT_ENTITY_TYPES = [
  "sales_invoice",
  "purchase_bill",
  "inventory_item",
  "party",
  "purchase_return",
  "proforma",
  "organisation",
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];
export const AUDIT_ACTIONS = ["create", "edit", "delete", "cancel", "mark_unpaid", "payment", "convert"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditFieldChange = { path: string; before?: unknown; after?: unknown };

export type AuditLogEntry = {
  auditLogId: string;
  actorUserId: string;
  actorName?: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel?: string;
  action: AuditAction;
  note?: string;
  changes: AuditFieldChange[];
  createdAt: string;
};

export type AuditLogQuery = {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  actorUserId?: string;
  fromDate?: string;
  toDate?: string;
  includeSnapshots?: boolean;
  page?: number;
  limit?: number;
};

export type AuditLogPage = {
  items: AuditLogEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normaliseEntry(raw: unknown): AuditLogEntry | null {
  const row = asRecord(raw);
  if (!row) return null;
  const auditLogId = str(row.auditLogId);
  const entityType = str(row.entityType) as AuditEntityType | undefined;
  const action = str(row.action) as AuditAction | undefined;
  const createdAt = str(row.createdAt);
  if (!auditLogId || !entityType || !action || !createdAt) return null;
  return {
    auditLogId,
    actorUserId: str(row.actorUserId) ?? "",
    ...(str(row.actorName) && { actorName: str(row.actorName) }),
    entityType,
    entityId: str(row.entityId) ?? "",
    ...(str(row.entityLabel) && { entityLabel: str(row.entityLabel) }),
    action,
    ...(str(row.note) && { note: str(row.note) }),
    changes: Array.isArray(row.changes)
      ? row.changes.flatMap((change) => {
          const c = asRecord(change);
          return c && typeof c.path === "string" ? [{ path: c.path, before: c.before, after: c.after }] : [];
        })
      : [],
    createdAt,
  };
}

export async function fetchAuditLogs(organisationId: string, query: AuditLogQuery = {}): Promise<AuditLogPage> {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || value === null) continue;
    search.set(key, String(value));
  }
  const res = await fetch(`/api/reports/audit-logs?${search.toString()}`);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = str(asRecord(body)?.error);
    throw new Error(message ?? "Failed to load audit log");
  }
  const data = asRecord(asRecord(body)?.data) ?? asRecord(body);
  const items = Array.isArray(data?.items) ? data.items : [];
  const p = asRecord(data?.pagination);
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return {
    items: items.map(normaliseEntry).filter((e): e is AuditLogEntry => e !== null),
    pagination: {
      page: num(p?.page, 1),
      limit: num(p?.limit, items.length),
      total: num(p?.total, items.length),
      totalPages: num(p?.totalPages, items.length ? 1 : 0),
    },
  };
}

/** Compact display of a before/after value. */
export function formatAuditValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > 140 ? `${json.slice(0, 140)}…` : json;
  } catch {
    return String(value);
  }
}
