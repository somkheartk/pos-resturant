"use client";

import { useMemo, useState } from "react";

type ProductRow = {
  sku: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
};

const menuTemplates = [
  { name: "Pad Thai Shrimp", category: "Noodle", price: 129 },
  { name: "Fried Rice Pork", category: "Rice", price: 109 },
  { name: "Tom Yum Soup", category: "Soup", price: 149 },
  { name: "Green Curry Chicken", category: "Curry", price: 139 },
  { name: "Thai Milk Tea", category: "Drink", price: 59 },
  { name: "Mango Sticky Rice", category: "Dessert", price: 99 },
  { name: "Spring Rolls", category: "Appetizer", price: 89 },
  { name: "Papaya Salad", category: "Salad", price: 95 },
];

const seedRows: ProductRow[] = Array.from({ length: 40 }, (_, index) => {
  const running = index + 1;
  const template = menuTemplates[index % menuTemplates.length];

  return {
    sku: `MENU-${String(1000 + running)}`,
    name: `${template.name} ${running > menuTemplates.length ? running : ""}`.trim(),
    category: template.category,
    price: template.price + (index % 4) * 5,
    isActive: running % 9 !== 0,
  };
});

export default function ProductsPage() {
  const [rows, setRows] = useState(seedRows);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Main Dish");
  const [price, setPrice] = useState("0");
  const [formError, setFormError] = useState("");

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchedText = !keyword || `${row.sku} ${row.name}`.toLowerCase().includes(keyword);
      const matchedCategory = !categoryFilter || row.category === categoryFilter;
      return matchedText && matchedCategory;
    });
  }, [query, rows, categoryFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);

  function onCreate() {
    const nextSku = sku.trim().toUpperCase();
    const nextName = name.trim();
    const nextPrice = Number(price);

    if (!nextSku || !nextName) {
      setFormError("กรุณากรอกรหัสเมนูและชื่ออาหาร");
      return;
    }
    if (rows.some((row) => row.sku.toLowerCase() === nextSku.toLowerCase())) {
      setFormError("รหัสเมนูนี้มีอยู่แล้ว");
      return;
    }

    setRows((prev) => [
      {
        sku: nextSku,
        name: nextName,
        category,
        price: Number.isFinite(nextPrice) ? Math.max(nextPrice, 0) : 0,
        isActive: true,
      },
      ...prev,
    ]);
    setFormError("");
    setIsCreateOpen(false);
    setSku("");
    setName("");
    setCategory("Main Dish");
    setPrice("0");
    setPage(1);
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Food Menu</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} menu items</p>
            <button
              type="button"
              className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
            >
              + Add Menu
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input-clean md:col-span-2"
            placeholder="Search by menu code or dish name"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="input-clean"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            <option value="Main Dish">Main Dish</option>
            <option value="Noodle">Noodle</option>
            <option value="Rice">Rice</option>
            <option value="Soup">Soup</option>
            <option value="Curry">Curry</option>
            <option value="Drink">Drink</option>
            <option value="Dessert">Dessert</option>
            <option value="Appetizer">Appetizer</option>
            <option value="Salad">Salad</option>
          </select>
        </div>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">Menu Code</th>
                <th className="py-3">Menu</th>
                <th className="py-3">Category</th>
                <th className="py-3">Price</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No menu items found
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.sku} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium">{row.sku}</td>
                    <td className="py-3">{row.name}</td>
                    <td className="py-3">{row.category}</td>
                    <td className="py-3">{row.price.toLocaleString()} THB</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.isActive ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.isActive ? "Available" : "Hidden"}
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
              <h3 className="text-lg font-semibold text-slate-900">Add Food Menu</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
              <input className="input-clean" placeholder="Menu code" value={sku} onChange={(e) => setSku(e.target.value)} />
              <input className="input-clean" placeholder="Dish name" value={name} onChange={(e) => setName(e.target.value)} />
              <select className="input-clean" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Main Dish">Main Dish</option>
                <option value="Noodle">Noodle</option>
                <option value="Rice">Rice</option>
                <option value="Soup">Soup</option>
                <option value="Curry">Curry</option>
                <option value="Drink">Drink</option>
                <option value="Dessert">Dessert</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Salad">Salad</option>
              </select>
              <input
                className="input-clean"
                type="number"
                min={0}
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {formError ? <p className="px-6 text-sm text-rose-600 sm:px-7">{formError}</p> : null}

            <div className="mt-4 flex justify-end px-6 pb-6 sm:px-7">
              <button
                type="button"
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                onClick={onCreate}
              >
                Create Menu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
