import { randomUUID } from "node:crypto";
import postgres from "postgres";
import type { CinemaRepository } from "./repository";
import { BookingConflictError } from "./errors";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";
import type {
  Availability,
  Booking,
  BookingStatus,
  Movie,
  Package,
  SeatBlock,
  Settings,
  Slot,
  SlotPeriod,
} from "@/lib/types";

/** Anything that can run a query: the pool, or a transaction on it. */
type Queryable = postgres.ISql;

// ------------------------------------------------------------------ connection

const globalForPg = globalThis as unknown as { __trovertSql?: postgres.Sql };

/**
 * One pool per process, cached across hot reloads and warm serverless
 * invocations.
 *
 * `max` must be greater than 1. A serverless instance serves one request at a
 * time, but a single request fans out: every page loads its movies, slots,
 * packages and settings through `Promise.all`. Squeezed onto one pooled
 * connection those concurrent queries stall against a transaction-mode pooler
 * and the page never renders, so the pool needs room for a page's whole fan-out.
 */
function connect(url: string): postgres.Sql {
  if (globalForPg.__trovertSql) return globalForPg.__trovertSql;

  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
  const declaresSsl = /[?&](sslmode|ssl)=/.test(url);

  const sql = postgres(url, {
    max: Math.max(2, Number(process.env.DATABASE_POOL_MAX ?? 5)),
    idle_timeout: 20,
    connect_timeout: 15,
    // Transaction-mode poolers reject prepared statements; the queries here are
    // small enough that losing the prepared-statement cache costs nothing.
    prepare: false,
    // Hosted Postgres wants TLS but not every connection string says so.
    ssl: declaresSsl || isLocal ? undefined : "require",
    onnotice: () => {},
    transform: { undefined: null },
  });

  globalForPg.__trovertSql = sql;
  return sql;
}

// ----------------------------------------------------------------- row shapes

interface MovieRow {
  id: string;
  title: string;
  year: number | null;
  genre: string;
  language: string;
  duration_mins: number;
  rating: string;
  synopsis: string;
  poster_url: string;
  accent: string;
  active: boolean;
  created_at: Date | string;
}

interface SlotRow {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  period: string;
  sort_order: number;
  active: boolean;
}

interface PackageRow {
  id: string;
  name: string;
  note: string;
  price: number;
  min_guests: number;
  max_guests: number;
  exclusive: boolean;
  sort_order: number;
  active: boolean;
}

interface BookingRow {
  id: string;
  ref: string;
  customer_name: string;
  phone: string;
  email: string;
  date: string;
  slot_id: string;
  movie_id: string | null;
  package_id: string;
  seat_ids: string[];
  guests: number;
  amount: number;
  status: string;
  notes: string;
  created_at: Date | string;
}

interface SeatBlockRow {
  id: string;
  date: string;
  slot_id: string;
  seat_ids: string[];
  reason: string;
  created_at: Date | string;
}

interface SettingsRow {
  id: number;
  venue_note: string;
  location_note: string;
  whatsapp: string;
  instagram: string;
  currency: string;
}

// -------------------------------------------------------------------- mapping

const iso = (value: Date | string): string =>
  typeof value === "string" ? value : value.toISOString();

const toMovie = (row: MovieRow): Movie => ({
  id: row.id,
  title: row.title,
  year: row.year,
  genre: row.genre,
  language: row.language,
  durationMins: row.duration_mins,
  rating: row.rating,
  synopsis: row.synopsis,
  posterUrl: row.poster_url,
  accent: row.accent,
  active: row.active,
  createdAt: iso(row.created_at),
});

const toSlot = (row: SlotRow): Slot => ({
  id: row.id,
  label: row.label,
  start: row.start_time,
  end: row.end_time,
  period: row.period as SlotPeriod,
  order: row.sort_order,
  active: row.active,
});

const toPackage = (row: PackageRow): Package => ({
  id: row.id,
  name: row.name,
  note: row.note,
  price: row.price,
  minGuests: row.min_guests,
  maxGuests: row.max_guests,
  exclusive: row.exclusive,
  order: row.sort_order,
  active: row.active,
});

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  ref: row.ref,
  customerName: row.customer_name,
  phone: row.phone,
  email: row.email,
  date: row.date,
  slotId: row.slot_id,
  movieId: row.movie_id,
  packageId: row.package_id,
  seatIds: row.seat_ids ?? [],
  guests: row.guests,
  amount: row.amount,
  status: row.status as BookingStatus,
  notes: row.notes,
  createdAt: iso(row.created_at),
});

