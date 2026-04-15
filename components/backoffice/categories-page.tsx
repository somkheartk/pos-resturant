"use client";

import { useMemo, useState } from "react";

type CategoryRow = {
  code: string;
  name: string;
  itemCount: number;
  updatedAt: string;
  isActive: boolean;
};

const seedRows: CategoryRow[] = [
  { code: "CAT-001", name: "Drink", itemCount: 182, updatedAt: "2026-04-01", isActive: true },
  { code: "CAT-002", name: "Bakery", itemCount: 64, updatedAt: "2026-04-06", isActive: true },
  { code: "CAT-003", name: "Packaging", itemCount: 41, updatedAt: "2026-04-08", isActive: true },
  { code: "CAT-004", name: "Ingredient", itemCount: 97, updatedAt: "2026-04-10", isActive: true },
  { code: "CAT-005", name: "Frozen", itemCount: 18, updatedAt: "2026-04-10", isActive: false },
  { code: "CAT-006", name: "Merchandise", itemCount: 21, updatedAt: "2026-04-12", isActive: true },
  { code: "CAT-007", name: "Cleaning", itemCount: 13, updatedAt: "2026-04-12", isActive: true },
  { code: "CAT-008", name: "Other", itemCount: 8, updatedAt: "2026-04-12", isActive: true },
];

export default function CategoryPage() {
  const [rows, setRows] = useState(seedRows);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => `${row.code} ${row.name}`.toLowerCase().includes(keyword));
  }, [query, rows]);

  const total = filteredRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);

  function onCreate() {
    const nextCode = code.trim().toUpperCase();
    const nextName = name.trim();

    if (!nextCode || !nextName) {
      setFormError("กรุณากรอก Category Code และ Category Name");
      return;
    }
    if (rows.some((row) => row.code.toLowerCase() === nextCode.toLowerCase())) {
      setFormError("Category Code นี้มีอยู่แล้ว");
      return;
    }

    const today = new Date();
    const updatedAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;

    setRows((prev) => [
      { code: nextCode, name: nextName, itemCount: 0, updatedAt, isActive: true },
      ...prev,
    ]);
    setFormError("");
    setIsCreateOpen(false);
    setCode("");
    setName("");
    setPage(1);
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Category</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} categories</p>
            <button
              type="button"
              className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
            >
              + Add Category
            </button>
          </div>
        </div>

        <input
          className="input-clean"
          placeholder="Search by category code or name"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">Code</th>
                <th className="py-3">Name</th>
                <th className="py-3">Items</th>
                <th className="py-3">Updated</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.code} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium">{row.code}</td>
                    <td className="py-3">{row.name}</td>
                    <td className="py-3">{row.itemCount.toLocaleString()}</td>
                    <td className="py-3">{row.updatedAt}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.isActive ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <p>
            Page {safePage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
            if (event.target === event.currentTarget) setIsCreateOpen(false);
          }}
        >
          <div className="card-surface w-full max-w-2xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
              <h3 className="text-lg font-semibold text-slate-900">Add Category</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
              <input
                className="input-clean"
                placeholder="Category Code (e.g. CAT-009)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <input
                className="input-clean"
                placeholder="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {formError ? <p className="px-6 text-sm text-rose-600 sm:px-7">{formError}</p> : null}

            <div className="mt-4 flex justify-end px-6 pb-6 sm:px-7">
              <button
                type="button"
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                onClick={onCreate}
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
