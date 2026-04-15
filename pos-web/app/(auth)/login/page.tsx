import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(15,23,42,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(161,98,7,0.14),transparent_35%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
      </div>

      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-7 shadow-[0_35px_90px_-45px_rgba(2,6,23,0.45)] backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

        <div className="relative mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.36em] text-amber-700">Point of Sale Backoffice</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Welcome Back</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            จัดการ users, ร้านสาขา, products และ category ได้จากพื้นที่ทำงานเดียว
          </p>
        </div>

        <div className="relative">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