const toBlock = (row: SeatBlockRow): SeatBlock => ({
  id: row.id,
  date: row.date,
  slotId: row.slot_id,
  seatIds: row.seat_ids ?? [],
  reason: row.reason,
  createdAt: iso(row.created_at),
});

const toSettings = (row: SettingsRow): Settings => ({
  venueNote: row.venue_note,
  locationNote: row.location_note,
  whatsapp: row.whatsapp,
  instagram: row.instagram,
  currency: row.currency,
});

/**
 * Domain field -> column, for the fields a caller is allowed to write.
 * Identity and creation stamps are absent on purpose: patching them is ignored,
 * which is what the JSON store did too.
 */
const MOVIE_COLUMNS: Partial<Record<keyof Movie, string>> = {
  title: "title",
  year: "year",
  genre: "genre",
  language: "language",
  durationMins: "duration_mins",
  rating: "rating",
  synopsis: "synopsis",
  posterUrl: "poster_url",
  accent: "accent",
  active: "active",
};

const SLOT_COLUMNS: Partial<Record<keyof Slot, string>> = {
  label: "label",
  start: "start_time",
  end: "end_time",
  period: "period",
  order: "sort_order",
  active: "active",
};

const PACKAGE_COLUMNS: Partial<Record<keyof Package, string>> = {
  name: "name",
  note: "note",
  price: "price",
  minGuests: "min_guests",
  maxGuests: "max_guests",
  exclusive: "exclusive",
  order: "sort_order",
  active: "active",
};

const BOOKING_COLUMNS: Partial<Record<keyof Booking, string>> = {
  customerName: "customer_name",
  phone: "phone",
  email: "email",
  date: "date",
  slotId: "slot_id",
  movieId: "movie_id",
  packageId: "package_id",
  seatIds: "seat_ids",
  guests: "guests",
  amount: "amount",
  status: "status",
  notes: "notes",
};

const BLOCK_COLUMNS: Partial<Record<keyof SeatBlock, string>> = {
  date: "date",
  slotId: "slot_id",
  seatIds: "seat_ids",
  reason: "reason",
};

const SETTINGS_COLUMNS: Partial<Record<keyof Settings, string>> = {
  venueNote: "venue_note",
  locationNote: "location_note",
  whatsapp: "whatsapp",
  instagram: "instagram",
  currency: "currency",
};

/** Turn a domain patch into a column/value object, skipping absent fields. */
function toRow<T extends object>(
  patch: Partial<T>,
  columns: Partial<Record<keyof T, string>>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(columns) as [keyof T, string][]) {
    const value = patch[key];
    if (value !== undefined) row[column] = value;
  }
  return row;
}

// ----------------------------------------------------------------------- ids

const newId = (prefix: string): string => prefix + randomUUID().slice(0, 8);

const newRef = (): string =>
  "TC-" + randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

/** Stable signed 32-bit hash (FNV-1a), for Postgres advisory lock keys. */
function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash | 0;
}

/** Lock guarding the one-time seed. */
const SEED_LOCK = [hash32("trovert-cinema"), hash32("seed")] as const;

// -------------------------------------------------------------- shared reads

async function readAvailability(
  sql: Queryable,
  date: string,
  slotId: string,
): Promise<Availability> {
  // Left join: a booking whose package has since been deleted still holds its
  // seats, it just cannot make the room exclusive.
  const live = await sql<{ seat_ids: string[]; exclusive: boolean | null }[]>`
    select b.seat_ids, p.exclusive
    from cinema_bookings b
    left join cinema_packages p on p.id = b.package_id
    where b.date = ${date}
      and b.slot_id = ${slotId}
      and b.status <> 'cancelled'
  `;

  const blocks = await sql<{ seat_ids: string[] }[]>`
    select seat_ids from cinema_seat_blocks
    where date = ${date} and slot_id = ${slotId}
  `;

  return {
    date,
    slotId,
    takenSeatIds: [...new Set(live.flatMap((row) => row.seat_ids ?? []))],
    blockedSeatIds: [...new Set(blocks.flatMap((row) => row.seat_ids ?? []))],
    soldOut: live.some((row) => row.exclusive === true),
  };
}

// ------------------------------------------------------------- the repository

