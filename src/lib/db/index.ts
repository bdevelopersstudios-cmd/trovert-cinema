import type { CinemaRepository } from "./repository";
import { JsonRepository } from "./json-repository";
import { PostgresRepository } from "./postgres-repository";

/**
 * Single place the whole app resolves its data source from.
 *
 * Set `DATABASE_URL` and every page and route is served by Postgres — schema
 * and seed content are created on first use, so there is no migration step.
 * Leave it unset and the app falls back to the JSON store in `.data/db.json`,
 * which keeps `npm run dev` working with no database to install.
 *
 * Nothing else in the codebase imports a concrete implementation; both sides
 * satisfy `CinemaRepository` (see `repository.ts`).
 */
const globalForDb = globalThis as unknown as { __trovertDb?: CinemaRepository };

function createRepository(): CinemaRepository {
  if (process.env.DATABASE_URL) return new PostgresRepository();

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[trovert-cinema] DATABASE_URL is not set, so bookings are being kept in a " +
        "per-instance JSON file. Set it to a Postgres connection string to make " +
        "them persist and be visible across instances.",
    );
  }
  return new JsonRepository();
}

export const db: CinemaRepository = globalForDb.__trovertDb ?? createRepository();

if (process.env.NODE_ENV !== "production") globalForDb.__trovertDb = db;

export type { CinemaRepository };
export { BookingConflictError, isBookingConflict } from "./errors";
