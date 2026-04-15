"use client";

import { useMemo, useState } from "react";

type PoRow = {
  poNo: string;
  vendor: string;
  eta: string;
  amount: number;
  status: "Draft" | "Sent" | "Approved" | "Received";
};

const seedRows: PoRow[] = Array.from({ length: 36 }, (_, index) => {
  const running = index + 1;
  return {
    poNo: `PO-${240500 + running}`,
    vendor: ["Thai Coffee Supply", "PackPro Co.,Ltd.", "Fresh Dairy Farm", "Bakery Source"][index % 4],
    eta: `2026-04-${String((running % 27) + 1).padStart(2, "0")}`,
    amount: 8000 + (index % 12) * 1250,
    status: ["Draft", "Sent", "Approved", "Received"][index % 4] as PoRow["status"],
  };
});

export default function PurchaseOrdersPage() {
  const [rows, setRows] = useState(seedRows);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [poNo, setPoNo] = useState("");
  const [vendor, setVendor] = useState("");
  const [eta, setEta] = useState("");
  const [amount, setAmount] = useState("0");
  const [status, setStatus] = useState<PoRow["status"]>("Draft");
  const [formError, setFormError] = useState("");

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchedText = !keyword || `${row.poNo} ${row.vendor}`.toLowerCase().includes(keyword);
      const matchedStatus = !statusFilter || row.status === statusFilter;
      return matchedText && matchedStatus;
    });
  }, [query, rows, statusFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);

  function onCreate() {
    const nextPoNo = poNo.trim().toUpperCase();
    const nextVendor = vendor.trim();
    const nextAmount = Number(amount);

    if (!nextPoNo || !nextVendor || !eta) {
      setFormError("กรุณากรอก PO No / Vendor / ETA ให้ครบ");
      return;
    }
    if (rows.some((row) => row.poNo.toLowerCase() === nextPoNo.toLowerCase())) {
      setFormError("PO No นี้มีอยู่แล้ว");
      return;
    }

    setRows((prev) => [
      {
        poNo: nextPoNo,
        vendor: nextVendor,
        eta,
        amount: Number.isFinite(nextAmount) ? Math.max(nextAmount, 0) : 0,
        status,
      },
      ...prev,
    ]);
    setFormError("");
    setIsCreateOpen(false);
    setPoNo("");
    setVendor("");
    setEta("");
    setAmount("0");
    setStatus("Draft");
    setPage(1);
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Purchase Orders (PO)</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} POs</p>
            <button
              type="button"
              className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
            >
              + Create PO
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input-clean md:col-span-2"
            placeholder="Search by PO No, vendor"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="input-clean"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Approved">Approved</option>
            <option value="Received">Received</option>
          </select>
        </div>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">PO No</th>
                <th className="py-3">Vendor</th>
                <th className="py-3">ETA</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.poNo} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium">{row.poNo}</td>
                    <td className="py-3">{row.vendor}</td>
                    <td className="py-3">{row.eta}</td>
                    <td className="py-3">{row.amount.toLocaleString()} THB</td>
                    <td className="py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {row.status}
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
              <h3 className="text-lg font-semibold text-slate-900">Create Purchase Order</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
              <input className="input-clean" placeholder="PO No" value={poNo} onChange={(e) => setPoNo(e.target.value)} />
              <input
                className="input-clean"
                placeholder="Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
              <input className="input-clean" type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
              <input
                className="input-clean"
                type="number"
                min={0}
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select className="input-clean sm:col-span-2" value={status} onChange={(e) => setStatus(e.target.value as PoRow["status"])}>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Received">Received</option>
              </select>
            </div>

            {formError ? <p className="px-6 text-sm text-rose-600 sm:px-7">{formError}</p> : null}

            <div className="mt-4 flex justify-end px-6 pb-6 sm:px-7">
              <button
                type="button"
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                onClick={onCreate}
              >
                Create PO
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
