import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const backendApiBase =
  process.env.POS_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

type CountResponse = {
  users: number;
  branches: number;
  products: number;
  category: number;
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
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bearer = session.accessToken ? `Bearer ${session.accessToken}` : undefined;

  const [users, products, branches, category] = await Promise.all([
    fetchCollectionSize(`${backendApiBase}/users`, bearer),
    fetchCollectionSize(`${backendApiBase}/products`, bearer),
    // Temporary mapping: backend has inventory/orders, not branches/category yet.
    fetchCollectionSize(`${backendApiBase}/inventory`, bearer),
    fetchCollectionSize(`${backendApiBase}/orders`, bearer),
  ]);

  const data: CountResponse = {
    users,
    branches,
    products,
    category,
  };

  return NextResponse.json(data);
}
