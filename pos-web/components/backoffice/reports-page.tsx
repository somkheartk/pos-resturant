"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

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

type DailySummaryRow = {
  dateKey: string;
  label: string;
  orders: number;
  items: number;
  revenue: number;
  averageTicket: number;
  paymentMix: string;
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthInputValue() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
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

function isPaidOrder(order: OrderRow) {
  const normalized = normalizeStatus(order.status);
  return normalized === "paid" || normalized === "shipped";
}

function extractOrderRows(payload: unknown): OrderRow[] {
  if (Array.isArray(payload)) {
    return payload as OrderRow[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; items?: unknown; results?: unknown };

    if (Array.isArray(record.data)) return record.data as OrderRow[];
    if (Array.isArray(record.items)) return record.items as OrderRow[];
    if (Array.isArray(record.results)) return record.results as OrderRow[];
  }

  return [];
}

function formatCurrency(value: number) {
  return `${value.toLocaleString()} THB`;
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

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatPaymentMethod(value?: string) {
  const normalized = (value ?? "cash").trim().toLowerCase();
  if (normalized === "e-wallet") return "E-Wallet";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getLocalDateKey(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOrderItemCount(order: OrderRow) {
  return order.itemCount ?? order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export default function SalesReportsPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(startOfMonthInputValue);
  const [endDate, setEndDate] = useState(todayInputValue);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("โหลดข้อมูลรายงานยอดขายไม่สำเร็จ");
        }

        const payload = (await response.json()) as unknown;
        setRows(extractOrderRows(payload));
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "โหลดข้อมูลรายงานยอดขายไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const paidOrders = useMemo(() => rows.filter(isPaidOrder), [rows]);

  const filteredOrders = useMemo(() => {
    return paidOrders.filter((order) => {
      const dateKey = getLocalDateKey(order.createdAt);
      if (!dateKey) return false;
      if (startDate && dateKey < startDate) return false;
      if (endDate && dateKey > endDate) return false;
      return true;
    });
  }, [endDate, paidOrders, startDate]);

  const dailySummary = useMemo<DailySummaryRow[]>(() => {
    const byDay = new Map<
      string,
      { orders: number; items: number; revenue: number; payments: Record<string, number> }
    >();

    for (const order of filteredOrders) {
      const dateKey = getLocalDateKey(order.createdAt);
      if (!dateKey) continue;

      const itemCount = getOrderItemCount(order);
      const payment = formatPaymentMethod(order.paymentMethod);
      const current = byDay.get(dateKey) ?? {
        orders: 0,
        items: 0,
        revenue: 0,
        payments: {},
      };

      current.orders += 1;
      current.items += itemCount;
      current.revenue += order.totalAmount;
      current.payments[payment] = (current.payments[payment] ?? 0) + 1;
      byDay.set(dateKey, current);
    }

    return Array.from(byDay.entries())
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([dateKey, value]) => {
        const paymentMix = Object.entries(value.payments)
          .sort((left, right) => right[1] - left[1])
          .map(([payment, count]) => `${payment} ${count}`)
          .join(", ");

        return {
          dateKey,
          label: formatDayLabel(dateKey),
          orders: value.orders,
          items: value.items,
          revenue: value.revenue,
          averageTicket: value.orders > 0 ? value.revenue / value.orders : 0,
          paymentMix,
        };
      });
  }, [filteredOrders]);

  const totals = useMemo(() => {
    const revenue = dailySummary.reduce((sum, row) => sum + row.revenue, 0);
    const orders = dailySummary.reduce((sum, row) => sum + row.orders, 0);
    const items = dailySummary.reduce((sum, row) => sum + row.items, 0);
    const averagePerDay = dailySummary.length > 0 ? revenue / dailySummary.length : 0;

    return {
      revenue,
      orders,
      items,
      days: dailySummary.length,
      averagePerDay,
    };
  }, [dailySummary]);

  const trendChartData = useMemo(() => {
    return [...dailySummary].sort((left, right) => left.dateKey.localeCompare(right.dateKey)).slice(-7);
  }, [dailySummary]);

  const trendMaxRevenue = useMemo(() => {
    return trendChartData.reduce((max, row) => Math.max(max, row.revenue), 0);
  }, [trendChartData]);

  const bestDay = useMemo(() => {
    return trendChartData.reduce<DailySummaryRow | null>((currentBest, row) => {
      if (!currentBest || row.revenue > currentBest.revenue) {
        return row;
      }
      return currentBest;
    }, null);
  }, [trendChartData]);

  const paymentSummary = useMemo(() => {
    const byPayment = new Map<string, { count: number; amount: number }>();

    for (const order of filteredOrders) {
      const payment = formatPaymentMethod(order.paymentMethod);
      const current = byPayment.get(payment) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += order.totalAmount;
      byPayment.set(payment, current);
    }

    return Array.from(byPayment.entries())
      .map(([label, value]) => ({
        label,
        count: value.count,
        amount: value.amount,
        share: totals.revenue > 0 ? (value.amount / totals.revenue) * 100 : 0,
      }))
      .sort((left, right) => right.amount - left.amount);
  }, [filteredOrders, totals.revenue]);

  function exportExcel() {
    if (filteredOrders.length === 0) {
      return;
    }

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(
      dailySummary.map((row) => ({
        Date: row.label,
        Orders: row.orders,
        Items: row.items,
        Revenue: row.revenue,
        AverageTicket: row.averageTicket,
        PaymentMix: row.paymentMix,
      })),
    );

    const ordersSheet = XLSX.utils.json_to_sheet(
      filteredOrders.map((order) => ({
        Date: formatDateTime(order.createdAt),
        OrderNo: formatOrderNo(order),
        Customer: order.customerName,
        Branch: order.branchName ?? "Main Branch",
        Payment: formatPaymentMethod(order.paymentMethod),
        Items: getOrderItemCount(order),
        Total: order.totalAmount,
        Note: order.note ?? "",
      })),
    );

    summarySheet["!cols"] = [
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 },
    ];
    ordersSheet["!cols"] = [
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 10 },
      { wch: 16 },
      { wch: 26 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Daily Sales");
    XLSX.utils.book_append_sheet(workbook, ordersSheet, "Orders");

    const fileSuffix = `${startDate || "all"}_${endDate || "all"}`;
    XLSX.writeFile(workbook, `sales-report-${fileSuffix}.xlsx`);
  }

  return (
    <main className="space-y-4">
      <section className="card-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sales Analytics</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Daily Sales Report</h2>
            <p className="mt-2 text-sm text-slate-500">สรุปยอดขายรายวันจากออเดอร์ที่ชำระเงินแล้ว พร้อม export เป็นไฟล์ Excel</p>
          </div>
          <button
            type="button"
            className="gradient-brand rounded-2xl px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={exportExcel}
            disabled={filteredOrders.length === 0}
          >
            Export Excel
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Revenue</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(totals.revenue)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Paid Orders</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.orders.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Items Sold</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.items.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg / Day</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(totals.averagePerDay)}</p>
          </div>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Start date</span>
            <input className="input-clean bg-white" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">End date</span>
            <input className="input-clean bg-white" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
              onClick={() => {
                setStartDate(startOfMonthInputValue());
                setEndDate(todayInputValue());
              }}
            >
              Reset range
            </button>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="card-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">ภาพรวมรายได้ย้อนหลังล่าสุด</p>
              <h3 className="text-lg font-semibold text-slate-900">Revenue trend</h3>
            </div>
            {bestDay ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">Peak day</p>
                <p className="text-sm font-semibold text-emerald-900">{bestDay.label}</p>
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading chart...</p>
          ) : trendChartData.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">ยังไม่มีข้อมูลพอสำหรับแสดงกราฟ</p>
          ) : (
            <>
              <div className="mt-6 flex h-56 items-end gap-2">
                {trendChartData.map((row) => {
                  const barHeight = trendMaxRevenue > 0 ? Math.max((row.revenue / trendMaxRevenue) * 100, 12) : 0;

                  return (
                    <div key={row.dateKey} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end">
                        <div
                          className="w-full rounded-t-2xl bg-gradient-to-t from-sky-600 via-cyan-500 to-cyan-300"
                          style={{ height: `${barHeight}%` }}
                          title={`${row.label}: ${formatCurrency(row.revenue)}`}
                        />
                      </div>
                      <div className="w-full text-center">
                        <p className="text-[11px] font-semibold text-slate-900">{row.orders.toLocaleString()} orders</p>
                        <p className="truncate text-[10px] text-slate-500">{row.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Best day revenue</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{bestDay ? formatCurrency(bestDay.revenue) : "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Average ticket</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{bestDay ? formatCurrency(bestDay.averageTicket) : "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Selling days</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{totals.days.toLocaleString()} day(s)</p>
                </div>
              </div>
            </>
          )}
        </article>

        <article className="card-surface p-5 sm:p-6">
          <div>
            <p className="text-sm text-slate-500">สัดส่วนยอดขายตามช่องทางชำระเงิน</p>
            <h3 className="text-lg font-semibold text-slate-900">Payment mix</h3>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading payment data...</p>
          ) : paymentSummary.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">ยังไม่มีรายการชำระเงินในช่วงที่เลือก</p>
          ) : (
            <div className="mt-6 space-y-4">
              {paymentSummary.map((item, index) => {
                const barClasses = ["bg-slate-900", "bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];

                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.count.toLocaleString()} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-slate-500">{item.share.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${barClasses[index % barClasses.length]}`}
                        style={{ width: `${Math.max(item.share, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{totals.days.toLocaleString()} day(s) in range</p>
            <h3 className="text-lg font-semibold text-slate-900">Daily breakdown</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">Date</th>
                <th className="py-3">Orders</th>
                <th className="py-3">Items</th>
                <th className="py-3">Revenue</th>
                <th className="py-3">Average Ticket</th>
                <th className="py-3">Payment Mix</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Loading report...
                  </td>
                </tr>
              ) : dailySummary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    ไม่พบยอดขายในช่วงวันที่ที่เลือก
                  </td>
                </tr>
              ) : (
                dailySummary.map((row) => (
                  <tr key={row.dateKey} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium text-slate-900">{row.label}</td>
                    <td className="py-3">{row.orders.toLocaleString()}</td>
                    <td className="py-3">{row.items.toLocaleString()}</td>
                    <td className="py-3">{formatCurrency(row.revenue)}</td>
                    <td className="py-3">{formatCurrency(row.averageTicket)}</td>
                    <td className="py-3">{row.paymentMix || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-surface overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{filteredOrders.length.toLocaleString()} paid orders</p>
            <h3 className="text-lg font-semibold text-slate-900">Order details in range</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3">Date</th>
                <th className="py-3">Order No</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Branch</th>
                <th className="py-3">Payment</th>
                <th className="py-3">Items</th>
                <th className="py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    ไม่มีออเดอร์ที่ชำระแล้วในช่วงวันที่นี้
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3">{formatDateTime(order.createdAt)}</td>
                    <td className="py-3 font-medium text-slate-900">{formatOrderNo(order)}</td>
                    <td className="py-3">{order.customerName}</td>
                    <td className="py-3">{order.branchName ?? "Main Branch"}</td>
                    <td className="py-3">{formatPaymentMethod(order.paymentMethod)}</td>
                    <td className="py-3">{getOrderItemCount(order).toLocaleString()}</td>
                    <td className="py-3">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}