/**
 * Postgres-backed `CinemaRepository`. Works against any Postgres — Neon,
 * Supabase, Vercel Postgres, Railway, or a local server — since the only thing
 * it needs is `DATABASE_URL`.
 *
 * The schema is created and seeded lazily on the first query, so a fresh
 * database becomes a working cinema with no migration or seed command to run.
 */
export class PostgresRepository implements CinemaRepository {
  private readonly sql: postgres.Sql;
  private bootstrapped: Promise<postgres.Sql> | null = null;

  constructor(url: string | undefined = process.env.DATABASE_URL) {
    if (!url) {
      throw new Error("PostgresRepository needs DATABASE_URL to be set");
    }
    this.sql = connect(url);
  }

  /** Resolves to a connection whose schema and seed content are in place. */
  private ready(): Promise<postgres.Sql> {
    // A failed bootstrap must not stay cached, or one bad connection at boot
    // would poison every later request on this instance.
    this.bootstrapped ??= this.bootstrap().catch((error: unknown) => {
      this.bootstrapped = null;
      throw error;
    });
    return this.bootstrapped;
  }

  private async bootstrap(): Promise<postgres.Sql> {
    // Fast path, and the one that runs almost every time: a single round trip
    // to confirm the database is already provisioned.
    //
    // Provisioning below takes a global advisory lock, and serverless instances
    // are frozen and discarded constantly. If every cold start reached for that
    // lock, one instance frozen mid-transaction would stall every other cold
    // start behind it until its connection timed out. Once the tables exist, no
    // request should go near it.
    try {
      const provisioned = await this.sql`select 1 from cinema_settings where id = 1`;
      if (provisioned.length > 0) return this.sql;
    } catch {
      // Tables are not there yet; create them below.
    }

    await this.sql.unsafe(SCHEMA_SQL).simple();

    await this.sql.begin(async (tx) => {
      // Two instances provisioning at once must not both seed.
      await tx`select pg_advisory_xact_lock(${SEED_LOCK[0]}, ${SEED_LOCK[1]})`;
      const existing = await tx`select 1 from cinema_settings where id = 1`;
      if (existing.length > 0) return;
      await seed(tx);
    });

    return this.sql;
  }

  // ------------------------------------------------------------------ movies

  async listMovies(opts?: { activeOnly?: boolean }): Promise<Movie[]> {
    const sql = await this.ready();
    const rows = await sql<MovieRow[]>`
      select * from cinema_movies
      ${opts?.activeOnly ? sql`where active` : sql``}
      order by title
    `;
    return rows.map(toMovie);
  }

  async getMovie(id: string): Promise<Movie | null> {
    const sql = await this.ready();
    const rows = await sql<MovieRow[]>`select * from cinema_movies where id = ${id}`;
    return rows[0] ? toMovie(rows[0]) : null;
  }

  async createMovie(input: Omit<Movie, "id" | "createdAt">): Promise<Movie> {
    const sql = await this.ready();
    const row = { id: newId("mv_"), ...toRow<Movie>(input, MOVIE_COLUMNS) };
    const rows = await sql<MovieRow[]>`insert into cinema_movies ${sql(row)} returning *`;
    return toMovie(rows[0]);
  }

  async updateMovie(id: string, patch: Partial<Movie>): Promise<Movie | null> {
    const sql = await this.ready();
    const row = toRow<Movie>(patch, MOVIE_COLUMNS);
    const rows = await (Object.keys(row).length === 0
      ? sql<MovieRow[]>`select * from cinema_movies where id = ${id}`
      : sql<MovieRow[]>`update cinema_movies set ${sql(row)} where id = ${id} returning *`);
    return rows[0] ? toMovie(rows[0]) : null;
  }

  async deleteMovie(id: string): Promise<boolean> {
    const sql = await this.ready();
    const rows = await sql`delete from cinema_movies where id = ${id} returning id`;
    return rows.length > 0;
  }

  // ------------------------------------------------------------------- slots

  async listSlots(opts?: { activeOnly?: boolean }): Promise<Slot[]> {
    const sql = await this.ready();
    const rows = await sql<SlotRow[]>`
      select * from cinema_slots
      ${opts?.activeOnly ? sql`where active` : sql``}
      order by sort_order
    `;
    return rows.map(toSlot);
  }

  async getSlot(id: string): Promise<Slot | null> {
    const sql = await this.ready();
    const rows = await sql<SlotRow[]>`select * from cinema_slots where id = ${id}`;
    return rows[0] ? toSlot(rows[0]) : null;
  }

