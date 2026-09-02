import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CinemaRepository } from "./repository";
import { seedDatabase } from "./seed";
import type {
  Availability,
  Booking,
  Database,
  Movie,
  Package,
  SeatBlock,
  Settings,
  Slot,
} from "@/lib/types";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "db.json");

/**
 * File-backed repository: good enough to demo and develop against, and it
 * keeps every write path honest so a real database can slot in later.
 * All writes are serialised through `queue` so two requests cannot clobber
 * each other's snapshot.
 */
export class JsonRepository implements CinemaRepository {
  private cache: Database | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<Database> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(DB_FILE, "utf8");
      this.cache = JSON.parse(raw) as Database;
    } catch {
      this.cache = structuredClone(seedDatabase);
      await this.flush();
    }
    return this.cache;
  }

  private async flush(): Promise<void> {
    if (!this.cache) return;
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(this.cache, null, 2), "utf8");
  }

  /** Run a mutation against the snapshot, then persist it. */
  private write<T>(fn: (db: Database) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const database = await this.read();
      const result = fn(database);
      await this.flush();
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  // ---------------------------------------------------------------- movies

  async listMovies(opts?: { activeOnly?: boolean }): Promise<Movie[]> {
    const database = await this.read();
    const rows = opts?.activeOnly ? database.movies.filter((m) => m.active) : database.movies;
    return [...rows].sort((a, b) => a.title.localeCompare(b.title));
  }

  async getMovie(id: string): Promise<Movie | null> {
    const database = await this.read();
    return database.movies.find((m) => m.id === id) ?? null;
  }

  createMovie(input: Omit<Movie, "id" | "createdAt">): Promise<Movie> {
    return this.write((database) => {
      const movie: Movie = {
        ...input,
        id: "mv_" + randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
      };
      database.movies.push(movie);
      return movie;
    });
  }

  updateMovie(id: string, patch: Partial<Movie>): Promise<Movie | null> {
    return this.write((database) => {
      const movie = database.movies.find((m) => m.id === id);
      if (!movie) return null;
      Object.assign(movie, patch, { id: movie.id, createdAt: movie.createdAt });
      return movie;
    });
  }

  deleteMovie(id: string): Promise<boolean> {
    return this.write((database) => {
      const before = database.movies.length;
      database.movies = database.movies.filter((m) => m.id !== id);
      return database.movies.length < before;
    });
  }

  // ----------------------------------------------------------------- slots

  async listSlots(opts?: { activeOnly?: boolean }): Promise<Slot[]> {
    const database = await this.read();
    const rows = opts?.activeOnly ? database.slots.filter((s) => s.active) : database.slots;
    return [...rows].sort((a, b) => a.order - b.order);
  }

  async getSlot(id: string): Promise<Slot | null> {
    const database = await this.read();
    return database.slots.find((s) => s.id === id) ?? null;
  }

  createSlot(input: Omit<Slot, "id">): Promise<Slot> {
    return this.write((database) => {
      const slot: Slot = { ...input, id: "sl_" + randomUUID().slice(0, 8) };
      database.slots.push(slot);
      return slot;
    });
  }

  updateSlot(id: string, patch: Partial<Slot>): Promise<Slot | null> {
    return this.write((database) => {
      const slot = database.slots.find((s) => s.id === id);
      if (!slot) return null;
      Object.assign(slot, patch, { id: slot.id });
      return slot;
    });
  }

  deleteSlot(id: string): Promise<boolean> {
    return this.write((database) => {
      const before = database.slots.length;
      database.slots = database.slots.filter((s) => s.id !== id);
      return database.slots.length < before;
    });
  }

  // -------------------------------------------------------------- packages

  async listPackages(opts?: { activeOnly?: boolean }): Promise<Package[]> {
    const database = await this.read();
    const rows = opts?.activeOnly ? database.packages.filter((p) => p.active) : database.packages;
    return [...rows].sort((a, b) => a.order - b.order);
  }

  async getPackage(id: string): Promise<Package | null> {
    const database = await this.read();
    return database.packages.find((p) => p.id === id) ?? null;
  }

  updatePackage(id: string, patch: Partial<Package>): Promise<Package | null> {
    return this.write((database) => {
      const pkg = database.packages.find((p) => p.id === id);
      if (!pkg) return null;
      Object.assign(pkg, patch, { id: pkg.id });
      return pkg;
    });
  }

  // -------------------------------------------------------------- bookings

  async listBookings(filter?: { date?: string; slotId?: string }): Promise<Booking[]> {
    const database = await this.read();
    return database.bookings
      .filter((b) => (filter?.date ? b.date === filter.date : true))
      .filter((b) => (filter?.slotId ? b.slotId === filter.slotId : true))
      .sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
      );
  }

  async getBooking(id: string): Promise<Booking | null> {
    const database = await this.read();
    return database.bookings.find((b) => b.id === id) ?? null;
  }

  createBooking(input: Omit<Booking, "id" | "ref" | "createdAt">): Promise<Booking> {
    return this.write((database) => {
      const booking: Booking = {
        ...input,
        id: "bk_" + randomUUID().slice(0, 8),
        ref: "TC-" + randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      database.bookings.push(booking);
      return booking;
    });
  }

  updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | null> {
    return this.write((database) => {
      const booking = database.bookings.find((b) => b.id === id);
      if (!booking) return null;
      Object.assign(booking, patch, {
        id: booking.id,
        ref: booking.ref,
        createdAt: booking.createdAt,
      });
      return booking;
    });
  }

  deleteBooking(id: string): Promise<boolean> {
    return this.write((database) => {
      const before = database.bookings.length;
      database.bookings = database.bookings.filter((b) => b.id !== id);
      return database.bookings.length < before;
    });
  }

  // ---------------------------------------------------------------- blocks

  async listBlocks(filter?: { date?: string; slotId?: string }): Promise<SeatBlock[]> {
    const database = await this.read();
    return database.blocks
      .filter((b) => (filter?.date ? b.date === filter.date : true))
      .filter((b) => (filter?.slotId ? b.slotId === filter.slotId : true));
  }

  createBlock(input: Omit<SeatBlock, "id" | "createdAt">): Promise<SeatBlock> {
    return this.write((database) => {
      const block: SeatBlock = {
        ...input,
        id: "bl_" + randomUUID().slice(0, 8),
        createdAt: new Date().toISOString(),
      };
      database.blocks.push(block);
      return block;
    });
  }

  deleteBlock(id: string): Promise<boolean> {
    return this.write((database) => {
      const before = database.blocks.length;
      database.blocks = database.blocks.filter((b) => b.id !== id);
      return database.blocks.length < before;
    });
  }

  // --------------------------------------------------------------- derived

  async getAvailability(date: string, slotId: string): Promise<Availability> {
    const database = await this.read();
    const live = database.bookings.filter(
      (b) => b.date === date && b.slotId === slotId && b.status !== "cancelled",
    );
    const packagesById = new Map(database.packages.map((p) => [p.id, p]));
    const soldOut = live.some((b) => packagesById.get(b.packageId)?.exclusive);
    const takenSeatIds = [...new Set(live.flatMap((b) => b.seatIds))];
    const blockedSeatIds = [
      ...new Set(
        database.blocks
          .filter((b) => b.date === date && b.slotId === slotId)
          .flatMap((b) => b.seatIds),
      ),
    ];
    return { date, slotId, takenSeatIds, blockedSeatIds, soldOut };
  }

  // -------------------------------------------------------------- settings

  async getSettings(): Promise<Settings> {
    const database = await this.read();
    return database.settings;
  }

  updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return this.write((database) => {
      Object.assign(database.settings, patch);
      return database.settings;
    });
  }
}
