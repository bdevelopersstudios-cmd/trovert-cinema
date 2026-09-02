import Link from "next/link";
import { db } from "@/lib/db";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { formatPKR, prettyDate, todayISO } from "@/lib/format";
import { TOTAL_SEATS } from "@/lib/seats";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [bookings, slots, movies] = await Promise.all([
    db.listBookings(),
    db.listSlots(),
    db.listMovies(),
  ]);

  const today = todayISO();
  const live = bookings.filter((b) => b.status !== "cancelled");
  const upcoming = live.filter((b) => b.date >= today);
  const revenue = live
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.amount, 0);
  const pending = bookings.filter((b) => b.status === "pending").length;
  const slotsById = new Map(slots.map((s) => [s.id, s]));

  const stats = [
    { label: "Upcoming bookings", value: String(upcoming.length) },
    { label: "Awaiting confirmation", value: String(pending) },
    { label: "Confirmed revenue", value: formatPKR(revenue) },
    { label: "Seats in the hall", value: String(TOTAL_SEATS) },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`${slots.filter((s) => s.active).length} active slots · ${movies.filter((m) => m.active).length} movies listed`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-tan">{stat.label}</p>
            <p className="mt-3 font-display text-3xl font-bold text-cream">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-cream">Next up</h2>
          <Link href="/admin/bookings" className="text-xs text-muted hover:text-cream">
            All bookings →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No upcoming bookings yet. Requests from the site land here.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {upcoming.slice(0, 8).map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-cream">
                    {booking.customerName}
                    <span className="ml-2 text-xs text-muted">{booking.ref}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {prettyDate(booking.date)} · {slotsById.get(booking.slotId)?.label ?? "—"} ·{" "}
                    {booking.seatIds.length} seat{booking.seatIds.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-cream">
                  {formatPKR(booking.amount)}
                </span>
                <StatusPill status={booking.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
