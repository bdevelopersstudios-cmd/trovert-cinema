"use client";

import dynamic from "next/dynamic";
import type { SeatState } from "./seat-state";
import type { CameraView } from "./CinemaScene";

/** WebGL only runs in the browser, so the hall is loaded client-side. */
const CinemaScene = dynamic(() => import("./CinemaScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-red-bright" />
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Dimming the lights</p>
      </div>
    </div>
  ),
});

export function CinemaViewer(props: {
  seatStates: Record<string, SeatState>;
  onSelect: (id: string) => void;
  accent: string;
  view: CameraView;
  autoRotate?: boolean;
  interactive?: boolean;
}) {
  return <CinemaScene {...props} />;
}

export type { CameraView };
