import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function LoginPage() {
  const jar = await cookies();
  if (await isValidSession(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm rounded-card border border-line/70 bg-surface p-8">
        <div className="mb-8 flex justify-center">
          <Logo size={64} stacked href={null} />
        </div>
        <h1 className="text-center font-display text-2xl font-bold text-cream">
          Box office access
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Enter the admin passcode to manage movies, slots and bookings.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
