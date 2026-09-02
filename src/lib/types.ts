/** Domain model for Trovert Cinema. */

export type SlotPeriod = "afternoon-evening" | "late-night-morning";

export interface Movie {
  id: string;
  title: string;
  year: number | null;
  genre: string;
  language: string;
  durationMins: number;
  rating: string;
  synopsis: string;
  posterUrl: string;
  accent: string; // hex, used to tint the 3D screen glow
  active: boolean;
  createdAt: string;
}

export interface Slot {
  id: string;
  label: string; // "11:00 AM - 1:30 PM"
  start: string; // "11:00" 24h
  end: string; // "13:30" 24h
  period: SlotPeriod;
  order: number;
  active: boolean;
}

export interface Package {
  id: string;
  name: string;
  note: string;
  price: number; // PKR
  minGuests: number;
  maxGuests: number;
  /** true = the whole cinema is reserved for this booking */
  exclusive: boolean;
  order: number;
  active: boolean;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  ref: string; // TC-XXXXXX
  customerName: string;
  phone: string;
  email: string;
  date: string; // YYYY-MM-DD
  slotId: string;
  movieId: string | null;
  packageId: string;
  seatIds: string[];
  guests: number;
  amount: number;
  status: BookingStatus;
  notes: string;
  createdAt: string;
}

export interface SeatBlock {
  id: string;
  date: string;
  slotId: string;
  seatIds: string[];
  reason: string;
  createdAt: string;
}

export interface Settings {
  venueNote: string;
  locationNote: string;
  whatsapp: string;
  instagram: string;
  currency: string;
}

export interface Database {
  movies: Movie[];
  slots: Slot[];
  packages: Package[];
  bookings: Booking[];
  blocks: SeatBlock[];
  settings: Settings;
}

/** What the booking page needs to know about one date + slot. */
export interface Availability {
  date: string;
  slotId: string;
  /** Seats already taken by confirmed/pending bookings. */
  takenSeatIds: string[];
  /** Seats manually blocked by an admin (maintenance, holds). */
  blockedSeatIds: string[];
  /** Someone booked an exclusive package -> the whole hall is gone. */
  soldOut: boolean;
}
