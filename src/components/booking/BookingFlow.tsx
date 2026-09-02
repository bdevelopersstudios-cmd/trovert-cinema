"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CinemaViewer, type CameraView } from "@/components/cinema/CinemaViewer";
import { SeatMap2D, SeatLegend } from "@/components/cinema/SeatMap2D";
import type { SeatState } from "@/components/cinema/seat-state";
import { SEAT_IDS, TOTAL_SEATS } from "@/lib/seats";
import { addDays, dayOfMonth, formatPKR, monthShort, todayISO, weekdayShort } from "@/lib/format";
import type { Availability, Booking, Movie, Package, Settings, Slot } from "@/lib/types";

interface Props {
  slots: Slot[];
  movies: Movie[];
  packages: Package[];
  settings: Settings;
}

const VIEW_LABELS: { id: CameraView; label: string; short: string }[] = [
  { id: "hall", label: "Hall", short: "Hall" },
  { id: "screen", label: "From the seats", short: "Seat view" },
  { id: "top", label: "Overhead", short: "Top" },
];

const DAYS_AHEAD = 21;

export function BookingFlow({ slots, movies, packages, settings }: Props) {
  const [date, setDate] = useState(todayISO());
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [movieId, setMovieId] = useState("");
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [guests, setGuests] = useState(2);
  const [view, setView] = useState<CameraView>("hall");

  /**
   * Availability is keyed by the date+slot it was fetched for, so a reply that
   * lands after the user has moved on is simply ignored, and "still loading"
   * is derived rather than tracked as a second piece of state.
   */
  const [fetched, setFetched] = useState<{ key: string; value: Availability | null } | null>(null);

  const [form, setForm] = useState({ customerName: "", phone: "", email: "", notes: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  const pkg = useMemo(() => packages.find((p) => p.id === packageId), [packages, packageId]);
  const slot = useMemo(() => slots.find((s) => s.id === slotId), [slots, slotId]);
  const movie = useMemo(() => movies.find((m) => m.id === movieId), [movies, movieId]);
  const exclusive = pkg?.exclusive ?? false;

  const dates = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(todayISO(), i)),
    [],
  );

  const slotKey = `${date}|${slotId}`;

  // Reload who has what the moment the date or slot changes.
  useEffect(() => {
    if (!date || !slotId) return;
    let cancelled = false;
    fetch(`/api/availability?date=${date}&slotId=${slotId}`)
      .then((r) => r.json())
      .then((data: Availability) => {
        if (!cancelled) setFetched({ key: `${date}|${slotId}`, value: data });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: `${date}|${slotId}`, value: null });
      });
    return () => {
      cancelled = true;
    };
  }, [date, slotId]);

  const availability = fetched?.key === slotKey ? fetched.value : null;
  const loadingAvailability = fetched?.key !== slotKey;

  // An exclusive package always takes the whole room, whatever was tapped.
  const chosenSeatIds = exclusive ? SEAT_IDS : seatIds;

  const unavailable = useMemo(() => {
    if (!availability) return new Set<string>();
    if (availability.soldOut) return new Set(SEAT_IDS);
    return new Set([...availability.takenSeatIds, ...availability.blockedSeatIds]);
  }, [availability]);

  const seatStates = useMemo(() => {
    const states: Record<string, SeatState> = {};
    for (const id of SEAT_IDS) {
      if (chosenSeatIds.includes(id)) states[id] = "selected";
      else if (availability?.blockedSeatIds.includes(id)) states[id] = "blocked";
      else if (unavailable.has(id)) states[id] = "taken";
      else states[id] = "available";
    }
    return states;
  }, [chosenSeatIds, unavailable, availability]);

  const toggleSeat = useCallback(
    (id: string) => {
      if (exclusive) return;
      if (unavailable.has(id)) return;
      setError("");
      setSeatIds((current) =>
        current.includes(id)
          ? current.filter((s) => s !== id)
          : current.length >= TOTAL_SEATS
            ? current
            : [...current, id],
      );
    },
    [exclusive, unavailable],
  );

  // Clamp on read rather than writing corrected state back on every change.
  const guestCount = exclusive
    ? pkg
      ? Math.min(Math.max(guests, pkg.minGuests), pkg.maxGuests)
      : guests
    : seatIds.length;
  const total = pkg ? (exclusive ? pkg.price : pkg.price * seatIds.length) : 0;

  const soldOut = availability?.soldOut ?? false;
  const sharedClash = exclusive && (availability?.takenSeatIds.length ?? 0) > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!exclusive && seatIds.length === 0) {
      setError("Pick at least one seat.");
      return;
    }
    if (!form.customerName.trim() || !form.phone.trim()) {
      setError("Please add your name and a contact number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date,
          slotId,
          packageId,
          movieId: movieId || null,
          seatIds: chosenSeatIds,
          guests: guestCount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong, please try again.");
        return;
      }
      setConfirmed(data as Booking);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <Confirmation booking={confirmed} slot={slot} pkg={pkg} movie={movie} settings={settings} />
    );
  }

  return (
    // minmax(0,1fr) on every breakpoint: the WebGL canvas sizes itself from
    // the track, so an `auto` track would let the two grow into each other.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-28 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:pb-0">
      {/* --------------------------------------------------------- the hall */}
      <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
        <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line/70 bg-ink sm:aspect-[16/9]">
          <CinemaViewer
            seatStates={seatStates}
            onSelect={toggleSeat}
            accent={movie?.accent ?? "#b3221f"}
            view={view}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 sm:p-4">
            <div className="pointer-events-auto flex gap-1 rounded-full border border-line/70 bg-ink/80 p-1 backdrop-blur">
              {VIEW_LABELS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={`rounded-full px-3 py-2 text-xs whitespace-nowrap transition-colors sm:px-3.5 sm:py-1.5 ${
                    view === v.id ? "bg-red text-cream" : "text-muted hover:text-cream"
                  }`}
                >
                  <span className="sm:hidden">{v.short}</span>
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
            <span className="hidden rounded-full border border-line/70 bg-ink/80 px-3 py-1.5 text-[11px] text-muted backdrop-blur sm:inline">
              Drag to look around
            </span>
          </div>

          {(soldOut || loadingAvailability) && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
              <p className="rounded-full border border-line bg-ink px-5 py-2.5 text-center text-sm text-cream">
                {loadingAvailability ? "Checking availability…" : "This slot is fully booked"}
              </p>
            </div>
          )}
        </div>
        <p className="mt-2.5 text-center text-[11px] text-muted sm:hidden">
          Drag to look around · pinch to zoom · tap a recliner to claim it
        </p>
      </div>

      {/* ------------------------------------------------------- the seat map */}
      <div className="order-3 min-w-0 rounded-card border border-line/70 bg-surface p-4 sm:p-6 lg:col-start-1 lg:row-start-2">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-cream sm:text-xl">
            {exclusive ? "The whole hall is yours" : "Choose your seats"}
          </h2>
          <SeatLegend />
        </div>
        <div className={exclusive ? "pointer-events-none opacity-60" : ""}>
          <SeatMap2D seatStates={seatStates} onSelect={toggleSeat} />
        </div>
        <p className="mt-5 text-xs text-muted">
          {exclusive
            ? `All ${TOTAL_SEATS} recliners are reserved for you with this package — no one else is in the room.`
            : `Tap a recliner in the 3D hall or on the map. ${TOTAL_SEATS} seats in total.`}
        </p>
      </div>

      {/* ------------------------------------------------------ booking panel */}
      <form
        id="booking-form"
        onSubmit={submit}
        className="order-2 min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24"
      >
        <div className="space-y-6 rounded-card border border-line/70 bg-surface p-4 sm:p-6">
          <Field label="1 · Date">
            <div className="scroll-x -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2">
              {dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`flex min-w-[3.9rem] shrink-0 snap-start flex-col items-center rounded-xl border px-2.5 py-2.5 transition-colors ${
                    date === d
                      ? "border-red-bright bg-red text-cream"
                      : "border-line bg-surface-2 text-muted hover:border-tan"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">{weekdayShort(d)}</span>
                  <span className="font-display text-lg font-bold">{dayOfMonth(d)}</span>
                  <span className="text-[10px] uppercase">{monthShort(d)}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="2 · Time slot">
            <select
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm outline-none focus:border-tan"
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="3 · Package">
            <div className="space-y-2">
              {packages.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    packageId === p.id
                      ? "border-red-bright bg-red/10"
                      : "border-line bg-surface-2 hover:border-tan/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={p.id}
                    checked={packageId === p.id}
                    onChange={() => {
                      setPackageId(p.id);
                      // A different package means a different room deal, so
                      // start the seat picking over.
                      setSeatIds([]);
                      setError("");
                    }}
                    className="mt-1 accent-[var(--color-red-bright)]"
                  />
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-cream">{p.name}</span>
                      <span className="font-display text-sm font-bold text-cream">
                        {formatPKR(p.price)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{p.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {exclusive && pkg && pkg.minGuests !== pkg.maxGuests && (
            <Field label="How many guests?">
              <input
                type="number"
                min={pkg.minGuests}
                max={pkg.maxGuests}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm outline-none focus:border-tan"
              />
            </Field>
          )}

          <Field label="4 · What are we watching?" optional>
            <select
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm outline-none focus:border-tan"
            >
              <option value="">Decide later / bringing my own</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                  {m.year ? ` (${m.year})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="5 · Your details">
            <div className="space-y-2">
              <input
                required
                placeholder="Full name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm placeholder:text-muted/60 outline-none focus:border-tan"
              />
              <input
                required
                placeholder="WhatsApp number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm placeholder:text-muted/60 outline-none focus:border-tan"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm placeholder:text-muted/60 outline-none focus:border-tan"
              />
              <textarea
                rows={2}
                placeholder="Anything else? Birthday setup, your own film, snacks…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full resize-none rounded-xl border border-line bg-surface-2 px-4 py-3 text-base text-cream sm:text-sm placeholder:text-muted/60 outline-none focus:border-tan"
              />
            </div>
          </Field>

          <div className="gold-rule" />

          <dl className="space-y-2 text-sm">
            <Row label="Seats" value={exclusive ? `All ${TOTAL_SEATS}` : seatIds.join(", ") || "—"} />
            <Row label="Guests" value={guestCount ? String(guestCount) : "—"} />
            <Row label="Slot" value={slot?.label ?? "—"} />
            <div className="flex items-baseline justify-between pt-2">
              <dt className="text-xs uppercase tracking-[0.2em] text-tan">Total</dt>
              <dd className="font-display text-2xl font-bold text-cream">{formatPKR(total)}</dd>
            </div>
          </dl>

          {(error || sharedClash) && (
            <p className="rounded-xl border border-red/50 bg-red/10 px-4 py-3 text-sm text-red-bright">
              {error || "This slot already has a shared booking, so it cannot be reserved whole."}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || soldOut || sharedClash}
            className="w-full rounded-full bg-red px-6 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-red-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending…" : soldOut ? "Slot unavailable" : "Request this booking"}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-muted">
            {settings.locationNote}
          </p>
        </div>
      </form>

      {/* Phones: the total and the submit stay in reach wherever you scroll. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-ink/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted">
              {exclusive
                ? `Whole hall · ${guestCount} guest${guestCount === 1 ? "" : "s"}`
                : seatIds.length > 0
                  ? `Seats ${seatIds.join(", ")}`
                  : "No seats picked yet"}
            </p>
            <p className="font-display text-xl font-bold text-cream">{formatPKR(total)}</p>
          </div>
          <button
            type="submit"
            form="booking-form"
            disabled={submitting || soldOut || sharedClash}
            className="shrink-0 rounded-full bg-red px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-red-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending…" : soldOut ? "Unavailable" : "Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2.5 text-xs uppercase tracking-[0.2em] text-tan">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal text-muted">optional</span>}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-cream">{value}</dd>
    </div>
  );
}

function Confirmation({
  booking,
  slot,
  pkg,
  movie,
  settings,
}: {
  booking: Booking;
  slot?: Slot;
  pkg?: Package;
  movie?: Movie;
  settings: Settings;
}) {
  const message = encodeURIComponent(
    `Hi Trovert Cinema! I just requested booking ${booking.ref} for ${booking.date}, ${slot?.label ?? ""} (${pkg?.name ?? ""}).`,
  );

  return (
    <div className="mx-auto max-w-xl rounded-card border border-line/70 bg-surface p-9 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-tan">Request received</p>
      <h2 className="mt-4 font-display text-4xl font-bold text-cream">You are on the list</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        We will confirm on WhatsApp shortly. Keep this reference handy.
      </p>

      <p className="mt-7 inline-block rounded-full border border-tan/40 px-6 py-2.5 font-display text-2xl font-bold tracking-widest text-cream">
        {booking.ref}
      </p>

      <dl className="mt-8 space-y-2 text-left text-sm">
        <Row label="Date" value={booking.date} />
        <Row label="Slot" value={slot?.label ?? "—"} />
        <Row label="Package" value={pkg?.name ?? "—"} />
        <Row label="Seats" value={booking.seatIds.join(", ")} />
        <Row label="Film" value={movie?.title ?? "To be decided"} />
        <Row label="Amount" value={formatPKR(booking.amount)} />
      </dl>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <a
          href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}?text=${message}`}
          className="rounded-full bg-red px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-red-bright"
        >
          Confirm on WhatsApp
        </a>
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-3 text-base text-cream sm:text-sm transition-colors hover:border-tan"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
