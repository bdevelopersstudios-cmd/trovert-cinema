import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, badRequest } from "../_guard";
import { SEAT_IDS, TOTAL_SEATS } from "@/lib/seats";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Admin-only listing. The public site never needs to read other bookings. */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  return NextResponse.json(
    await db.listBookings({
      date: url.searchParams.get("date") ?? undefined,
      slotId: url.searchParams.get("slotId") ?? undefined,
    }),
  );
}

/** Public booking endpoint used by the seat picker. */
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Booking>;

  const { customerName, phone, date, slotId, packageId } = body;
  if (!customerName?.trim()) return badRequest("Please enter your name");
  if (!phone?.trim()) return badRequest("Please enter a contact number");
  if (!date) return badRequest("Please pick a date");
  if (!slotId) return badRequest("Please pick a time slot");
  if (!packageId) return badRequest("Please pick a package");

  const slot = await db.getSlot(slotId);
  if (!slot || !slot.active) return badRequest("That time slot is not available");

  const pkg = await db.getPackage(packageId);
  if (!pkg || !pkg.active) return badRequest("That package is not available");

  if (body.movieId) {
    const movie = await db.getMovie(body.movieId);
    if (!movie) return badRequest("That movie is no longer listed");
  }

  const seatIds = [...new Set(body.seatIds ?? [])];
  if (seatIds.some((id) => !SEAT_IDS.includes(id))) return badRequest("Unknown seat selected");

  const guests = pkg.exclusive ? (Number(body.guests) || pkg.minGuests) : seatIds.length;
  if (guests < pkg.minGuests || guests > pkg.maxGuests) {
    return badRequest(
      `${pkg.name} is for ${pkg.minGuests === pkg.maxGuests ? pkg.minGuests : `${pkg.minGuests}-${pkg.maxGuests}`} guests`,
    );
  }
  if (guests > TOTAL_SEATS) return badRequest(`The cinema seats ${TOTAL_SEATS} people`);
  if (!pkg.exclusive && seatIds.length === 0) return badRequest("Please choose at least one seat");

  const availability = await db.getAvailability(date, slotId);
  if (availability.soldOut) return badRequest("This slot is already booked out");

  // An exclusive package takes the room, so nothing else may hold a seat in it.
  if (pkg.exclusive && availability.takenSeatIds.length > 0) {
    return badRequest("This slot already has a shared booking, please pick another");
  }

  const unavailable = new Set([...availability.takenSeatIds, ...availability.blockedSeatIds]);
  const clash = seatIds.filter((id) => unavailable.has(id));
  if (clash.length > 0) return badRequest(`Seat ${clash.join(", ")} was just taken`);

  const booking = await db.createBooking({
    customerName: customerName.trim(),
    phone: phone.trim(),
    email: body.email?.trim() ?? "",
    date,
    slotId,
    movieId: body.movieId ?? null,
    packageId,
    seatIds: pkg.exclusive && seatIds.length === 0 ? SEAT_IDS : seatIds,
    guests,
    amount: pkg.exclusive ? pkg.price : pkg.price * guests,
    status: "pending",
    notes: body.notes?.trim() ?? "",
  });

  return NextResponse.json(booking, { status: 201 });
}
