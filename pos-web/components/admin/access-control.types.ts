export type UserRow = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
};

export type UsersResponse = {
  data?: UserRow[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function extractUserRows(payload: UsersResponse | UserRow[] | unknown): UserRow[] {
  if (Array.isArray(payload)) {
    return payload as UserRow[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; items?: unknown; results?: unknown };

    if (Array.isArray(record.data)) return record.data as UserRow[];
    if (Array.isArray(record.items)) return record.items as UserRow[];
    if (Array.isArray(record.results)) return record.results as UserRow[];
  }

  return [];
}

export const permissionCatalog = [
  "dashboard:view",
  "users:view",
  "branches:view",
  "orders:view",
  "inventory:view",
  "po:view",
  "products:view",
  "category:view",
  "admin:settings",
];

export const roleCatalog = ["admin", "manager", "staff"] as const;
export type RoleType = (typeof roleCatalog)[number];

export const roleDefaultPermissions: Record<RoleType, string[]> = {
  admin: [...permissionCatalog],
  manager: [
    "dashboard:view",
    "branches:view",
    "orders:view",
    "inventory:view",
    "po:view",
    "products:view",
    "category:view",
  ],
  staff: ["dashboard:view", "orders:view", "inventory:view"],
};

export const permissionGroups: Array<{ label: string; permissions: string[] }> = [
  { label: "Core", permissions: ["dashboard:view"] },
  { label: "Operations", permissions: ["orders:view", "inventory:view", "po:view", "branches:view"] },
  { label: "Catalog", permissions: ["products:view", "category:view"] },
  { label: "Administration", permissions: ["users:view", "admin:settings"] },
];

export function normalizeRole(value?: string): RoleType {
  if (value === "admin" || value === "manager") return value;
  return "staff";
}

export function permissionState(role: RoleType, currentPermissions: string[], permission: string) {
  const inherited = roleDefaultPermissions[role].includes(permission);
  const selected = currentPermissions.includes(permission);

  if (selected && inherited) return "inherited";
  if (selected && !inherited) return "added";
  if (!selected && inherited) return "removed";
  return "off";
}