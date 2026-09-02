"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/#now-showing", label: "Now Showing" },
  { href: "/#slots", label: "Slots" },
  { href: "/#packages", label: "Packages" },
  { href: "/#visit", label: "Visit" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  // Never leave the sheet open behind a resize into the desktop layout.
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(min-width: 768px)");
    const close = () => setOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/90 backdrop-blur-xl">
      <nav className="container-page flex h-[4.25rem] items-center justify-between gap-3 sm:h-[4.5rem]">
        <Logo />

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-cream"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin"
            className="hidden text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-cream sm:block"
          >
            Admin
          </Link>
          <Link
            href="/book"
            className="rounded-full bg-red px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-red-bright sm:px-5"
          >
            Book<span className="hidden sm:inline"> a slot</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-1 flex h-11 w-11 items-center justify-center rounded-full text-cream md:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute inset-x-0 top-0 h-0.5 rounded bg-current transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
              />
              <span
                className={`absolute inset-x-0 top-[7px] h-0.5 rounded bg-current transition-opacity ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`absolute inset-x-0 top-[14px] h-0.5 rounded bg-current transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line/60 bg-ink md:hidden">
          <ul className="container-page py-2">
            {[...links, { href: "/admin", label: "Admin dashboard" }].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line/40 py-3.5 text-sm text-cream last:border-0"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
