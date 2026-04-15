"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";
type PaymentMethod = "cash" | "card" | "transfer" | "e-wallet";

type ProductOption = {
  _id: string;
  name: string;
  price: number;
  isActive?: boolean;
};

type OrderItem = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
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
  updatedAt?: string;
};

type OrderItemFormState = {
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
};

type OrderFormState = {
  customerName: string;
  branchName: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  itemCount: string;
  items: OrderItemFormState[];
  note: string;
  status: OrderStatus;
};

const statusOptions: OrderStatus[] = ["pending", "paid", "shipped", "cancelled"];
const paymentOptions: PaymentMethod[] = ["cash", "card", "transfer", "e-wallet"];

type DiningTableRow = {
  id: string;
  name: string;
  seats: number;
  zone: string;
};

type DiningServiceType = "Dine in" | "Takeaway" | "Delivery" | "Walk-in";

type DiningInfo = {
  tableLabel: string;
  zone: string;
  seats: number | null;
  serviceType: DiningServiceType;
};

const tablesStorageKey = "pos-web-tables";
const assignmentsStorageKey = "pos-web-table-assignments";

function parseStoredTables(raw: string | null): DiningTableRow[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DiningTableRow[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((table) => table && typeof table.id === "string" && typeof table.name === "string")
      .map((table) => ({
        id: table.id,
        name: table.name,
        seats: Number.isFinite(table.seats) && table.seats > 0 ? table.seats : 4,
        zone: table.zone?.trim() || "Floor",
      }));
  } catch {
    return [];
  }
}

function parseStoredAssignments(raw: string | null): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([tableId, orderId]) => typeof tableId === "string" && typeof orderId === "string" && orderId.length > 0,
      ),
    );
  } catch {
    return {};
  }
}

function inferServiceType(note?: string): DiningServiceType {
  const value = (note ?? "").toLowerCase();
  if (value.includes("takeaway") || value.includes("take away") || value.includes("pickup") || value.includes("กลับบ้าน")) {
    return "Takeaway";
  }
  if (value.includes("delivery") || value.includes("เดลิเวอรี่") || value.includes("ส่ง")) {
    return "Delivery";
  }
  return "Walk-in";
}

