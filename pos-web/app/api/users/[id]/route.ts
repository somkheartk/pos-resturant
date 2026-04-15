import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const backendApiBase =
  process.env.POS_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

function getBearer(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const response = await fetch(`${backendApiBase}/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getBearer(session.accessToken),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  return NextResponse.json(payload ?? {}, { status: response.status });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const response = await fetch(`${backendApiBase}/users/${id}`, {
    method: "DELETE",
    headers: getBearer(session.accessToken),
  });

  const payload = await response.json().catch(() => null);
  return NextResponse.json(payload ?? {}, { status: response.status });
}
