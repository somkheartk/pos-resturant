import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const backendApiBase =
  process.env.POS_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

type DashboardMetric = {
  label: string;
  value: number;
  note: string;
  tone: string;
};

function extractCollectionCount(payload: unknown): number {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (payload && typeof payload === "object") {
    const record = payload as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
      meta?: { total?: unknown };
      total?: unknown;
    };

    if (typeof record.total === "number") return record.total;
    if (typeof record.meta?.total === "number") return record.meta.total;
    if (Array.isArray(record.data)) return record.data.length;
    if (Array.isArray(record.items)) return record.items.length;
    if (Array.isArray(record.results)) return record.results.length;
  }

  return 0;
}

async function fetchCollectionSize(url: string, authHeader?: string): Promise<number> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: authHeader
        ? {
            Authorization: authHeader,
          }
        : undefined,
    });

    if (!response.ok) {
      return 0;
    }

    const payload = (await response.json()) as unknown;
    return extractCollectionCount(payload);
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const bearer = session?.accessToken ? `Bearer ${session.accessToken}` : undefined;

  const [users, products, inventory, orders] = await Promise.all([
    fetchCollectionSize(`${backendApiBase}/users`, bearer),
    fetchCollectionSize(`${backendApiBase}/products`, bearer),
    fetchCollectionSize(`${backendApiBase}/inventory`, bearer),
    fetchCollectionSize(`${backendApiBase}/orders`, bearer),
  ]);

  const cards: DashboardMetric[] = [
    { label: "Active Users", value: users, note: "team access", tone: "from-sky-500 to-cyan-400" },
    { label: "Menu Items", value: products, note: "restaurant menu", tone: "from-violet-500 to-fuchsia-400" },
    { label: "Inventory", value: inventory, note: "stock records", tone: "from-emerald-500 to-lime-400" },
    { label: "Orders", value: orders, note: "sales flow", tone: "from-amber-500 to-orange-400" },
  ];

  const maxValue = Math.max(1, ...cards.map((card) => card.value));
  const totalVolume = cards.reduce((sum, card) => sum + card.value, 0);

  return (
    <main className="space-y-5">
      <section className="card-surface overflow-hidden p-6">
        <p className="text-sm text-slate-600">Role ที่ login อยู่</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{session?.user.role ?? "staff"}</h2>
        <p className="mt-2 text-sm text-slate-500">มุมมองภาพรวมการจัดการ Point of Sale พร้อมกราฟสรุปภาพรวม</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="card-surface p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value.toLocaleString()}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="card-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">ภาพรวมตัวเลขล่าสุดในระบบ</p>
              <h3 className="text-lg font-semibold text-slate-900">Operational graph</h3>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Total volume</p>
              <p className="text-sm font-semibold text-slate-900">{totalVolume.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 flex h-56 items-end gap-3">
            {cards.map((card) => {
              const barHeight = card.value > 0 ? Math.max((card.value / maxValue) * 100, 12) : 0;

              return (
                <div key={card.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full items-end">
                    <div className={`w-full rounded-t-2xl bg-gradient-to-t ${card.tone}`} style={{ height: `${barHeight}%` }} />
                  </div>
                  <div className="w-full text-center">
                    <p className="text-sm font-semibold text-slate-900">{card.value.toLocaleString()}</p>
                    <p className="truncate text-[11px] text-slate-500">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card-surface p-6">
          <div>
            <p className="text-sm text-slate-500">สัดส่วนข้อมูลในแต่ละส่วนของระบบ</p>
            <h3 className="text-lg font-semibold text-slate-900">Distribution</h3>
          </div>

          <div className="mt-6 space-y-4">
            {cards.map((card) => {
              const share = totalVolume > 0 ? (card.value / totalVolume) * 100 : 0;

              return (
                <div key={card.label} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{card.label}</p>
                      <p className="text-xs text-slate-500">{card.note}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{share.toFixed(0)}%</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${card.tone}`}
                      style={{ width: `${Math.max(share, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
