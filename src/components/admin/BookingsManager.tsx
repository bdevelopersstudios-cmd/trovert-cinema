"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, GhostButton, Labeled, PrimaryButton, StatusPill, inputClass } from "./ui";
import { SeatMap2D } from "@/components/cinema/SeatMap2D";
import type { SeatState } from "@/components/cinema/seat-state";
import { SEAT_IDS } from "@/lib/seats";
import { formatPKR, prettyDate, todayISO } from "@/lib/format";
import type { Booking, BookingStatus, Movie, SeatBlock, Slot } from "@/lib/types";

interface Props {
  bookings: Booking[];
  blocks: SeatBlock[];
  slots: Slot[];
  movies: Movie[];
}

const FILTERS: { id: string; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
];

export function BookingsManager({ bookings, blocks, slots, movies }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("upcoming");
  const [query, setQuery] = useState("");

  const slotsById = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);
  const moviesById = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);
  const today = todayISO();

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (filter === "upcoming") return b.date >= today && b.status !== "cancelled";
        if (filter === "pending") return b.status === "pending";
        return true;
      })
      .filter((b) =>
        term
          ? [b.customerName, b.phone, b.ref, b.email].join(" ").toLowerCase().includes(term)
          : true,
      );
  }, [bookings, filter, query, today]);

  async function setStatus(booking: Booking, status: BookingStatus) {
    await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove(booking: Booking) {
    if (!confirm(`Delete booking ${booking.ref}? This cannot be undone.`)) return;
    await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Card>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-full border border-line/70 bg-surface-2 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                  filter === f.id ? "bg-red text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            placeholder="Search name, phone or reference"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} sm:max-w-xs`}
          />
          <span className="ml-auto text-xs text-muted">{rows.length} shown</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {rows.map((booking) => (
              <li key={booking.id} className="py-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-3 text-sm text-cream">
                      <span className="font-medium">{booking.customerName}</span>
                      <span className="text-xs text-muted">{booking.ref}</span>
                      <StatusPill status={booking.status} />
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      {prettyDate(booking.date)} · {slotsById.get(booking.slotId)?.label ?? "—"} ·{" "}
                      {booking.guests} guest{booking.guests === 1 ? "" : "s"} · seats{" "}
                      {booking.seatIds.length === SEAT_IDS.length
                        ? "whole hall"
                        : booking.seatIds.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {booking.phone}
                      {booking.email && ` · ${booking.email}`}
                      {booking.movieId && ` · ${moviesById.get(booking.movieId)?.title ?? ""}`}
                    </p>
                    {booking.notes && (
                      <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                        {booking.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-cream">
                      {formatPKR(booking.amount)}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                      {booking.status !== "confirmed" && (
                        <GhostButton onClick={() => setStatus(booking, "confirmed")}>
                          Confirm
                        </GhostButton>
                      )}
                      {booking.status !== "cancelled" && (
                        <GhostButton onClick={() => setStatus(booking, "cancelled")}>
                          Cancel
                        </GhostButton>
                      )}
                      <GhostButton onClick={() => remove(booking)}>Delete</GhostButton>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SeatHolds blocks={blocks} slots={slots} bookings={bookings} />
    </div>
  );
}

/** Hold seats back for maintenance, staff or a walk-in, per date + slot. */
function SeatHolds({
  blocks,
  slots,
  bookings,
}: {
  blocks: SeatBlock[];
  slots: Slot[];
  bookings: Booking[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const taken = useMemo(
    () =>
      new Set(
        bookings
          .filter((b) => b.date === date && b.slotId === slotId && b.status !== "cancelled")
          .flatMap((b) => b.seatIds),
      ),
    [bookings, date, slotId],
  );

  const existing = useMemo(
    () => blocks.filter((b) => b.date === date && b.slotId === slotId),
    [blocks, date, slotId],
  );
  const alreadyBlocked = useMemo(
    () => new Set(existing.flatMap((b) => b.seatIds)),
    [existing],
  );

  const seatStates = useMemo(() => {
    const states: Record<string, SeatState> = {};
    for (const id of SEAT_IDS) {
      if (seatIds.includes(id)) states[id] = "selected";
      else if (alreadyBlocked.has(id)) states[id] = "blocked";
      else if (taken.has(id)) states[id] = "taken";
      else states[id] = "available";
    }
    return states;
  }, [seatIds, alreadyBlocked, taken]);

  async function hold() {
    if (seatIds.length === 0) return;
    setBusy(true);
    try {
      await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slotId, seatIds, reason }),
      });
      setSeatIds([]);
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function release(block: SeatBlock) {
    await fetch(`/api/blocks/${block.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-1 font-display text-xl font-bold text-cream">Hold seats back</h2>
      <p className="mb-6 text-sm text-muted">
        Blocked seats disappear from the public seat map for that date and slot only.
      </p>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-3">
          <Labeled label="Date">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Labeled>
          <Labeled label="Slot">
            <select
              className={inputClass}
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Reason">
            <input
              className={inputClass}
              placeholder="Maintenance, staff seat…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Labeled>
          <PrimaryButton type="button" onClick={hold} disabled={busy || seatIds.length === 0}>
            {busy ? "Holding…" : `Hold ${seatIds.length || ""} seat${seatIds.length === 1 ? "" : "s"}`}
          </PrimaryButton>

          {existing.length > 0 && (
            <ul className="space-y-2 pt-3">
              {existing.map((block) => (
                <li
                  key={block.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-surface-2 px-3.5 py-2.5"
                >
                  <span className="text-xs text-muted">
                    {block.seatIds.join(", ")}
                    {block.reason && ` — ${block.reason}`}
                  </span>
                  <GhostButton onClick={() => release(block)}>Release</GhostButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-line/70 bg-ink-soft p-6">
          <SeatMap2D
            seatStates={seatStates}
            onSelect={(id) =>
              setSeatIds((current) =>
                current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
              )
            }
          />
        </div>
      </div>
    </Card>
  );
}
