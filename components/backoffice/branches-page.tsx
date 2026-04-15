"use client";

import { useMemo, useState } from "react";

type BranchRow = {
  id: string;
  name: string;
  city: string;
  area: string;
  manager: string;
  posCounter: number;
  phone: string;
  isActive: boolean;
};

const cities = ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen", "Hat Yai", "Udon Thani"];
const areas = ["CBD", "Mall", "Community", "Transit", "University", "Old Town"];

const branches: BranchRow[] = Array.from({ length: 72 }, (_, index) => {
  const running = index + 1;
  const city = cities[index % cities.length];
  const area = areas[index % areas.length];

  return {
    id: `BR-${String(running).padStart(4, "0")}`,
    name: `Branch ${city} ${running}`,
    city,
    area,
    manager: `Manager ${running}`,
    posCounter: (running % 8) + 2,
    phone: `02-${String(400000 + running).slice(-6)}`,
    isActive: running % 7 !== 0,
  };
});

export default function BranchesPage() {
  const [rows, setRows] = useState<BranchRow[]>(branches);
  const [branchCodeInput, setBranchCodeInput] = useState("");
  const [branchNameInput, setBranchNameInput] = useState("");
  const [provinceInput, setProvinceInput] = useState("");
  const [branchCodeFilter, setBranchCodeFilter] = useState("");
  const [branchNameFilter, setBranchNameFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newProvince, setNewProvince] = useState("Bangkok");
  const [newArea, setNewArea] = useState("CBD");
  const [newManager, setNewManager] = useState("");
  const [newPosCounter, setNewPosCounter] = useState("2");
  const [newPhone, setNewPhone] = useState("");
  const [createError, setCreateError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filteredRows = useMemo(() => {
    const code = branchCodeFilter.trim().toLowerCase();
    const name = branchNameFilter.trim().toLowerCase();
    const province = provinceFilter.trim().toLowerCase();

    return rows.filter((row) => {
      const matchedCode = !code || row.id.toLowerCase().includes(code);
      const matchedName = !name || row.name.toLowerCase().includes(name);
      const matchedProvince = !province || row.city.toLowerCase().includes(province);
      return matchedCode && matchedName && matchedProvince;
    });
  }, [branchCodeFilter, branchNameFilter, provinceFilter, rows]);

  const total = filteredRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);
  const pageStart = total === 0 ? 0 : start + 1;
  const pageEnd = Math.min(start + pageSize, total);

  const pageButtons = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNo) => pageNo === 1 || pageNo === totalPages || Math.abs(pageNo - safePage) <= 2,
  );

  function onSearch() {
    setPage(1);
    setBranchCodeFilter(branchCodeInput);
    setBranchNameFilter(branchNameInput);
    setProvinceFilter(provinceInput);
  }

  function onCreateBranch() {
    const code = newCode.trim().toUpperCase();
    const name = newName.trim();

    if (!code || !name || !newProvince) {
      setCreateError("กรุณากรอก รหัสร้าน / ชื่อร้าน / จังหวัด ให้ครบ");
      return;
    }

    if (rows.some((item) => item.id.toLowerCase() === code.toLowerCase())) {
      setCreateError("รหัสร้านนี้มีอยู่แล้ว");
      return;
    }

    const parsedPosCounter = Number(newPosCounter);
    const next: BranchRow = {
      id: code,
      name,
      city: newProvince,
      area: newArea || "CBD",
      manager: newManager.trim() || "-",
      posCounter: Number.isFinite(parsedPosCounter) && parsedPosCounter > 0 ? parsedPosCounter : 1,
      phone: newPhone.trim() || "-",
      isActive: true,
    };

    setRows((prev) => [next, ...prev]);
    setCreateError("");
    setIsCreateOpen(false);
    setNewCode("");
    setNewName("");
    setNewProvince("Bangkok");
    setNewArea("CBD");
    setNewManager("");
    setNewPosCounter("2");
    setNewPhone("");
    setPage(1);
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Branches</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} branches</p>
            <button
              type="button"
              className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                setCreateError("");
                setIsCreateOpen(true);
              }}
            >
              + Add Branch
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Branch Code</p>
            <input
              className="input-clean"
              placeholder="เช่น BR-0001"
              value={branchCodeInput}
              onChange={(event) => setBranchCodeInput(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Branch Name</p>
            <input
              className="input-clean"
              placeholder="ค้นหาชื่อร้าน"
              value={branchNameInput}
              onChange={(event) => setBranchNameInput(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Province</p>
            <input
              className="input-clean"
              placeholder="ค้นหาจังหวัด"
              value={provinceInput}
              onChange={(event) => setProvinceInput(event.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="gradient-brand w-full rounded-lg px-4 py-2 text-sm font-medium text-white"
              onClick={onSearch}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">ID</th>
                <th className="py-3">Branch</th>
                <th className="py-3">City / Area</th>
                <th className="py-3">Manager</th>
                <th className="py-3">POS</th>
                <th className="py-3">Phone</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No branches found
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium">{row.id}</td>
                    <td className="py-3">{row.name}</td>
                    <td className="py-3">{row.city} / {row.area}</td>
                    <td className="py-3">{row.manager}</td>
                    <td className="py-3">{row.posCounter}</td>
                    <td className="py-3">{row.phone}</td>
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Showing {pageStart.toLocaleString()}-{pageEnd.toLocaleString()} of {total.toLocaleString()}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Prev
            </button>

            {pageButtons.map((pageNo, index) => {
              const prev = pageButtons[index - 1];
              const showGap = prev && pageNo - prev > 1;

              return (
                <span key={`page-${pageNo}`} className="flex items-center">
                  {showGap ? <span className="px-1 text-slate-400">...</span> : null}
                  <button
                    type="button"
                    className={`mx-0.5 h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition ${
                      pageNo === safePage
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setPage(pageNo)}
                  >
                    {pageNo}
                  </button>
                </span>
              );
            })}

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
            if (event.target === event.currentTarget) {
              setIsCreateOpen(false);
            }
          }}
        >
          <div className="card-surface w-full max-w-2xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add Branch</h3>
                <p className="text-xs text-slate-500">เพิ่มข้อมูลสาขาใหม่เข้าสู่ระบบ</p>
              </div>
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
                placeholder="Branch Code (e.g. BR-9001)"
                value={newCode}
                onChange={(event) => setNewCode(event.target.value)}
              />
              <input
                className="input-clean"
                placeholder="Branch Name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />

              <select
                className="input-clean"
                value={newProvince}
                onChange={(event) => setNewProvince(event.target.value)}
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                className="input-clean"
                value={newArea}
                onChange={(event) => setNewArea(event.target.value)}
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              <input
                className="input-clean"
                placeholder="Manager"
                value={newManager}
                onChange={(event) => setNewManager(event.target.value)}
              />
              <input
                className="input-clean"
                placeholder="POS Counter"
                type="number"
                min={1}
                value={newPosCounter}
                onChange={(event) => setNewPosCounter(event.target.value)}
              />

              <input
                className="input-clean md:col-span-2"
                placeholder="Phone"
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
              />
            </div>

            {createError ? <p className="mt-3 px-6 text-sm text-rose-600 sm:px-7">{createError}</p> : null}

            <div className="mt-4 flex justify-end px-6 pb-6 sm:px-7">
              <button
                type="button"
                className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                onClick={onCreateBranch}
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
