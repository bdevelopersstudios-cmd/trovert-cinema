import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book your slot",
  description:
    "Walk the hall in 3D, pick your recliners and request a private screening at Trovert Cinema.",
};

export default async function BookPage() {
  const [slots, movies, packages, settings] = await Promise.all([
    db.listSlots({ activeOnly: true }),
    db.listMovies({ activeOnly: true }),
    db.listPackages({ activeOnly: true }),
    db.getSettings(),
  ]);

  return (
    <div className="min-h-screen bg-ink">
      <SiteNav />

      <main className="container-page py-8 sm:py-12">
        <div className="mb-7 max-w-2xl sm:mb-10">
          <p className="text-xs uppercase tracking-[0.35em] text-tan">Reserve the room</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-cream sm:text-5xl">
            Pick your seats
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Drag the hall to look around, tap a recliner to claim it, then send your request.
            We confirm on WhatsApp and share the exact address once the booking is locked.
          </p>
        </div>

        <BookingFlow slots={slots} movies={movies} packages={packages} settings={settings} />
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
