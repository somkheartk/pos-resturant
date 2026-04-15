"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
};

type UserResponse = {
  data: UserRow[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  form?: string;
};

type BackendErrorPayload = {
  errorCode?: string;
  message?: string;
  errors?: string[];
};

type FormFieldKey = Exclude<keyof FormErrors, "form">;

function inferField(message: string): FormFieldKey | undefined {
  if (message.includes("email")) {
    return "email";
  }
  if (message.includes("name")) {
    return "name";
  }
  if (message.includes("password")) {
    return "password";
  }
  if (message.includes("role")) {
    return "role";
  }
  return undefined;
}

function toThaiValidationMessage(field: FormFieldKey, message: string): string {
  if (message.includes("should not be empty")) {
    if (field === "name") return "กรุณากรอก Name";
    if (field === "email") return "กรุณากรอก Email";
    if (field === "password") return "กรุณากรอก Password";
    if (field === "role") return "กรุณาเลือก Role";
  }

  if (message.includes("must be an email")) {
    return "Email ไม่ถูกต้อง";
  }

  if (message.includes("must be longer than or equal to") || message.includes("minlength")) {
    if (field === "name") return "Name ต้องมีอย่างน้อย 2 ตัวอักษร";
    if (field === "password") return "Password ต้องอย่างน้อย 6 ตัวอักษร";
  }

  if (message.includes("must be one of") || message.includes("must be a valid enum value")) {
    if (field === "role") return "Role ไม่ถูกต้อง";
  }

  if (message.includes("must be a string")) {
    if (field === "name") return "Name ต้องเป็นข้อความ";
    if (field === "email") return "Email ต้องเป็นข้อความ";
    if (field === "password") return "Password ต้องเป็นข้อความ";
    if (field === "role") return "Role ต้องเป็นข้อความ";
  }

  if (message.includes("must be a boolean value") || message.includes("must be a boolean")) {
    return "สถานะการใช้งานไม่ถูกต้อง";
  }

  if (field === "name") return "Name ไม่ถูกต้อง";
  if (field === "email") return "Email ไม่ถูกต้อง";
  if (field === "password") return "Password ไม่ถูกต้อง";
  return "Role ไม่ถูกต้อง";
}

function mapValidationErrors(messages: string[]): FormErrors {
  const nextErrors: FormErrors = {};

  for (const rawMessage of messages) {
    const normalized = rawMessage.toLowerCase();
    const field = inferField(normalized);

    if (!field) {
      if (!nextErrors.form) {
        nextErrors.form = "ข้อมูลที่ส่งมาไม่ถูกต้อง";
      }
      continue;
    }

    if (!nextErrors[field]) {
      nextErrors[field] = toThaiValidationMessage(field, normalized);
    }
  }

  return nextErrors;
}

function mapBackendToFormErrors(payload: BackendErrorPayload): FormErrors {
  const code = payload.errorCode ?? "";
  const message = payload.message ?? "เกิดข้อผิดพลาด";

  const thaiByCode: Record<string, string> = {
    REQ_400: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
    USR_001: "ไม่สามารถเพิ่มผู้ใช้ได้",
    USR_003: "ไม่พบผู้ใช้ที่ต้องการ",
    USR_004: "ไม่สามารถแก้ไขผู้ใช้ได้",
    USR_005: "ไม่สามารถลบผู้ใช้ได้",
    USR_006: "Email นี้ถูกใช้งานแล้ว",
  };

  const thaiMessage = thaiByCode[code] ?? message;

  if (code === "USR_006") {
    return { email: thaiMessage };
  }

  if (payload.errors && payload.errors.length > 0) {
    const validationErrors = mapValidationErrors(payload.errors);
    if (Object.keys(validationErrors).length > 0) {
      return validationErrors;
    }
  }

  const text = message.toLowerCase();
  const nextErrors: FormErrors = {};

  if (text.includes("email")) {
    nextErrors.email = thaiMessage;
  } else if (text.includes("name")) {
    nextErrors.name = thaiMessage;
  } else if (text.includes("password")) {
    nextErrors.password = thaiMessage;
  } else if (text.includes("role")) {
    nextErrors.role = thaiMessage;
  } else {
    nextErrors.form = thaiMessage;
  }

  return nextErrors;
}

function getFirstErrorMessage(errors: FormErrors): string | undefined {
  return errors.form ?? errors.name ?? errors.email ?? errors.password ?? errors.role;
}

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [userFilter, setUserFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userInput, setUserInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [isActive, setIsActive] = useState(true);

  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("staff");
  const [editIsActive, setEditIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [actionRowId, setActionRowId] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateCreateForm(): boolean {
    const nextErrors: FormErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Name ต้องมีอย่างน้อย 2 ตัวอักษร";
    }
    if (!validateEmail(email.trim())) {
      nextErrors.email = "Email ไม่ถูกต้อง";
    }
    if (password && password.length < 6) {
      nextErrors.password = "Password ต้องอย่างน้อย 6 ตัวอักษร";
    }
    if (!["admin", "manager", "staff"].includes(role)) {
      nextErrors.role = "Role ไม่ถูกต้อง";
    }

    setCreateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateEditForm(): boolean {
    const nextErrors: FormErrors = {};

    if (editName.trim().length < 2) {
      nextErrors.name = "Name ต้องมีอย่างน้อย 2 ตัวอักษร";
    }
    if (!validateEmail(editEmail.trim())) {
      nextErrors.email = "Email ไม่ถูกต้อง";
    }
    if (!["admin", "manager", "staff"].includes(editRole)) {
      nextErrors.role = "Role ไม่ถูกต้อง";
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  useEffect(() => {
    if (!isCreateOpen && !isEditOpen && !deleteTarget) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setDeleteTarget(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, isCreateOpen, isEditOpen]);

  async function loadUsers(
    nextPage = page,
    nextPageSize = pageSize,
    nextUser = userFilter,
    nextEmail = emailFilter,
    nextRole = roleFilter,
    nextStatus = statusFilter,
  ) {
    setIsLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextPageSize),
        user: nextUser,
        email: nextEmail,
        role: nextRole,
        status: nextStatus,
      });

      const response = await fetch(`/api/users?${query.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Cannot load users");
      }

      const payload = (await response.json()) as UserResponse;
      setRows(payload.data);
      setPage(payload.meta.page);
      setPageSize(payload.meta.pageSize);
      setTotal(payload.meta.total);
      setTotalPages(payload.meta.totalPages);
    } catch {
      setError("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(1, pageSize, userFilter, emailFilter, roleFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilter, emailFilter, roleFilter, statusFilter, pageSize]);

  async function onCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          role,
          isActive,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as BackendErrorPayload | null;
        const backendPayload: BackendErrorPayload = {
          errorCode: payload?.errorCode,
          message: payload?.message ?? "เพิ่มผู้ใช้ไม่สำเร็จ",
          errors: payload?.errors,
        };
        const backendFieldErrors = mapBackendToFormErrors(backendPayload);
        setCreateErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        throw new Error(getFirstErrorMessage(backendFieldErrors) ?? backendPayload.message);
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      setIsActive(true);
      setCreateErrors({});
      setIsCreateOpen(false);
      void loadUsers(1, pageSize, userFilter, emailFilter, roleFilter, statusFilter);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("เพิ่มผู้ใช้ไม่สำเร็จ (ตรวจ email ซ้ำหรือข้อมูลไม่ครบ)");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function openEditModal(row: UserRow) {
    setEditId(row._id);
    setEditName(row.name);
    setEditEmail(row.email);
    setEditRole(row.role ?? "staff");
    setEditIsActive(row.isActive !== false);
    setEditErrors({});
    setError("");
    setIsEditOpen(true);
  }

  async function onUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editId) {
      return;
    }

    if (!validateEditForm()) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${editId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          isActive: editIsActive,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as BackendErrorPayload | null;
        const backendPayload: BackendErrorPayload = {
          errorCode: payload?.errorCode,
          message: payload?.message ?? "แก้ไขผู้ใช้ไม่สำเร็จ",
          errors: payload?.errors,
        };
        const backendFieldErrors = mapBackendToFormErrors(backendPayload);
        setEditErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        throw new Error(getFirstErrorMessage(backendFieldErrors) ?? backendPayload.message);
      }

      setIsEditOpen(false);
      setEditErrors({});
      void loadUsers(page, pageSize, userFilter, emailFilter, roleFilter, statusFilter);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("แก้ไขผู้ใช้ไม่สำเร็จ");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function onDeleteUser(id: string) {
    setActionRowId(id);
    setError("");

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Cannot delete user");
      }

      setDeleteTarget(null);
      void loadUsers(page, pageSize, userFilter, emailFilter, roleFilter, statusFilter);
    } catch {
      setError("ลบผู้ใช้ไม่สำเร็จ");
    } finally {
      setActionRowId(null);
    }
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Users</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Users Management</h2>
          </div>
          <p className="text-sm text-slate-500">ค้นหาผู้ใช้จากชื่อ, อีเมล, บทบาท และสถานะ</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">User name</span>
              <input
                className="input-clean bg-white"
                placeholder="Search by user"
                value={userInput}
                onChange={(event) => setUserInput(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Email</span>
              <input
                className="input-clean bg-white"
                placeholder="Search by email"
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Role</span>
              <select
                className="input-clean bg-white"
                value={roleInput}
                onChange={(event) => setRoleInput(event.target.value)}
              >
                <option value="">All roles</option>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="staff">staff</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Status</span>
              <select
                className="input-clean bg-white"
                value={statusInput}
                onChange={(event) => setStatusInput(event.target.value)}
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={() => {
                setUserInput("");
                setEmailInput("");
                setRoleInput("");
                setStatusInput("");
                setPage(1);
                setUserFilter("");
                setEmailFilter("");
                setRoleFilter("");
                setStatusFilter("");
              }}
            >
              Clear
            </button>

            <button
              type="button"
              className="gradient-brand rounded-2xl px-5 py-2.5 text-sm font-medium text-white"
              onClick={() => {
                setPage(1);
                setUserFilter(userInput.trim());
                setEmailFilter(emailInput.trim());
                setRoleFilter(roleInput);
                setStatusFilter(statusInput);
              }}
            >
              Search Users
            </button>
          </div>
        </div>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} users</p>
            <select
              className="input-clean w-32"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <button
            type="button"
            className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              setCreateErrors({});
              setError("");
              setIsCreateOpen(true);
            }}
          >
            + Add User
          </button>
        </div>

        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Role</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium">{row.name}</td>
                    <td className="py-3">{row.email}</td>
                    <td className="py-3 uppercase">{row.role ?? "staff"}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.isActive === false
                            ? "bg-rose-50 text-rose-700"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {row.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
                          disabled={actionRowId === row._id}
                          onClick={() => openEditModal(row)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-300 px-2.5 py-1.5 text-xs text-rose-700"
                          disabled={actionRowId === row._id}
                          onClick={() => setDeleteTarget(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>
            Page {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              disabled={page <= 1 || isLoading}
              onClick={() => void loadUsers(page - 1, pageSize, userFilter, emailFilter, roleFilter, statusFilter)}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              disabled={page >= totalPages || isLoading}
              onClick={() => void loadUsers(page + 1, pageSize, userFilter, emailFilter, roleFilter, statusFilter)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreateOpen(false);
            }
          }}
        >
          <div className="card-surface w-full max-w-2xl p-6 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add User</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreateUser} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <input
                  className="input-clean"
                  placeholder="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                {createErrors.name ? <p className="text-xs text-rose-600">{createErrors.name}</p> : null}
              </div>

              <div className="space-y-1">
                <input
                  className="input-clean"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                {createErrors.email ? <p className="text-xs text-rose-600">{createErrors.email}</p> : null}
              </div>

              <div className="space-y-1">
                <input
                  className="input-clean"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {createErrors.password ? <p className="text-xs text-rose-600">{createErrors.password}</p> : null}
              </div>

              <div className="space-y-1">
                <select className="input-clean" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="staff">staff</option>
                </select>
                {createErrors.role ? <p className="text-xs text-rose-600">{createErrors.role}</p> : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                Active
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white md:col-span-2"
              >
                {isSaving ? "Saving..." : "Create User"}
              </button>
              {createErrors.form ? (
                <p className="text-xs text-rose-600 md:col-span-2">{createErrors.form}</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      {isEditOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsEditOpen(false);
            }
          }}
        >
          <div className="card-surface w-full max-w-2xl p-6 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit User</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsEditOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onUpdateUser} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <input
                  className="input-clean"
                  placeholder="Name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
                {editErrors.name ? <p className="text-xs text-rose-600">{editErrors.name}</p> : null}
              </div>

              <div className="space-y-1">
                <input
                  className="input-clean"
                  placeholder="Email"
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  required
                />
                {editErrors.email ? <p className="text-xs text-rose-600">{editErrors.email}</p> : null}
              </div>

              <div className="space-y-1 md:col-span-2">
                <select
                  className="input-clean"
                  value={editRole}
                  onChange={(event) => setEditRole(event.target.value)}
                >
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="staff">staff</option>
                </select>
                {editErrors.role ? <p className="text-xs text-rose-600">{editErrors.role}</p> : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(event) => setEditIsActive(event.target.checked)}
                />
                Active
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white md:col-span-2"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              {editErrors.form ? (
                <p className="text-xs text-rose-600 md:col-span-2">{editErrors.form}</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && actionRowId !== deleteTarget._id) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="card-surface w-full max-w-md p-6 sm:p-7">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-rose-500">Delete User</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">ยืนยันการลบผู้ใช้</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                คุณกำลังจะลบผู้ใช้
                <span className="font-semibold text-slate-900"> {deleteTarget.name} </span>
                และอีเมล
                <span className="font-semibold text-slate-900"> {deleteTarget.email}</span>
                ออกจากระบบ การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              ตรวจสอบให้แน่ใจว่าไม่มีการใช้งานบัญชีนี้อยู่ก่อนลบ
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                disabled={actionRowId === deleteTarget._id}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                disabled={actionRowId === deleteTarget._id}
                onClick={() => void onDeleteUser(deleteTarget._id)}
              >
                {actionRowId === deleteTarget._id ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
