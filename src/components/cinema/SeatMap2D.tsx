"use client";

import { ROWS, SEATS } from "@/lib/seats";
import { SEAT_STATE_LABEL, type SeatState } from "./seat-state";

const STATE_CLASS: Record<SeatState, string> = {
  available: "border-line bg-surface-2 text-cream hover:border-tan hover:bg-surface",
  selected: "border-red-bright bg-red text-cream shadow-[0_0_16px_-2px_var(--color-red-bright)]",
  taken: "border-line/60 bg-ink-soft text-muted/50 cursor-not-allowed",
  blocked: "border-line/60 bg-ink-soft text-muted/40 cursor-not-allowed line-through",
};

/**
 * Keyboard-and-screen-reader friendly twin of the 3D hall. Always visible so
 * seat picking never depends on WebGL being available.
 */
export function SeatMap2D({
  seatStates,
  onSelect,
}: {
  seatStates: Record<string, SeatState>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="mx-auto h-1.5 w-4/5 rounded-full bg-gradient-to-r from-transparent via-tan/60 to-transparent" />
      <p className="text-center text-[10px] uppercase tracking-[0.35em] text-muted">Screen</p>

      <div className="space-y-2 pt-2">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center justify-center gap-2">
            <span className="w-4 text-center text-[11px] font-medium text-muted">{row}</span>
            {SEATS.filter((s) => s.row === row).map((seat) => {
              const state = seatStates[seat.id] ?? "available";
              const locked = state === "taken" || state === "blocked";
              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onSelect(seat.id)}
                  aria-pressed={state === "selected"}
                  aria-label={`Seat ${seat.label} — ${SEAT_STATE_LABEL[state]}`}
                  title={`${seat.label} — ${SEAT_STATE_LABEL[state]}`}
                  className={`h-12 w-12 rounded-t-lg rounded-b-sm border text-xs font-medium transition sm:h-10 sm:w-11 ${STATE_CLASS[state]}`}
                >
                  {seat.number}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeatLegend() {
  const items: { state: SeatState; label: string }[] = [
    { state: "available", label: "Available" },
    { state: "selected", label: "Your pick" },
    { state: "taken", label: "Booked" },
    { state: "blocked", label: "Held" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      {items.map(({ state, label }) => (
        <li key={state} className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-sm border ${
              state === "selected"
                ? "border-red-bright bg-red"
                : state === "available"
                  ? "border-line bg-surface-2"
                  : "border-line/60 bg-ink-soft"
            }`}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
