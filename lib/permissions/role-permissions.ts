export const PERMISSIONS = [
  "org.settings.read",
  "org.settings.write",
  "members.manage",
  "sales.read",
  "sales.write",
  "pos.use",
  "parties.read",
  "parties.write",
  "inventory.read",
  "inventory.write",
  "purchases.read",
  "purchases.write",
  "finance.read",
  "finance.write",
  "reports.read",
  "staff.read",
  "staff.write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type UserRole =
  | "Owner"
  | "Admin"
  | "Manager"
  | "CA"
  | "Accountant"
  | "Cashier"
  | "Staff"
  | "InventoryManager"
  | "Salesperson";

export const INVITABLE_ROLES: Exclude<UserRole, "Owner">[] = [
  "Admin",
  "Manager",
  "CA",
  "Accountant",
  "Cashier",
  "Staff",
  "InventoryManager",
  "Salesperson",
];

const ALL_READ: Permission[] = [
  "org.settings.read",
  "sales.read",
  "parties.read",
  "inventory.read",
  "purchases.read",
  "finance.read",
  "reports.read",
  "staff.read",
];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  Owner: [...PERMISSIONS],
  Admin: [...PERMISSIONS],
  Manager: [
    ...ALL_READ,
    "sales.write",
    "pos.use",
    "parties.write",
    "inventory.write",
    "purchases.write",
    "finance.write",
    "staff.write",
  ],
  InventoryManager: [...ALL_READ, "inventory.write", "purchases.write"],
  Accountant: [...ALL_READ, "finance.write"],
  CA: [...ALL_READ],
  Cashier: [...ALL_READ, "sales.write", "pos.use", "finance.write"],
  Salesperson: [...ALL_READ, "sales.write", "pos.use"],
  Staff: [...ALL_READ],
};

export function roleHasPermission(role: string, permission: Permission): boolean {
  if (!(role in ROLE_PERMISSIONS)) return false;
  return ROLE_PERMISSIONS[role as UserRole].includes(permission);
}

export function getPermissionFlags(role: string): Record<Permission, boolean> {
  const flags = {} as Record<Permission, boolean>;
  for (const permission of PERMISSIONS) {
    flags[permission] = roleHasPermission(role, permission);
  }
  return flags;
}

export const ROLE_PERMISSION_LABELS: Record<Permission, string> = {
  "org.settings.read": "View business settings",
  "org.settings.write": "Edit business settings",
  "members.manage": "Invite & manage team",
  "sales.read": "View sales",
  "sales.write": "Create & edit sales",
  "pos.use": "Use POS billing",
  "parties.read": "View parties",
  "parties.write": "Manage parties",
  "inventory.read": "View inventory",
  "inventory.write": "Manage inventory",
  "purchases.read": "View purchases",
  "purchases.write": "Manage purchases",
  "finance.read": "View finance",
  "finance.write": "Manage finance",
  "reports.read": "View reports",
  "staff.read": "View staff & payroll",
  "staff.write": "Manage staff & payroll",
};
