import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const backendApiBase =
  process.env.POS_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

function getBearer(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "10"), 1), 50);
  const search = (searchParams.get("search") ?? "").trim();
  const user = (searchParams.get("user") ?? "").trim();
  const email = (searchParams.get("email") ?? "").trim();
  const role = (searchParams.get("role") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
    user,
    email,
    role,
    status,
  });

  const response = await fetch(`${backendApiBase}/users?${query.toString()}`, {
    cache: "no-store",
    headers: getBearer(session.accessToken),
  });

  if (!response.ok) {
    return NextResponse.json({ message: "Failed to load users" }, { status: response.status });
  }

  const payload = await response.json();
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    email: string;
    password?: string;
    role?: string;
    isActive?: boolean;
  };

  const response = await fetch(`${backendApiBase}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getBearer(session.accessToken),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(payload ?? { message: "Failed to create user" }, { status: response.status });
  }

  return NextResponse.json(payload, { status: 201 });
}
