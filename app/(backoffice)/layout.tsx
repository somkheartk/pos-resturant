import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const employeeCode = `EMP-${session.user.id.slice(-6).toUpperCase()}`;

  return (
    <DashboardShell
      initialRole={session.user.role}
      initialPermissions={session.user.permissions ?? []}
      userName={session.user.name ?? session.user.email ?? "User"}
      employeeCode={employeeCode}
    >
      {children}
    </DashboardShell>
  );
}
