"use client";

import { useMemo } from "react";
import { CinemaViewer } from "@/components/cinema/CinemaViewer";
import { SEAT_IDS } from "@/lib/seats";
import type { SeatState } from "@/components/cinema/seat-state";
import { useIsCompact } from "@/lib/use-media";

/**
 * Idle, non-bookable view of the hall behind the hero copy.
 *
 * Phones get a CSS stand-in instead: an auto-orbiting WebGL scene behind text
 * nobody can interact with is a poor trade for battery and first paint, and the
 * real hall is one tap away on /book.
 */
export function HeroHall({ accent = "#b3221f" }: { accent?: string }) {
  const compact = useIsCompact();

  const seatStates = useMemo(
    () =>
      Object.fromEntries(SEAT_IDS.map((id) => [id, "available" as SeatState])) as Record<
        string,
        SeatState
      >,
    [],
  );

  if (compact) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="anim-flicker absolute top-[18%] left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-[50%] bg-red/25 blur-3xl" />
        <div className="absolute top-[26%] left-1/2 h-40 w-[70%] -translate-x-1/2 rounded-xl bg-gradient-to-b from-red/40 to-transparent blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <CinemaViewer
        seatStates={seatStates}
        onSelect={() => {}}
        accent={accent}
        view="hall"
        autoRotate
        interactive={false}
      />
    </div>
  );
}
