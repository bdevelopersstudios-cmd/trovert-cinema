"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/movies", label: "Movies" },
  { href: "/admin/slots", label: "Time slots" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-line/60 bg-ink-soft lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col gap-4 px-4 py-4 sm:px-5 lg:gap-6 lg:py-6">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-line px-3.5 py-2 text-xs text-muted lg:hidden"
          >
            Sign out
          </button>
        </div>

        <nav className="flex-1">
          <ul className="scroll-x -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {nav.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={`block rounded-xl px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                      active
                        ? "bg-red/15 text-cream ring-1 ring-red/40"
                        : "text-muted hover:bg-surface hover:text-cream"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden space-y-2 lg:block">
          <Link
            href="/"
            className="block rounded-xl px-4 py-2.5 text-sm text-muted transition-colors hover:text-cream"
          >
            View public site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-muted transition-colors hover:text-red-bright"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
