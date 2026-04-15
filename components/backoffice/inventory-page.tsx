"use client";

import { useMemo, useState } from "react";

type InventoryRow = {
  sku: string;
  item: string;
  category: string;
  qty: number;
  reorderPoint: number;
  location: string;
};

const seedRows: InventoryRow[] = Array.from({ length: 48 }, (_, index) => {
  const running = index + 1;
  return {
    sku: `SKU-${String(1000 + running)}`,
    item: `Inventory Item ${running}`,
    category: ["Drink", "Bakery", "Packaging", "Ingredient"][index % 4],
    qty: 40 + (index % 19) * 15,
    reorderPoint: 80,
    location: `WH-${String.fromCharCode(65 + (index % 4))}${(index % 8) + 1}`,
  };
});

export default function InventoryPage() {
  const [rows, setRows] = useState(seedRows);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sku, setSku] = useState("");
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("Drink");
  const [qty, setQty] = useState("0");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState("");

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => {
      const source = `${row.sku} ${row.item} ${row.category} ${row.location}`.toLowerCase();
      return source.includes(keyword);
    });
  }, [query, rows]);

  const total = filteredRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);

  function onCreate() {
    const nextSku = sku.trim().toUpperCase();
    const nextItem = item.trim();
    const nextQty = Number(qty);
    const nextLocation = location.trim().toUpperCase();

    if (!nextSku || !nextItem || !nextLocation) {
      setFormError("กรุณากรอก SKU / Item / Location ให้ครบ");
      return;
    }
    if (rows.some((row) => row.sku.toLowerCase() === nextSku.toLowerCase())) {
      setFormError("SKU นี้มีอยู่แล้ว");
      return;
    }

    setRows((prev) => [
      {
        sku: nextSku,
        item: nextItem,
        category,
        qty: Number.isFinite(nextQty) ? Math.max(nextQty, 0) : 0,
        reorderPoint: 80,
        location: nextLocation,
      },
      ...prev,
    ]);

    setFormError("");
    setIsCreateOpen(false);
    setSku("");
    setItem("");
    setCategory("Drink");
    setQty("0");
    setLocation("");
    setPage(1);
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Inventory</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} items</p>
            <button
              type="button"
              className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
            >
              + Add Stock Item
            </button>
          </div>
        </div>

        <input
          className="input-clean"
          placeholder="Search by SKU, item, category, location"
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
                <th className="py-3">SKU</th>
                <th className="py-3">Item</th>
                <th className="py-3">Category</th>
                <th className="py-3">Location</th>
                <th className="py-3">Qty</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No inventory found
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const lowStock = row.qty <= row.reorderPoint;
                  return (
                    <tr key={row.sku} className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 font-medium">{row.sku}</td>
                      <td className="py-3">{row.item}</td>
                      <td className="py-3">{row.category}</td>
                      <td className="py-3">{row.location}</td>
                      <td className="py-3">{row.qty.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            lowStock ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"
                          }`}
                        >
                          {lowStock ? "Low Stock" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
              <h3 className="text-lg font-semibold text-slate-900">Add Inventory Item</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
              <input className="input-clean" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
              <input className="input-clean" placeholder="Item" value={item} onChange={(e) => setItem(e.target.value)} />
              <select className="input-clean" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Drink">Drink</option>
                <option value="Bakery">Bakery</option>
                <option value="Packaging">Packaging</option>
                <option value="Ingredient">Ingredient</option>
              </select>
              <input
                className="input-clean"
                placeholder="Quantity"
                type="number"
                min={0}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <input
                className="input-clean sm:col-span-2"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {formError ? <p className="px-6 text-sm text-rose-600 sm:px-7">{formError}</p> : null}

            <div className="mt-4 flex justify-end px-6 pb-6 sm:px-7">
              <button
                type="button"
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                onClick={onCreate}
              >
                Create Item
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
