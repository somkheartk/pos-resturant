"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessControlRow } from "@/components/admin/access-control-row";
import {
  extractUserRows,
  normalizeRole,
  roleDefaultPermissions,
  type UserRow,
  type UsersResponse,
} from "@/components/admin/access-control.types";

export function AccessControlPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadUsers() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users?page=1&pageSize=100", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      }

      const payload = (await response.json()) as UsersResponse | UserRow[];
      setRows(extractUserRows(payload));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => {
      const text = `${row.name} ${row.email} ${row.role ?? ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [query, rows]);

  function updateLocalRow(id: string, next: Partial<UserRow>) {
    setRows((prev) => prev.map((item) => (item._id === id ? { ...item, ...next } : item)));
  }

  function togglePermission(row: UserRow, permission: string) {
    const current = row.permissions ?? [];
    const selected = current.includes(permission);
    const next = selected
      ? current.filter((item) => item !== permission)
      : Array.from(new Set([...current, permission]));
    updateLocalRow(row._id, { permissions: next });
  }

  function applyRoleDefaults(row: UserRow) {
    const role = normalizeRole(row.role);
    updateLocalRow(row._id, { permissions: [...roleDefaultPermissions[role]] });
  }

  async function saveAccess(row: UserRow) {
    setSavingId(row._id);
    setError("");

    try {
      const response = await fetch(`/api/users/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: row.role,
          permissions: row.permissions ?? [],
        }),
      });

      if (!response.ok) {
        throw new Error("บันทึกสิทธิไม่สำเร็จ");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "บันทึกสิทธิไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Admin Access Control</h2>
          <p className="text-sm text-slate-500">ตั้งค่า role และ permission ของผู้ใช้</p>
        </div>

        <input
          className="input-clean"
          placeholder="Search by name, email, role"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">User</th>
                <th className="py-3">Role</th>
                <th className="py-3">Permissions</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <AccessControlRow
                    key={row._id}
                    row={row}
                    isSaving={savingId === row._id}
                    onUpdateRow={updateLocalRow}
                    onApplyRoleDefaults={applyRoleDefaults}
                    onTogglePermission={togglePermission}
                    onSave={(nextRow) => void saveAccess(nextRow)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}