  async createSlot(input: Omit<Slot, "id">): Promise<Slot> {
    const sql = await this.ready();
    const row = { id: newId("sl_"), ...toRow<Slot>(input, SLOT_COLUMNS) };
    const rows = await sql<SlotRow[]>`insert into cinema_slots ${sql(row)} returning *`;
    return toSlot(rows[0]);
  }

  async updateSlot(id: string, patch: Partial<Slot>): Promise<Slot | null> {
    const sql = await this.ready();
    const row = toRow<Slot>(patch, SLOT_COLUMNS);
    const rows = await (Object.keys(row).length === 0
      ? sql<SlotRow[]>`select * from cinema_slots where id = ${id}`
      : sql<SlotRow[]>`update cinema_slots set ${sql(row)} where id = ${id} returning *`);
    return rows[0] ? toSlot(rows[0]) : null;
  }

  async deleteSlot(id: string): Promise<boolean> {
    const sql = await this.ready();
    const rows = await sql`delete from cinema_slots where id = ${id} returning id`;
    return rows.length > 0;
  }

  // ---------------------------------------------------------------- packages

  async listPackages(opts?: { activeOnly?: boolean }): Promise<Package[]> {
    const sql = await this.ready();
    const rows = await sql<PackageRow[]>`
      select * from cinema_packages
      ${opts?.activeOnly ? sql`where active` : sql``}
      order by sort_order
    `;
    return rows.map(toPackage);
  }

  async getPackage(id: string): Promise<Package | null> {
    const sql = await this.ready();
    const rows = await sql<PackageRow[]>`select * from cinema_packages where id = ${id}`;
    return rows[0] ? toPackage(rows[0]) : null;
  }

  async updatePackage(id: string, patch: Partial<Package>): Promise<Package | null> {
    const sql = await this.ready();
    const row = toRow<Package>(patch, PACKAGE_COLUMNS);
    const rows = await (Object.keys(row).length === 0
      ? sql<PackageRow[]>`select * from cinema_packages where id = ${id}`
      : sql<PackageRow[]>`update cinema_packages set ${sql(row)} where id = ${id} returning *`);
    return rows[0] ? toPackage(rows[0]) : null;
  }

  // ---------------------------------------------------------------- bookings

  async listBookings(filter?: { date?: string; slotId?: string }): Promise<Booking[]> {
    const sql = await this.ready();
    const rows = await sql<BookingRow[]>`
      select * from cinema_bookings
      where true
        ${filter?.date ? sql`and date = ${filter.date}` : sql``}
        ${filter?.slotId ? sql`and slot_id = ${filter.slotId}` : sql``}
      order by date desc, created_at desc
    `;
    return rows.map(toBooking);
  }

  async getBooking(id: string): Promise<Booking | null> {
    const sql = await this.ready();
    const rows = await sql<BookingRow[]>`select * from cinema_bookings where id = ${id}`;
    return rows[0] ? toBooking(rows[0]) : null;
  }

