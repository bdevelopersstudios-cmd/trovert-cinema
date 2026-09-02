import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { Settings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="border-t border-line/60 bg-ink-soft">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">{settings.venueNote}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.25em] text-tan">Visit</h3>
          <p className="text-sm leading-relaxed text-muted">{settings.locationNote}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.25em] text-tan">Reach us</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                className="transition-colors hover:text-cream"
              >
                WhatsApp {settings.whatsapp}
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${settings.instagram}`}
                className="transition-colors hover:text-cream"
              >
                @{settings.instagram}
              </a>
            </li>
            <li>
              <Link href="/admin" className="transition-colors hover:text-cream">
                Admin dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/40">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Trovert Cinema — a Trovert Space experience.</p>
          <p>11 recliners · 10 slots a day · DHA 5, Lahore</p>
        </div>
      </div>
    </footer>
  );
}
