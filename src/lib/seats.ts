/**
 * Physical layout of the Trovert Cinema hall: 11 recliners in 3 rows,
 * mirroring the real room (4 front, 4 middle, 3 back).
 * x/z are metres in the 3D scene; the screen sits at negative z.
 */

export interface SeatDef {
  id: string;
  row: string;
  number: number;
  label: string;
  x: number;
  z: number;
  /** Tiered rows sit higher off the floor. */
  y: number;
  /** Slight toe-in so every recliner faces the screen. */
  rotation: number;
}

const ROW_GAP = 1.85;
const SEAT_GAP = 1.28;

function buildRow(row: string, count: number, z: number, y: number): SeatDef[] {
  const offset = ((count - 1) * SEAT_GAP) / 2;
  return Array.from({ length: count }, (_, i) => {
    const x = i * SEAT_GAP - offset;
    return {
      id: `${row}${i + 1}`,
      row,
      number: i + 1,
      label: `${row}${i + 1}`,
      x,
      z,
      y,
      // Model faces -z (the screen), so a seat left of centre turns right.
      rotation: x * 0.045,
    };
  });
}

export const SEATS: SeatDef[] = [
  ...buildRow("A", 4, 0.6, 0),
  ...buildRow("B", 4, 0.6 + ROW_GAP, 0.34),
  ...buildRow("C", 3, 0.6 + ROW_GAP * 2, 0.68),
];

export const TOTAL_SEATS = SEATS.length; // 11

export const SEAT_IDS = SEATS.map((s) => s.id);

export function getSeat(id: string): SeatDef | undefined {
  return SEATS.find((s) => s.id === id);
}

export const ROWS = ["A", "B", "C"] as const;
