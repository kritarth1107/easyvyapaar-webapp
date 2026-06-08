"use client";

import type { TranslationKey } from "@/lib/localization";
import {
  INVITABLE_ROLES,
  PERMISSIONS,
  getPermissionFlags,
  type Permission,
  type UserRole,
} from "@/lib/permissions/role-permissions";

export const ROLE_LABEL_KEYS: Record<UserRole, TranslationKey> = {
  Owner: "dashboard.teamSettings.roles.owner",
  Admin: "dashboard.teamSettings.roles.admin",
  Manager: "dashboard.teamSettings.roles.manager",
  CA: "dashboard.teamSettings.roles.ca",
  Accountant: "dashboard.teamSettings.roles.accountant",
  Cashier: "dashboard.teamSettings.roles.cashier",
  Staff: "dashboard.teamSettings.roles.staff",
  InventoryManager: "dashboard.teamSettings.roles.inventoryManager",
  Salesperson: "dashboard.teamSettings.roles.salesperson",
};

export const ROLE_DESC_KEYS: Record<Exclude<UserRole, "Owner">, TranslationKey> = {
  Admin: "dashboard.teamSettings.roleDesc.admin",
  Manager: "dashboard.teamSettings.roleDesc.manager",
  CA: "dashboard.teamSettings.roleDesc.ca",
  Accountant: "dashboard.teamSettings.roleDesc.accountant",
  Cashier: "dashboard.teamSettings.roleDesc.cashier",
  Staff: "dashboard.teamSettings.roleDesc.staff",
  InventoryManager: "dashboard.teamSettings.roleDesc.inventoryManager",
  Salesperson: "dashboard.teamSettings.roleDesc.salesperson",
};

export const PERMISSION_LABEL_KEYS: Record<Permission, TranslationKey> = {
  "org.settings.read": "dashboard.teamSettings.permissions.orgSettingsRead",
  "org.settings.write": "dashboard.teamSettings.permissions.orgSettingsWrite",
  "members.manage": "dashboard.teamSettings.permissions.membersManage",
  "sales.read": "dashboard.teamSettings.permissions.salesRead",
  "sales.write": "dashboard.teamSettings.permissions.salesWrite",
  "pos.use": "dashboard.teamSettings.permissions.posUse",
  "parties.read": "dashboard.teamSettings.permissions.partiesRead",
  "parties.write": "dashboard.teamSettings.permissions.partiesWrite",
  "inventory.read": "dashboard.teamSettings.permissions.inventoryRead",
  "inventory.write": "dashboard.teamSettings.permissions.inventoryWrite",
  "purchases.read": "dashboard.teamSettings.permissions.purchasesRead",
  "purchases.write": "dashboard.teamSettings.permissions.purchasesWrite",
  "finance.read": "dashboard.teamSettings.permissions.financeRead",
  "finance.write": "dashboard.teamSettings.permissions.financeWrite",
  "reports.read": "dashboard.teamSettings.permissions.reportsRead",
  "staff.read": "dashboard.teamSettings.permissions.staffRead",
  "staff.write": "dashboard.teamSettings.permissions.staffWrite",
};

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  Owner: "border-amber-200/90 bg-amber-50 text-amber-800",
  Admin: "border-violet-200/90 bg-violet-50 text-violet-800",
  Manager: "border-sky-200/90 bg-sky-50 text-sky-800",
  CA: "border-slate-200/90 bg-slate-50 text-slate-700",
  Accountant: "border-emerald-200/90 bg-emerald-50 text-emerald-800",
  Cashier: "border-orange-200/90 bg-orange-50 text-orange-800",
  Staff: "border-slate-200/90 bg-slate-50 text-slate-600",
  InventoryManager: "border-teal-200/90 bg-teal-50 text-teal-800",
  Salesperson: "border-indigo-200/90 bg-indigo-50 text-indigo-800",
};

const ROLE_CARD_SELECTED: Record<Exclude<UserRole, "Owner">, string> = {
  Admin: "border-violet-400 bg-violet-50/80 ring-2 ring-violet-200",
  Manager: "border-sky-400 bg-sky-50/80 ring-2 ring-sky-200",
  CA: "border-slate-400 bg-slate-50/80 ring-2 ring-slate-200",
  Accountant: "border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-200",
  Cashier: "border-orange-400 bg-orange-50/80 ring-2 ring-orange-200",
  Staff: "border-slate-400 bg-white ring-2 ring-slate-200",
  InventoryManager: "border-teal-400 bg-teal-50/80 ring-2 ring-teal-200",
  Salesperson: "border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200",
};

function countPermissions(role: UserRole): number {
  const flags = getPermissionFlags(role);
  return PERMISSIONS.filter((p) => flags[p]).length;
}

export function RoleBadge({
  role,
  label,
}: {
  role: UserRole;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_CLASS[role]}`}
    >
      {label}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden>
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RolePermissionsPanel({
  role,
  t,
  compact,
}: {
  role: UserRole;
  t: (key: TranslationKey) => string;
  compact?: boolean;
}) {
  const flags = getPermissionFlags(role);
  const granted = PERMISSIONS.filter((p) => flags[p]);
  const denied = PERMISSIONS.filter((p) => !flags[p]);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {granted.slice(0, 4).map((permission) => (
          <span
            key={permission}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
          >
            <CheckIcon />
            {t(PERMISSION_LABEL_KEYS[permission])}
          </span>
        ))}
        {granted.length > 4 ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-brand-primary-muted">
            +{granted.length - 4}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          {t("dashboard.teamSettings.canAccess")} ({granted.length})
        </p>
        <ul className="space-y-1.5">
          {granted.map((permission) => (
            <li key={permission} className="flex items-center gap-2 text-sm text-brand-primary">
              <CheckIcon />
              {t(PERMISSION_LABEL_KEYS[permission])}
            </li>
          ))}
        </ul>
      </div>
      {denied.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-primary-muted/80">
            {t("dashboard.teamSettings.cannotAccess")} ({denied.length})
          </p>
          <ul className="space-y-1.5">
            {denied.map((permission) => (
              <li key={permission} className="text-sm text-brand-primary-muted/70 line-through decoration-slate-300">
                {t(PERMISSION_LABEL_KEYS[permission])}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function RoleCardGrid({
  selectedRole,
  onSelect,
  t,
}: {
  selectedRole: UserRole;
  onSelect: (role: UserRole) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {INVITABLE_ROLES.map((role) => {
        const selected = selectedRole === role;
        const permCount = countPermissions(role);
        return (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
              selected
                ? ROLE_CARD_SELECTED[role]
                : "border-slate-200/90 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-brand-primary">{t(ROLE_LABEL_KEYS[role])}</p>
              <span className="shrink-0 rounded-full bg-brand-primary/8 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                {permCount}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-brand-primary-muted">
              {t(ROLE_DESC_KEYS[role])}
            </p>
          </button>
        );
      })}
    </div>
  );
}
