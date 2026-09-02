import Link from "next/link";
import { db } from "@/lib/db";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroHall } from "@/components/site/HeroHall";
import { formatPKR, slotDurationMins } from "@/lib/format";
import { TOTAL_SEATS } from "@/lib/seats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [movies, slots, packages, settings] = await Promise.all([
    db.listMovies({ activeOnly: true }),
    db.listSlots({ activeOnly: true }),
    db.listPackages({ activeOnly: true }),
    db.getSettings(),
  ]);

  const day = slots.filter((s) => s.period === "afternoon-evening");
  const night = slots.filter((s) => s.period === "late-night-morning");

  return (
    <div className="min-h-screen bg-ink">
      <SiteNav />

      {/* ------------------------------------------------------------- hero */}
      <section className="film-grain relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <HeroHall />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/85 via-ink/55 to-ink" />

        <div className="container-page relative flex min-h-[32rem] flex-col justify-center py-20 sm:min-h-[38rem] sm:py-24">
          <p className="anim-fade-up text-xs uppercase tracking-[0.45em] text-tan">
            Trovert Space presents
          </p>
          <h1 className="anim-fade-up mt-4 max-w-3xl font-display text-[3.25rem] leading-[0.92] font-bold text-cream sm:mt-5 sm:text-7xl">
            Private
            <span className="block italic text-red-bright">Cinema</span>
          </h1>
          <p className="anim-fade-up mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {TOTAL_SEATS} powered recliners, a wall-to-wall screen and the whole room to
            yourselves. Walk the hall in 3D, pick the exact seats you want, and lock a slot
            in under a minute.
          </p>

          <div className="anim-fade-up mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/book"
              className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-red-bright"
            >
              Pick your seats
            </Link>
            <Link
              href="#packages"
              className="rounded-full border border-line px-7 py-3.5 text-sm text-cream transition-colors hover:border-tan"
            >
              See packages
            </Link>
          </div>

          <dl className="anim-fade-up mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t border-line/60 pt-7 sm:mt-14 sm:gap-6 sm:pt-8">
            {[
              { k: `${TOTAL_SEATS}`, v: "Recliner seats" },
              { k: `${slots.length}`, v: "Slots every day" },
              { k: "2.5 hrs", v: "Per booking" },
            ].map((stat) => (
              <div key={stat.v}>
                <dt className="font-display text-2xl font-bold text-cream sm:text-3xl">{stat.k}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted sm:text-xs sm:tracking-[0.18em]">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- now showing */}
      <section id="now-showing" className="container-page scroll-mt-20 py-14 sm:py-20">
        <SectionHeading eyebrow="On the screen" title="Now showing" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {movies.map((movie) => (
            <article
              key={movie.id}
              className="group relative overflow-hidden rounded-card border border-line/70 bg-surface p-6 transition-colors hover:border-tan/50"
            >
              <div
                className="absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: movie.accent }}
              />
              <h3 className="font-display text-2xl font-bold text-cream">{movie.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-tan">
                {[movie.year, movie.genre].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
                {movie.synopsis}
              </p>
              <p className="mt-5 flex items-center gap-3 text-xs text-muted">
                <span>{movie.durationMins} min</span>
                {movie.language && <span>· {movie.language}</span>}
                {movie.rating && (
                  <span className="rounded border border-line px-1.5 py-0.5">{movie.rating}</span>
                )}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Bringing your own film or a match on the big screen? Say so in the booking notes —
          we will set it up.
        </p>
      </section>

      {/* -------------------------------------------------------------- slots */}
      <section id="slots" className="scroll-mt-20 border-y border-line/60 bg-ink-soft py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Available slots" title="Ten windows, every day" />
          <div className="grid gap-8 md:grid-cols-2">
            <SlotColumn title="Afternoon / Evening" slots={day} />
            <SlotColumn title="Late Night / Morning" slots={night} />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- packages */}
      <section id="packages" className="container-page scroll-mt-20 py-14 sm:py-20">
        <SectionHeading eyebrow="Charges" title="Packages" />

        {/* Phones get cards — a four-column price table is unreadable at 390px. */}
        <ul className="space-y-3 md:hidden">
          {packages.map((pkg) => (
            <li key={pkg.id} className="rounded-card border border-line/70 bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-bold text-cream">{pkg.name}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {pkg.minGuests === pkg.maxGuests
                      ? `${pkg.minGuests} guests`
                      : `${pkg.minGuests}–${pkg.maxGuests} guests`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl font-bold text-cream">
                    {formatPKR(pkg.price)}
                  </p>
                  {!pkg.exclusive && <p className="text-[11px] text-muted">per person</p>}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{pkg.note}</p>
              <span
                className={`mt-3 inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                  pkg.exclusive ? "bg-red/20 text-red-bright" : "bg-surface-2 text-muted"
                }`}
              >
                {pkg.exclusive ? "Entire cinema yours" : "Shared"}
              </span>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-card border border-line/70 md:block">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr className="bg-maroon-deep/60 text-xs uppercase tracking-[0.18em] text-cream">
                <th className="px-6 py-4 font-medium">Package</th>
                <th className="px-6 py-4 font-medium">Charges</th>
                <th className="px-6 py-4 font-medium">Date / time</th>
                <th className="px-6 py-4 font-medium">Cinema</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-t border-line/60 align-top">
                  <td className="px-6 py-5">
                    <p className="font-display text-lg font-bold text-cream">{pkg.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {pkg.minGuests === pkg.maxGuests
                        ? `${pkg.minGuests} guests`
                        : `${pkg.minGuests}–${pkg.maxGuests} guests`}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-display text-xl font-bold text-cream">
                      {formatPKR(pkg.price)}
                    </p>
                    {!pkg.exclusive && <p className="text-xs text-muted">per person</p>}
                  </td>
                  <td className="px-6 py-5 text-sm text-muted">{pkg.note}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                        pkg.exclusive
                          ? "bg-red/20 text-red-bright"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {pkg.exclusive ? "Entire cinema yours" : "Shared"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/book"
            className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-red-bright"
          >
            Book now
          </Link>
          <p className="text-sm text-muted">
            Confirmations are made over WhatsApp once we receive your request.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- visit */}
      <section id="visit" className="scroll-mt-20 border-t border-line/60 bg-ink-soft py-14 sm:py-20">
        <div className="container-page grid gap-10 md:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Where" title="A home cinema in DHA 5" />
            <p className="max-w-md text-base leading-relaxed text-muted">
              {settings.locationNote}
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { t: "Dolby-style sound", d: "Treated room, slat acoustic walls, subwoofer you feel." },
              { t: "Powered recliners", d: "Every seat reclines, with its own cup holder." },
              { t: "Bring your own film", d: "Netflix, a hard drive, a match, a slideshow — all fine." },
              { t: "Snacks on request", d: "Popcorn and drinks can be arranged with the booking." },
            ].map((item) => (
              <li key={item.t} className="rounded-card border border-line/70 bg-surface p-5">
                <h3 className="text-sm font-medium text-cream">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-9">
      <p className="text-xs uppercase tracking-[0.35em] text-tan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold text-cream sm:text-5xl">{title}</h2>
    </div>
  );
}

function SlotColumn({
  title,
  slots,
}: {
  title: string;
  slots: { id: string; label: string; start: string; end: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 rounded-xl border border-line/70 bg-maroon-deep/50 px-5 py-3 text-sm font-medium tracking-[0.14em] text-cream uppercase">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {slots.map((slot) => (
          <li
            key={slot.id}
            className="flex items-center justify-between rounded-xl border border-line/70 bg-surface px-5 py-3.5"
          >
            <span className="text-sm text-cream">{slot.label}</span>
            <span className="text-xs text-muted">
              {Math.round(slotDurationMins(slot.start, slot.end) / 6) / 10} hrs
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
