"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

type OrderItem = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type OrderRow = {
  _id: string;
  orderNo?: string;
  customerName: string;
  branchName?: string;
  totalAmount: number;
  paymentMethod?: string;
  itemCount?: number;
  items?: OrderItem[];
  note?: string;
  status: string;
  createdAt?: string;
};

type TableRow = {
  id: string;
  name: string;
  seats: number;
  zone: string;
};

const tablesStorageKey = "pos-web-tables";
const assignmentsStorageKey = "pos-web-table-assignments";

const defaultTables: TableRow[] = Array.from({ length: 12 }, (_, index) => ({
  id: `table-${index + 1}`,
  name: `โต๊ะ ${index + 1}`,
  seats: index % 3 === 0 ? 6 : 4,
  zone: index < 6 ? "Indoor" : "Terrace",
}));

function normalizeStatus(status: string): OrderStatus {
  const normalized = (status ?? "").trim().toLowerCase();

  if (["paid", "completed", "complete", "success", "succeeded", "done", "closed"].includes(normalized)) {
    return "paid";
  }

  if (["shipped", "ready", "served", "serving", "fulfilled", "delivered"].includes(normalized)) {
    return "shipped";
  }

  if (["cancelled", "canceled", "void", "rejected"].includes(normalized)) {
    return "cancelled";
  }

  return "pending";
}

function isActiveOrder(status: string) {
  const normalized = normalizeStatus(status);
  return normalized === "pending" || normalized === "shipped";
}

function statusLabel(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "paid") return "Paid";
  if (normalized === "shipped") return "Ready";
  if (normalized === "cancelled") return "Cancelled";
  return "Pending";
}

function statusTone(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "shipped") return "border-sky-200 bg-sky-50 text-sky-700";
  if (normalized === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function formatCurrency(value: number) {
  return `${value.toLocaleString()} THB`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatOrderNo(order: OrderRow) {
  if (order.orderNo?.trim()) {
    return order.orderNo.trim().toUpperCase();
  }

  const date = order.createdAt ? new Date(order.createdAt) : new Date();
  const y = String(date.getFullYear()).slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = order._id.slice(-4).toUpperCase();
  return `SO-${y}${m}${d}-${suffix}`;
}

function parseStoredTables(raw: string | null) {
  if (!raw) return defaultTables;

  try {
    const parsed = JSON.parse(raw) as TableRow[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultTables;
    }

    return parsed
      .filter((table) => table && typeof table.id === "string" && typeof table.name === "string")
      .map((table) => ({
        id: table.id,
        name: table.name,
        seats: Number.isFinite(table.seats) && table.seats > 0 ? table.seats : 4,
        zone: table.zone?.trim() || "Indoor",
      }));
  } catch {
    return defaultTables;
  }
}

function parseStoredAssignments(raw: string | null) {
  if (!raw) return {} as Record<string, string>;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([tableId, orderId]) => typeof tableId === "string" && typeof orderId === "string" && orderId.length > 0,
      ),
    );
  } catch {
    return {};
  }
}

function waitForActionFeedback() {
  return new Promise((resolve) => window.setTimeout(resolve, 250));
}