  /**
   * Creating a booking is the one write that has to hold a rule, so it runs in
   * a transaction behind an advisory lock on the date and slot: every attempt
   * on the same showing queues, re-reads availability under the lock, and only
   * then inserts. Two guests tapping the same recliner in the same instant get
   * one booking and one `BookingConflictError` — never two bookings.
   */
  async createBooking(input: Omit<Booking, "id" | "ref" | "createdAt">): Promise<Booking> {
    const sql = await this.ready();

    return sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(${hash32(input.date)}, ${hash32(input.slotId)})`;

      const availability = await readAvailability(tx, input.date, input.slotId);
      if (availability.soldOut) {
        throw new BookingConflictError("This slot is already booked out");
      }

      const pkg = await tx<{ exclusive: boolean }[]>`
        select exclusive from cinema_packages where id = ${input.packageId}
      `;
      if (pkg[0]?.exclusive && availability.takenSeatIds.length > 0) {
        throw new BookingConflictError(
          "This slot already has a shared booking, please pick another",
        );
      }

      const unavailable = new Set([
        ...availability.takenSeatIds,
        ...availability.blockedSeatIds,
      ]);
      const clash = input.seatIds.filter((seat) => unavailable.has(seat));
      if (clash.length > 0) {
        throw new BookingConflictError(`Seat ${clash.join(", ")} was just taken`);
      }

      const values = toRow<Booking>(input, BOOKING_COLUMNS);
      // `do nothing` rather than letting a duplicate reference raise: an error
      // would abort the transaction and drop the lock it is holding.
      for (let attempt = 0; attempt < 5; attempt++) {
        const rows = await tx<BookingRow[]>`
          insert into cinema_bookings ${tx({ id: newId("bk_"), ref: newRef(), ...values })}
          on conflict do nothing
          returning *
        `;
        if (rows[0]) return toBooking(rows[0]);
      }
      throw new Error("Could not allocate a unique booking reference");
    });
  }

  async updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | null> {
    const sql = await this.ready();
    const row = toRow<Booking>(patch, BOOKING_COLUMNS);
    const rows = await (Object.keys(row).length === 0
      ? sql<BookingRow[]>`select * from cinema_bookings where id = ${id}`
      : sql<BookingRow[]>`update cinema_bookings set ${sql(row)} where id = ${id} returning *`);
    return rows[0] ? toBooking(rows[0]) : null;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const sql = await this.ready();
    const rows = await sql`delete from cinema_bookings where id = ${id} returning id`;
    return rows.length > 0;
  }

  // ------------------------------------------------------------------ blocks

  async listBlocks(filter?: { date?: string; slotId?: string }): Promise<SeatBlock[]> {
    const sql = await this.ready();
    const rows = await sql<SeatBlockRow[]>`
      select * from cinema_seat_blocks
      where true
        ${filter?.date ? sql`and date = ${filter.date}` : sql``}
        ${filter?.slotId ? sql`and slot_id = ${filter.slotId}` : sql``}
      order by created_at desc
    `;
    return rows.map(toBlock);
  }

  async createBlock(input: Omit<SeatBlock, "id" | "createdAt">): Promise<SeatBlock> {
    const sql = await this.ready();
    const row = { id: newId("bl_"), ...toRow<SeatBlock>(input, BLOCK_COLUMNS) };
    const rows = await sql<SeatBlockRow[]>`
      insert into cinema_seat_blocks ${sql(row)} returning *
    `;
    return toBlock(rows[0]);
  }

  async deleteBlock(id: string): Promise<boolean> {
    const sql = await this.ready();
    const rows = await sql`delete from cinema_seat_blocks where id = ${id} returning id`;
    return rows.length > 0;
  }

  // ----------------------------------------------------------------- derived

  async getAvailability(date: string, slotId: string): Promise<Availability> {
    const sql = await this.ready();
    return readAvailability(sql, date, slotId);
  }

  // ---------------------------------------------------------------- settings

  async getSettings(): Promise<Settings> {
    const sql = await this.ready();
    const rows = await sql<SettingsRow[]>`select * from cinema_settings where id = 1`;
    return rows[0] ? toSettings(rows[0]) : seedDatabase.settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const sql = await this.ready();
    const row = toRow<Settings>(patch, SETTINGS_COLUMNS);
    if (Object.keys(row).length === 0) return this.getSettings();

    const rows = await sql<SettingsRow[]>`
      update cinema_settings set ${sql(row)} where id = 1 returning *
    `;
    return rows[0] ? toSettings(rows[0]) : this.getSettings();
  }
}

// -------------------------------------------------------------------- seeding

/**
 * First-run content, from the same seed the JSON store used, so a fresh
 * database opens with the real movies, slots and packages already in it.
 * `on conflict do nothing` keeps it safe if it ever runs twice.
 */
async function seed(tx: Queryable): Promise<void> {
  for (const movie of seedDatabase.movies) {
    await tx`
      insert into cinema_movies ${tx({
        id: movie.id,
        ...toRow<Movie>(movie, MOVIE_COLUMNS),
        created_at: movie.createdAt,
      })}
      on conflict do nothing
    `;
  }

  for (const slot of seedDatabase.slots) {
    await tx`
      insert into cinema_slots ${tx({ id: slot.id, ...toRow<Slot>(slot, SLOT_COLUMNS) })}
      on conflict do nothing
    `;
  }

  for (const pkg of seedDatabase.packages) {
    await tx`
      insert into cinema_packages ${tx({
        id: pkg.id,
        ...toRow<Package>(pkg, PACKAGE_COLUMNS),
      })}
      on conflict do nothing
    `;
  }

  await tx`
    insert into cinema_settings ${tx({
      id: 1,
      ...toRow<Settings>(seedDatabase.settings, SETTINGS_COLUMNS),
    })}
    on conflict do nothing
  `;
}
