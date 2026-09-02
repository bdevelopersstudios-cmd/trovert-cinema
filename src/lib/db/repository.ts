import type {
  Availability,
  Booking,
  Movie,
  Package,
  SeatBlock,
  Settings,
  Slot,
} from "@/lib/types";

/**
 * The only surface the app talks to.
 *
 * Swapping the JSON file for a real database (Postgres/Prisma, Supabase,
 * Mongo, Firebase...) means writing one more class that satisfies this
 * interface and returning it from `src/lib/db/index.ts`. Nothing else in the
 * codebase needs to change.
 */
export interface CinemaRepository {
  // Movies
  listMovies(opts?: { activeOnly?: boolean }): Promise<Movie[]>;
  getMovie(id: string): Promise<Movie | null>;
  createMovie(input: Omit<Movie, "id" | "createdAt">): Promise<Movie>;
  updateMovie(id: string, patch: Partial<Movie>): Promise<Movie | null>;
  deleteMovie(id: string): Promise<boolean>;

  // Slots
  listSlots(opts?: { activeOnly?: boolean }): Promise<Slot[]>;
  getSlot(id: string): Promise<Slot | null>;
  createSlot(input: Omit<Slot, "id">): Promise<Slot>;
  updateSlot(id: string, patch: Partial<Slot>): Promise<Slot | null>;
  deleteSlot(id: string): Promise<boolean>;

  // Packages
  listPackages(opts?: { activeOnly?: boolean }): Promise<Package[]>;
  getPackage(id: string): Promise<Package | null>;
  updatePackage(id: string, patch: Partial<Package>): Promise<Package | null>;

  // Bookings
  listBookings(filter?: { date?: string; slotId?: string }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | null>;
  createBooking(input: Omit<Booking, "id" | "ref" | "createdAt">): Promise<Booking>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | null>;
  deleteBooking(id: string): Promise<boolean>;

  // Seat blocks (admin holds / maintenance)
  listBlocks(filter?: { date?: string; slotId?: string }): Promise<SeatBlock[]>;
  createBlock(input: Omit<SeatBlock, "id" | "createdAt">): Promise<SeatBlock>;
  deleteBlock(id: string): Promise<boolean>;

  // Derived
  getAvailability(date: string, slotId: string): Promise<Availability>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
}