function inferTableFromNote(note?: string) {
  const match = note?.match(/(โต๊ะ\s*\d+|table\s*[a-z0-9-]+)/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : "";
}

function getOrderDiningInfo(order: OrderRow, tables: DiningTableRow[], assignments: Record<string, string>): DiningInfo {
  const matchedTable = tables.find((table) => assignments[table.id] === order._id);
  if (matchedTable) {
    return {
      tableLabel: matchedTable.name,
      zone: matchedTable.zone,
      seats: matchedTable.seats,
      serviceType: "Dine in",
    };
  }

  const inferredTable = inferTableFromNote(order.note);
  if (inferredTable) {
    return {
      tableLabel: inferredTable,
      zone: order.branchName ?? "Floor service",
      seats: null,
      serviceType: "Dine in",
    };
  }

  const serviceType = inferServiceType(order.note);
  return {
    tableLabel: serviceType === "Walk-in" ? "Walk-in" : serviceType,
    zone: order.branchName ?? "Main Branch",
    seats: null,
    serviceType,
  };
}

function formatOrderItemsPreview(order: OrderRow) {
  const items = order.items ?? [];
  if (items.length === 0) {
    return `${(order.itemCount ?? 0).toLocaleString()} menu items`;
  }

  const preview = items.slice(0, 2).map((item) => `${item.productName} x${item.quantity}`).join(", ");
  return items.length > 2 ? `${preview} +${items.length - 2} more` : preview;
}

function formatCurrency(value: number) {
  return `${value.toLocaleString()} THB`;
}

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

function statusLabel(status: string) {
  const normalized = normalizeStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function statusTone(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "paid") return "bg-emerald-50 text-emerald-700";
  if (normalized === "shipped") return "bg-sky-50 text-sky-700";
  if (normalized === "cancelled") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
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

function formatPaymentMethod(value?: string) {
  const normalized = (value ?? "cash").trim().toLowerCase();
  if (normalized === "e-wallet") return "E-Wallet";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function initialItemState(): OrderItemFormState {
  return {
    productId: "",
    productName: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function calculateItemLineTotal(item: OrderItemFormState) {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  return Math.max(quantity, 0) * Math.max(unitPrice, 0);
}

function normalizeItemRows(items?: OrderItem[]) {
  if (!items || items.length === 0) {
    return [initialItemState()];
  }

  return items.map((item) => ({
    productId: item.productId ?? "",
    productName: item.productName,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  }));
}

function initialFormState(): OrderFormState {
  return {
    customerName: "",
    branchName: "Main Branch",
    totalAmount: "0",
    paymentMethod: "cash",
    itemCount: "1",
    items: [initialItemState()],
    note: "",
    status: "pending",
  };
}

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [tables, setTables] = useState<DiningTableRow[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<OrderRow | null>(null);
  const [detailRow, setDetailRow] = useState<OrderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [form, setForm] = useState<OrderFormState>(initialFormState);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionRowId, setActionRowId] = useState<string | null>(null);

  async function loadOrders() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("โหลดรายการออเดอร์ไม่สำเร็จ");
      }

      const payload = (await response.json()) as OrderRow[];
      setRows(Array.isArray(payload) ? payload : []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "โหลดรายการออเดอร์ไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as ProductOption[];
        setProducts(
          Array.isArray(payload)
            ? payload.filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0)
            : [],
        );
      } catch {
        // keep manual entry available when product lookup is unavailable
      }
    }

    void loadProducts();
  }, []);

  useEffect(() => {
    const loadTableData = () => {
      setTables(parseStoredTables(window.localStorage.getItem(tablesStorageKey)));
      setAssignments(parseStoredAssignments(window.localStorage.getItem(assignmentsStorageKey)));
    };

    loadTableData();
    window.addEventListener("storage", loadTableData);
    return () => window.removeEventListener("storage", loadTableData);
  }, []);

  useEffect(() => {
    if (!isCreateOpen && !isEditOpen && !deleteTarget && !detailRow) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setDeleteTarget(null);
        setDetailRow(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, detailRow, isCreateOpen, isEditOpen]);

  const orderDiningInfo = useMemo(
    () => new Map(rows.map((row) => [row._id, getOrderDiningInfo(row, tables, assignments)])),
    [assignments, rows, tables],
  );

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      const dining = orderDiningInfo.get(row._id);
      const itemsText = (row.items ?? []).map((item) => item.productName).join(" ");
      const text = `${formatOrderNo(row)} ${row.customerName} ${row.branchName ?? ""} ${dining?.tableLabel ?? ""} ${itemsText}`.toLowerCase();
      const locationText = `${row.branchName ?? ""} ${dining?.zone ?? ""}`.toLowerCase();
      const matchesQuery = !keyword || text.includes(keyword);
      const matchesStatus = !statusFilter || normalizeStatus(row.status) === statusFilter;
      const matchesBranch = !branchFilter || locationText.includes(branchFilter.trim().toLowerCase());
      const matchesPayment = !paymentFilter || (row.paymentMethod ?? "cash").toLowerCase() === paymentFilter;
      return matchesQuery && matchesStatus && matchesBranch && matchesPayment;
    });
  }, [branchFilter, orderDiningInfo, paymentFilter, query, rows, statusFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(startIndex, startIndex + pageSize);
  const paidCount = rows.filter((row) => normalizeStatus(row.status) === "paid").length;
  const pendingCount = rows.filter((row) => normalizeStatus(row.status) === "pending").length;
  const kitchenQueueCount = rows.filter((row) => {
    const normalized = normalizeStatus(row.status);
    return normalized === "pending" || normalized === "shipped";
  }).length;
  const dineInCount = rows.filter((row) => orderDiningInfo.get(row._id)?.serviceType === "Dine in").length;
  const activeTableCount = new Set(
    rows
      .filter((row) => normalizeStatus(row.status) !== "cancelled")
      .map((row) => orderDiningInfo.get(row._id)?.tableLabel)
      .filter((label): label is string => Boolean(label && !["Walk-in", "Takeaway", "Delivery"].includes(label))),
  ).size;
  const totalRevenue = rows
    .filter((row) => normalizeStatus(row.status) !== "cancelled")
    .reduce((sum, row) => sum + row.totalAmount, 0);
  const averageTicket = rows.length > 0 ? totalRevenue / rows.length : 0;
  const totalItems = rows.reduce(
    (sum, row) => sum + (row.itemCount ?? row.items?.reduce((subtotal, item) => subtotal + item.quantity, 0) ?? 0),
    0,
  );
  const detailDining = detailRow ? orderDiningInfo.get(detailRow._id) ?? null : null;

  function resetForm() {
    setForm(initialFormState());
    setFormError("");
  }

  function validateForm() {
    const customerName = form.customerName.trim();
    const branchName = form.branchName.trim();
    const totalAmount = Number(form.totalAmount);
    const itemCount = Number(form.itemCount);
    const normalizedItems = form.items
      .map((item) => {
        const productName = item.productName.trim();
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (!productName && !item.quantity.trim() && !item.unitPrice.trim()) {
          return null;
        }

        if (!productName || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
          return false;
        }

        return {
          productId: item.productId || undefined,
          productName,
          quantity,
          unitPrice,
        };
      })
      .filter((item) => item !== null);

    if (normalizedItems.some((item) => item === false)) {
      setFormError("กรุณากรอกรายการสินค้าให้ครบถ้วน");
      return null;
    }

    const validItems = normalizedItems.filter((item): item is Exclude<typeof item, false> => item !== false);

    if (customerName.length < 2) {
      setFormError("กรุณากรอกชื่อลูกค้าอย่างน้อย 2 ตัวอักษร");
      return null;
    }

    if (branchName.length < 2) {
      setFormError("กรุณากรอกชื่อสาขา");
      return null;
    }

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      setFormError("ยอดรวมออเดอร์ต้องเป็นตัวเลขที่ถูกต้อง");
      return null;
    }

    if (!Number.isFinite(itemCount) || itemCount < 1) {
      setFormError("จำนวนรายการต้องอย่างน้อย 1");
      return null;
    }

    if (validItems.length === 0) {
      setFormError("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return null;
    }

    const computedItemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const computedTotalAmount = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return {
      customerName,
      branchName,
      totalAmount: computedTotalAmount > 0 ? computedTotalAmount : totalAmount,
      paymentMethod: form.paymentMethod,
      itemCount: computedItemCount > 0 ? computedItemCount : itemCount,
      items: validItems,
      note: form.note.trim() || undefined,
      status: form.status,
    };
  }

  function openCreateModal() {
    resetForm();
    setIsCreateOpen(true);
  }

  function openEditModal(row: OrderRow) {
    setEditingRow(row);
    setForm({
      customerName: row.customerName,
      branchName: row.branchName ?? "Main Branch",
      totalAmount: String(row.totalAmount),
      paymentMethod: ((row.paymentMethod ?? "cash").toLowerCase() as PaymentMethod),
      itemCount: String(row.itemCount ?? 1),
      items: normalizeItemRows(row.items),
      note: row.note ?? "",
      status: normalizeStatus(row.status),
    });
    setFormError("");
    setIsEditOpen(true);
  }

  async function onCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateForm();
    if (!payload) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("สร้างออเดอร์ไม่สำเร็จ");
      }

      setIsCreateOpen(false);
      resetForm();
      await loadOrders();
      setPage(1);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "สร้างออเดอร์ไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  async function onUpdateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRow) return;

    const payload = validateForm();
    if (!payload) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${editingRow._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("แก้ไขออเดอร์ไม่สำเร็จ");
      }

      setIsEditOpen(false);
      setEditingRow(null);
      resetForm();
      await loadOrders();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "แก้ไขออเดอร์ไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDeleteOrder(id: string) {
    setActionRowId(id);
    setError("");

    try {
      const response = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("ลบออเดอร์ไม่สำเร็จ");
      }

      setDeleteTarget(null);
      await loadOrders();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "ลบออเดอร์ไม่สำเร็จ");
    } finally {
      setActionRowId(null);
    }
  }

  function updateItem(index: number, field: keyof OrderItemFormState, value: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function selectProduct(index: number, productName: string) {
    const matchedProduct = products.find((product) => product.name === productName);
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId: matchedProduct?._id ?? "",
              productName,
              unitPrice: matchedProduct ? String(matchedProduct.price) : item.unitPrice,
            }
          : item,
      ),
    }));
  }

  function selectProductById(index: number, productId: string) {
    const matchedProduct = products.find((product) => product._id === productId);
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              productName: matchedProduct?.name ?? "",
              unitPrice: matchedProduct ? String(matchedProduct.price) : item.unitPrice,
            }
          : item,
      ),
    }));
  }

  function addItemRow() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, initialItemState()],
    }));
  }

  function removeItemRow(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? [initialItemState()] : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const draftItemsTotal = form.items.reduce((sum, item) => sum + calculateItemLineTotal(item), 0);
  const draftItemsCount = form.items.reduce((sum, item) => sum + Math.max(Number(item.quantity) || 0, 0), 0);
  const activeProducts = products.filter((product) => product.isActive !== false);

  return (
    <main className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card-surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Food Orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{rows.length.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">ออเดอร์อาหารทั้งหมดในระบบ</p>
        </div>
        <div className="card-surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Tables</p>
          <p className="mt-2 text-3xl font-semibold text-indigo-700">{activeTableCount.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">โต๊ะที่กำลังมีรายการอาหาร</p>
        </div>
        <div className="card-surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Kitchen Queue</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{kitchenQueueCount.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">รายการที่รอทำหรือกำลังเสิร์ฟ</p>
        </div>
        <div className="card-surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className="mt-2 text-sm text-slate-500">ชำระแล้ว {paidCount.toLocaleString()} บิล • เฉลี่ย {formatCurrency(averageTicket)}</p>
        </div>
        <div className="card-surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dishes Ordered</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalItems.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">Dine-in {dineInCount.toLocaleString()} orders</p>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Restaurant Orders</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Food Orders & Table Service</h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Pending: {pendingCount.toLocaleString()} • Dine-in: {dineInCount.toLocaleString()}</p>
            <button
              type="button"
              className="gradient-brand rounded-2xl px-4 py-2.5 text-sm font-medium text-white"
              onClick={openCreateModal}
            >
              + New Food Order
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Search</span>
              <input
                className="input-clean bg-white"
                placeholder="Search order no, guest, menu, or table"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Status</span>
              <select
                className="input-clean bg-white"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Zone / Branch</span>
              <input
                className="input-clean bg-white"
                placeholder="Search by zone or branch"
                value={branchFilter}
                onChange={(event) => {
                  setBranchFilter(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Payment</span>
              <select
                className="input-clean bg-white"
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All payment methods</option>
                {paymentOptions.map((payment) => (
                  <option key={payment} value={payment}>
                    {formatPaymentMethod(payment)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">Total: {total.toLocaleString()} orders</p>
            <select
              className="input-clean w-32 bg-white"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">Order</th>
                <th className="py-3">Table</th>
                <th className="py-3">Menu</th>
                <th className="py-3">Service</th>
                <th className="py-3">Payment</th>
                <th className="py-3">Total</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No food orders found
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const dining = orderDiningInfo.get(row._id);

                  return (
                    <tr key={row._id} className="border-b border-slate-100 align-top text-slate-700">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{formatOrderNo(row)}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.customerName} • {formatDate(row.createdAt)}</p>
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{dining?.tableLabel ?? "Walk-in"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dining?.zone ?? row.branchName ?? "Main Branch"}
                          {dining?.seats ? ` • ${dining.seats} seats` : ""}
                        </p>
                      </td>
                      <td className="py-3">
                        <p className="max-w-xs text-sm text-slate-700">{formatOrderItemsPreview(row)}</p>
                        <p className="mt-1 text-xs text-slate-500">{(row.itemCount ?? row.items?.length ?? 0).toLocaleString()} dishes</p>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {dining?.serviceType ?? "Walk-in"}
                        </span>
                      </td>
                      <td className="py-3">{formatPaymentMethod(row.paymentMethod)}</td>
                      <td className="py-3 font-medium text-slate-900">{formatCurrency(row.totalAmount)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(row.status)}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
                            disabled={actionRowId === row._id}
                            onClick={() => setDetailRow(row)}
                          >
                            View
                          </button>
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
              disabled={safePage <= 1 || isLoading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
              disabled={safePage >= totalPages || isLoading}
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
              <h3 className="text-lg font-semibold text-slate-900">Create Food Order</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreateOrder} className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
              <input
                className="input-clean"
                placeholder="Guest / customer name"
                value={form.customerName}
                onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
              />
              <input
                className="input-clean"
                placeholder="Branch or service zone"
                value={form.branchName}
                onChange={(event) => setForm((prev) => ({ ...prev, branchName: event.target.value }))}
              />
              <input
                className="input-clean"
                type="number"
                min={0}
                step="0.01"
                placeholder="Bill total"
                value={form.totalAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, totalAmount: event.target.value }))}
              />
              <input
                className="input-clean"
                type="number"
                min={1}
                step="1"
                placeholder="Number of dishes"
                value={form.itemCount}
                onChange={(event) => setForm((prev) => ({ ...prev, itemCount: event.target.value }))}
              />
              <select
                className="input-clean"
                value={form.paymentMethod}
                onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value as PaymentMethod }))}
              >
                {paymentOptions.map((payment) => (
                  <option key={payment} value={payment}>
                    {formatPaymentMethod(payment)}
                  </option>
                ))}
              </select>
              <select
                className="input-clean"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as OrderStatus }))}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Menu Items</p>
                    <p className="text-xs text-slate-500">เพิ่มเมนูอาหารและราคาต่อจาน ระบบจะคำนวณยอดรวมให้อัตโนมัติ</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                    onClick={addItemRow}
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={`create-item-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1.8fr)_110px_130px_110px]">
                      <div className="space-y-2">
                        <select
                          className="input-clean"
                          value={item.productId}
                          onChange={(event) => selectProductById(index, event.target.value)}
                        >
                          <option value="">Select menu</option>
                          {activeProducts.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} ({formatCurrency(product.price)})
                            </option>
                          ))}
                        </select>
                        <input
                          list="order-product-options"
                          className="input-clean"
                          placeholder="Or type custom product"
                          value={item.productName}
                          onChange={(event) => selectProduct(index, event.target.value)}
                        />
                      </div>
                      <input
                        className="input-clean"
                        type="number"
                        min={1}
                        step="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", event.target.value)}
                      />
                      <input
                        className="input-clean"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                      />
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                        <span>{formatCurrency(calculateItemLineTotal(item))}</span>
                        <button
                          type="button"
                          className="text-rose-600"
                          onClick={() => removeItemRow(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Item Count</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{draftItemsCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Calculated Total</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(draftItemsTotal)}</p>
                  </div>
                </div>
              </div>

              <textarea
                className="input-clean min-h-28 sm:col-span-2"
                placeholder="Note"
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              />

              {formError ? <p className="text-sm text-rose-600 sm:col-span-2">{formError}</p> : null}

              <div className="flex justify-end sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                >
                  {isSaving ? "Saving..." : "Create Food Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditOpen && editingRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsEditOpen(false);
            }
          }}
        >
          <div className="card-surface w-full max-w-2xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
              <h3 className="text-lg font-semibold text-slate-900">Edit Food Order</h3>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setIsEditOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onUpdateOrder} className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6">
              <input
                className="input-clean"
                placeholder="Guest / customer name"
                value={form.customerName}
                onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
              />
              <input
                className="input-clean"
                placeholder="Branch or service zone"
                value={form.branchName}
                onChange={(event) => setForm((prev) => ({ ...prev, branchName: event.target.value }))}
              />
              <input
                className="input-clean"
                type="number"
                min={0}
                step="0.01"
                placeholder="Bill total"
                value={form.totalAmount}
                onChange={(event) => setForm((prev) => ({ ...prev, totalAmount: event.target.value }))}
              />
              <input
                className="input-clean"
                type="number"
                min={1}
                step="1"
                placeholder="Number of dishes"
                value={form.itemCount}
                onChange={(event) => setForm((prev) => ({ ...prev, itemCount: event.target.value }))}
              />
              <select
                className="input-clean"
                value={form.paymentMethod}
                onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value as PaymentMethod }))}
              >
                {paymentOptions.map((payment) => (
                  <option key={payment} value={payment}>
                    {formatPaymentMethod(payment)}
                  </option>
                ))}
              </select>
              <select
                className="input-clean"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as OrderStatus }))}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Menu Items</p>
                    <p className="text-xs text-slate-500">แก้ไขเมนูอาหารเพื่ออัปเดตยอดรวมอัตโนมัติ</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                    onClick={addItemRow}
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={`edit-item-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1.8fr)_110px_130px_110px]">
                      <div className="space-y-2">
                        <select
                          className="input-clean"
                          value={item.productId}
                          onChange={(event) => selectProductById(index, event.target.value)}
                        >
                          <option value="">Select menu</option>
                          {activeProducts.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} ({formatCurrency(product.price)})
                            </option>
                          ))}
                        </select>
                        <input
                          list="order-product-options"
                          className="input-clean"
                          placeholder="Or type custom product"
                          value={item.productName}
                          onChange={(event) => selectProduct(index, event.target.value)}
                        />
                      </div>
                      <input
                        className="input-clean"
                        type="number"
                        min={1}
                        step="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", event.target.value)}
                      />
                      <input
                        className="input-clean"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                      />
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                        <span>{formatCurrency(calculateItemLineTotal(item))}</span>
                        <button
                          type="button"
                          className="text-rose-600"
                          onClick={() => removeItemRow(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Item Count</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{draftItemsCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Calculated Total</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(draftItemsTotal)}</p>
                  </div>
                </div>
              </div>

              <textarea
                className="input-clean min-h-28 sm:col-span-2"
                placeholder="Note"
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              />

              {formError ? <p className="text-sm text-rose-600 sm:col-span-2">{formError}</p> : null}

              <div className="flex justify-end sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="gradient-brand rounded-lg px-4 py-2 text-sm font-medium text-white"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailRow(null);
            }
          }}
        >
          <div className="card-surface w-full max-w-4xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Order Detail</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{formatOrderNo(detailRow)}</h3>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                onClick={() => setDetailRow(null)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 sm:grid-cols-4 sm:px-7 sm:py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Guest</p>
                <p className="mt-1 font-semibold text-slate-900">{detailRow.customerName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Table</p>
                <p className="mt-1 font-semibold text-slate-900">{detailDining?.tableLabel ?? "Walk-in"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {detailDining?.zone ?? detailRow.branchName ?? "Main Branch"}
                  {detailDining?.seats ? ` • ${detailDining.seats} seats` : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Payment</p>
                <p className="mt-1 font-semibold text-slate-900">{formatPaymentMethod(detailRow.paymentMethod)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(detailRow.status)}`}>
                  {statusLabel(detailRow.status)}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-7">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                      <th className="px-4 py-3">Menu</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Unit Price</th>
                      <th className="px-4 py-3">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailRow.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No order items
                        </td>
                      </tr>
                    ) : (
                      (detailRow.items ?? []).map((item, index) => (
                        <tr key={`${item.productName}-${index}`} className="border-b border-slate-100 text-slate-700 last:border-b-0">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.productName}</td>
                          <td className="px-4 py-3">{item.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3">{formatCurrency(item.lineTotal ?? item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Items</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{(detailRow.itemCount ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(detailRow.totalAmount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Date</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatDate(detailRow.createdAt)}</p>
                </div>
              </div>

              {detailRow.note ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Note</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{detailRow.note}</p>
                </div>
              ) : null}
            </div>
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
              <p className="text-xs uppercase tracking-[0.18em] text-rose-500">Delete Order</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">ยืนยันการลบออเดอร์</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                คุณกำลังจะลบออเดอร์
                <span className="font-semibold text-slate-900"> {formatOrderNo(deleteTarget)} </span>
                ของลูกค้า
                <span className="font-semibold text-slate-900"> {deleteTarget.customerName}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              การลบออเดอร์เป็นการลบถาวรและไม่สามารถย้อนกลับได้
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
                onClick={() => void onDeleteOrder(deleteTarget._id)}
              >
                {actionRowId === deleteTarget._id ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <datalist id="order-product-options">
        {activeProducts.map((product) => (
          <option key={product._id} value={product.name}>
            {formatCurrency(product.price)}
          </option>
        ))}
      </datalist>
    </main>
  );
}