export default function TablesPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>(defaultTables);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "occupied" | "vacant">("all");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draftOrderId, setDraftOrderId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");
  const [newTableZone, setNewTableZone] = useState("Indoor");
  const [formError, setFormError] = useState("");
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [activeTableActionId, setActiveTableActionId] = useState<string | null>(null);

  useEffect(() => {
    setTables(parseStoredTables(window.localStorage.getItem(tablesStorageKey)));
    setAssignments(parseStoredAssignments(window.localStorage.getItem(assignmentsStorageKey)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(tablesStorageKey, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    window.localStorage.setItem(assignmentsStorageKey, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("โหลดรายการออเดอร์ไม่สำเร็จ");
        }

        const payload = (await response.json()) as OrderRow[];
        setOrders(Array.isArray(payload) ? payload : []);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "โหลดรายการออเดอร์ไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((order) => isActiveOrder(order.status)),
    [orders],
  );

  useEffect(() => {
    const validTableIds = new Set(tables.map((table) => table.id));
    const validOrderIds = new Set(activeOrders.map((order) => order._id));

    setAssignments((prev) => {
      const usedOrders = new Set<string>();
      const nextEntries = Object.entries(prev).filter(([tableId, orderId]) => {
        if (!validTableIds.has(tableId) || !validOrderIds.has(orderId) || usedOrders.has(orderId)) {
          return false;
        }
        usedOrders.add(orderId);
        return true;
      });

      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [activeOrders, tables]);

  const orderById = useMemo(() => new Map(orders.map((order) => [order._id, order])), [orders]);

  const tableCards = useMemo(() => {
    return tables
      .map((table) => {
        const assignedOrder = assignments[table.id] ? orderById.get(assignments[table.id]) ?? null : null;
        return {
          table,
          assignedOrder,
          isOccupied: Boolean(assignedOrder && isActiveOrder(assignedOrder.status)),
        };
      })
      .filter(({ table, assignedOrder, isOccupied }) => {
        const keyword = query.trim().toLowerCase();
        const haystack = `${table.name} ${table.zone} ${assignedOrder?.customerName ?? ""} ${assignedOrder ? formatOrderNo(assignedOrder) : ""}`.toLowerCase();
        const matchesQuery = !keyword || haystack.includes(keyword);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "occupied" && isOccupied) ||
          (statusFilter === "vacant" && !isOccupied);
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => left.table.name.localeCompare(right.table.name, "th"));
  }, [assignments, orderById, query, statusFilter, tables]);

  const occupiedCount = tableCards.filter((item) => item.isOccupied).length;
  const vacantCount = tableCards.length - occupiedCount;
  const unassignedActiveOrders = Math.max(activeOrders.length - Object.keys(assignments).length, 0);

  const selectedTable = selectedTableId ? tables.find((table) => table.id === selectedTableId) ?? null : null;
  const selectedOrder =
    selectedTable && assignments[selectedTable.id] ? orderById.get(assignments[selectedTable.id]) ?? null : null;
  const isUpdatingSelectedTable = selectedTable ? activeTableActionId === selectedTable.id : false;

  const availableOrders = useMemo(() => {
    if (!selectedTable) return activeOrders;

    const currentOrderId = assignments[selectedTable.id] ?? "";
    const usedByOtherTables = new Set(
      Object.entries(assignments)
        .filter(([tableId]) => tableId !== selectedTable.id)
        .map(([, orderId]) => orderId),
    );

    return activeOrders.filter((order) => order._id === currentOrderId || !usedByOtherTables.has(order._id));
  }, [activeOrders, assignments, selectedTable]);

  useEffect(() => {
    if (!selectedTable) return;
    setDraftOrderId(assignments[selectedTable.id] ?? "");
  }, [assignments, selectedTable]);

  function openTable(tableId: string) {
    setSelectedTableId(tableId);
    setDraftOrderId(assignments[tableId] ?? "");
  }

  function closeDetail() {
    setSelectedTableId(null);
    setDraftOrderId("");
  }

  async function saveAssignment() {
    if (!selectedTable) return;

    setActiveTableActionId(selectedTable.id);
    setFormError("");

    try {
      await waitForActionFeedback();
      setAssignments((prev) => {
        const next = { ...prev };
        for (const [tableId, orderId] of Object.entries(next)) {
          if (tableId !== selectedTable.id && orderId === draftOrderId) {
            delete next[tableId];
          }
        }

        if (!draftOrderId) {
          delete next[selectedTable.id];
        } else {
          next[selectedTable.id] = draftOrderId;
        }
        return next;
      });
    } finally {
      setActiveTableActionId(null);
    }
  }

  async function clearAssignment() {
    if (!selectedTable) return;

    setActiveTableActionId(selectedTable.id);
    try {
      await waitForActionFeedback();
      setDraftOrderId("");
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[selectedTable.id];
        return next;
      });
    } finally {
      setActiveTableActionId(null);
    }
  }

  async function addTable() {
    const name = newTableName.trim();
    const seats = Number(newTableSeats);

    if (name.length < 2) {
      setFormError("กรุณากรอกชื่อโต๊ะ");
      return;
    }

    if (!Number.isFinite(seats) || seats < 1) {
      setFormError("จำนวนที่นั่งต้องมากกว่า 0");
      return;
    }

    if (tables.some((table) => table.name.toLowerCase() === name.toLowerCase())) {
      setFormError("ชื่อโต๊ะนี้มีอยู่แล้ว");
      return;
    }

    setIsCreatingTable(true);

    try {
      await waitForActionFeedback();

      const nextTable: TableRow = {
        id: `table-${Date.now()}`,
        name,
        seats,
        zone: newTableZone.trim() || "Indoor",
      };

      setTables((prev) => [nextTable, ...prev]);
      setNewTableName("");
      setNewTableSeats("4");
      setNewTableZone("Indoor");
      setFormError("");
      setIsCreateOpen(false);
    } finally {
      setIsCreatingTable(false);
    }
  }

  return (
    <main className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Floor Control</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Tables Management</h2>
              <p className="mt-2 text-sm text-slate-500">ดูว่าโต๊ะว่างหรือไม่, ผูก order กับโต๊ะ, และเปิดดูรายละเอียด order ได้ในหน้าเดียว</p>
            </div>
            <button
              type="button"
              className="gradient-brand rounded-2xl px-4 py-2.5 text-sm font-medium text-white"
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
            >
              + เพิ่มโต๊ะ
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">โต๊ะทั้งหมด</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{tables.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">ไม่ว่าง</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-700">{occupiedCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">ว่าง</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{vacantCount}</p>
            </div>
          </div>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live Queue</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Open Orders</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">พร้อมจัดโต๊ะ</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{activeOrders.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-700">ยังไม่ผูกโต๊ะ</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{unassignedActiveOrders}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">รายการโต๊ะและการผูก order จะถูกเก็บใน browser นี้จนกว่าจะมี schema โต๊ะใน backend</p>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.9fr)_minmax(180px,0.8fr)]">
          <label className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Search table</span>
            <input
              className="input-clean mt-2 bg-white"
              placeholder="ค้นหาชื่อโต๊ะ, โซน หรือชื่อลูกค้า"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Status</span>
            <select
              className="input-clean mt-2 bg-white"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "occupied" | "vacant")}
            >
              <option value="all">ทั้งหมด</option>
              <option value="occupied">ไม่ว่าง</option>
              <option value="vacant">ว่าง</option>
            </select>
          </label>

          <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Results</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{tableCards.length} โต๊ะ</p>
            <p className="text-xs text-slate-500">ตามตัวกรองที่เลือก</p>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="card-surface col-span-full p-8 text-center text-slate-500">Loading tables...</div>
        ) : tableCards.length === 0 ? (
          <div className="card-surface col-span-full p-8 text-center text-slate-500">ไม่พบข้อมูลโต๊ะตามเงื่อนไขที่เลือก</div>
        ) : (
          tableCards.map(({ table, assignedOrder, isOccupied }) => (
            <button
              key={table.id}
              type="button"
              className="card-surface text-left transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => openTable(table.id)}
            >
              <div className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{table.zone}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{table.name}</h3>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      isOccupied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {isOccupied ? "ไม่ว่าง" : "ว่าง"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span>Seats</span>
                  <span className="font-semibold text-slate-900">{table.seats}</span>
                </div>

                {assignedOrder ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Current order</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatOrderNo(assignedOrder)}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(assignedOrder.status)}`}>
                        {statusLabel(assignedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{assignedOrder.customerName}</p>
                      <p className="mt-1 text-sm text-slate-500">{assignedOrder.itemCount ?? 0} items • {formatCurrency(assignedOrder.totalAmount)}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatDateTime(assignedOrder.createdAt)}</p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    ยังไม่มี order ผูกกับโต๊ะนี้
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">คลิกเพื่อจัดการโต๊ะ</span>
                  <span className="font-medium text-teal-700">ดูรายละเอียด</span>
                </div>
              </div>
            </button>
          ))
        )}
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
          <div className="card-surface w-full max-w-lg overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">เพิ่มโต๊ะใหม่</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 px-6 py-5">
              <input
                className="input-clean"
                placeholder="เช่น โต๊ะ 13"
                value={newTableName}
                onChange={(event) => setNewTableName(event.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input-clean"
                  type="number"
                  min={1}
                  placeholder="จำนวนที่นั่ง"
                  value={newTableSeats}
                  onChange={(event) => setNewTableSeats(event.target.value)}
                />
                <input
                  className="input-clean"
                  placeholder="โซน เช่น Indoor"
                  value={newTableZone}
                  onChange={(event) => setNewTableZone(event.target.value)}
                />
              </div>
              {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
              <button
                type="button"
                className="gradient-brand rounded-2xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                disabled={isCreatingTable}
                onClick={() => void addTable()}
              >
                {isCreatingTable ? "กำลังบันทึก..." : "บันทึกโต๊ะ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTable ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetail();
            }
          }}
        >
          <div className="card-surface w-full max-w-3xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Table Detail</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedTable.name}</h3>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={closeDetail}
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[0.95fr_1.35fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">สถานะโต๊ะ</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">{selectedTable.zone} • {selectedTable.seats} seats</span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        selectedOrder
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {selectedOrder ? "ไม่ว่าง" : "ว่าง"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Assign order</p>
                  {isUpdatingSelectedTable ? <p className="text-xs text-amber-600">กำลังอัปเดตข้อมูลโต๊ะ...</p> : null}
                  <select
                    className="input-clean bg-slate-50"
                    value={draftOrderId}
                    disabled={isUpdatingSelectedTable}
                    onChange={(event) => setDraftOrderId(event.target.value)}
                  >
                    <option value="">ยังไม่ผูก order</option>
                    {availableOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        {formatOrderNo(order)} • {order.customerName}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      className="gradient-brand rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      disabled={isUpdatingSelectedTable}
                      onClick={() => void saveAssignment()}
                    >
                      {isUpdatingSelectedTable ? "กำลังบันทึก..." : "บันทึกการผูกโต๊ะ"}
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                      disabled={isUpdatingSelectedTable}
                      onClick={() => void clearAssignment()}
                    >
                      {isUpdatingSelectedTable ? "กำลังเคลียร์..." : "เคลียร์โต๊ะ"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Order No</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatOrderNo(selectedOrder)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Customer</p>
                        <p className="mt-1 font-semibold text-slate-900">{selectedOrder.customerName}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p>
                        <p className="mt-1">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(selectedOrder.status)}`}>
                            {statusLabel(selectedOrder.status)}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Order items</p>
                          <p className="mt-1 text-sm text-slate-500">{formatDateTime(selectedOrder.createdAt)}</p>
                        </div>
                        <p className="text-sm font-medium text-slate-700">{selectedOrder.itemCount ?? selectedOrder.items?.length ?? 0} items</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedOrder.items?.length ? (
                          selectedOrder.items.map((item, index) => (
                            <div key={`${selectedOrder._id}-${item.productName}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900">{item.productName}</p>
                                <p className="text-sm text-slate-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                              </div>
                              <p className="font-semibold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            ไม่มีรายละเอียดสินค้าใน order นี้
                          </div>
                        )}
                      </div>
                      {selectedOrder.note ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Note: {selectedOrder.note}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <p className="text-base font-medium text-slate-900">โต๊ะนี้ยังว่าง</p>
                    <p className="mt-2 text-sm text-slate-500">เลือก order ที่ยังเปิดอยู่จากรายการด้านซ้ายเพื่อผูกกับโต๊ะนี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}