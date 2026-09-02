import type { CinemaRepository } from "./repository";
import { JsonRepository } from "./json-repository";

/**
 * Single place the whole app resolves its data source from.
 *
 * To move onto a real database later, implement `CinemaRepository`
 * (see `repository.ts`) and return that instance here instead — e.g.
 *
 *   export const db: CinemaRepository = process.env.DATABASE_URL
 *     ? new PrismaRepository()
 *     : new JsonRepository();
 *
 * Nothing else in the codebase imports the concrete implementation.
 */
const globalForDb = globalThis as unknown as { __trovertDb?: CinemaRepository };

export const db: CinemaRepository = globalForDb.__trovertDb ?? new JsonRepository();

if (process.env.NODE_ENV !== "production") globalForDb.__trovertDb = db;

export type { CinemaRepository };
