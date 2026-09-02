export type SeatState = "available" | "selected" | "taken" | "blocked";

/** Leather + trim colours per seat state, shared by the 3D hall and the 2D map. */
export const SEAT_COLORS: Record<
  SeatState,
  { body: string; trim: string; emissive: string; emissiveIntensity: number }
> = {
  available: { body: "#5c5456", trim: "#6b6264", emissive: "#000000", emissiveIntensity: 0 },
  selected: { body: "#b3221f", trim: "#d4342c", emissive: "#d4342c", emissiveIntensity: 0.55 },
  taken: { body: "#2a2324", trim: "#332b2c", emissive: "#000000", emissiveIntensity: 0 },
  blocked: { body: "#2e2622", trim: "#3a3029", emissive: "#000000", emissiveIntensity: 0 },
};

export const SEAT_STATE_LABEL: Record<SeatState, string> = {
  available: "Available",
  selected: "Your seat",
  taken: "Booked",
  blocked: "Unavailable",
};
