import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { BookingsManager } from "@/components/admin/BookingsManager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [bookings, blocks, slots, movies] = await Promise.all([
    db.listBookings(),
    db.listBlocks(),
    db.listSlots(),
    db.listMovies(),
  ]);

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Requests come in as pending. Confirm one once payment is agreed on WhatsApp."
      />
      <BookingsManager bookings={bookings} blocks={blocks} slots={slots} movies={movies} />
    </>
  );
}
