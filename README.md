<div align="center">
  <img src="public/brand/icon.svg" width="110" alt="Trovert Cinema" />

  # Trovert Cinema

  **3D private-cinema seat booking for the Trovert Space home theatre in DHA 5, Lahore.**

  Walk the hall in 3D, tap the recliner you want, pick a slot and a package — plus an
  admin dashboard to run movies, time slots, pricing, seat holds and bookings.

  ### [trovert-cinema.vercel.app](https://trovert-cinema.vercel.app)
</div>

---

## What is in here

- **A real 3D hall.** Eleven powered recliners across three tiered rows, a glowing
  screen, slat acoustic walls, sconces and step lighting — built from three.js
  primitives, so there is no model file to download. Click a seat in the hall itself,
  or use the 2D map beside it.
- **Three camera views.** Hall, from the seats, and overhead — the camera eases
  between them.
- **The screen reacts.** Picking a movie tints the projection glow with that film's
  accent colour.
- **Booking rules that hold.** Shared slots go seat by seat; exclusive packages take
  the whole room and lock every other booking out of that slot. Double-booking a seat
  is rejected server-side, not just in the UI.
- **Admin dashboard.** Movies, time slots, packages and pricing, bookings with
  confirm/cancel, and per-date seat holds for maintenance or walk-ins.
- **Built for phones.** Leaner geometry and pixel ratio on mobile, one-finger orbit
  with pinch zoom, 48px seat targets, a sticky total-and-book bar, and no iOS
  zoom-on-focus.

## Running it

```bash
npm install
cp .env.example .env.local   # then set your own ADMIN_PASSCODE
npm run dev
```

Open <http://localhost:3000>. The dashboard is at `/admin` — the default passcode is
`1234` (change it in `.env.local`, and in the Vercel dashboard for the live site).

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Deploying

The repository is connected to Vercel, so **every push to `main` deploys itself** —
production lands on [trovert-cinema.vercel.app](https://trovert-cinema.vercel.app).

Two environment variables must be set in the Vercel project (Settings →
Environment Variables):

| Variable | Why |
| --- | --- |
| `ADMIN_PASSCODE` | The dashboard passcode. **Required in production** — this repository is public, so there is deliberately no committed fallback. Without it the admin gate fails closed and the sign-in page says so. |
| `ADMIN_SECRET` | A long random string used to sign the admin session cookie. |
| `DATABASE_URL` | Postgres connection string. **Required in production** — without it bookings do not survive, see below. |

To deploy by hand instead: `npx vercel deploy --prod`.

> **Set `DATABASE_URL` in production.** With it, bookings live in Postgres and every
> instance sees the same ones. Without it the app falls back to a per-instance JSON
> file, where a booking can vanish or be invisible to another visitor — fine for
> local development, not for the live site. See
> [Wiring up the database](#wiring-up-the-database).

## The hall

Eleven seats, laid out to match the real room:

```
              S C R E E N
        [A1] [A2] [A3] [A4]      front row, 4
        [B1] [B2] [B3] [B4]      middle row, 4  (raised)
          [C1] [C2] [C3]         back row, 3    (raised further)
```

The layout lives in a single file — [`src/lib/seats.ts`](src/lib/seats.ts). Change the
rows or the spacing there and both the 3D hall and the 2D seat map follow.

## Packages

| Package | Price | Guests | Cinema |
| --- | --- | --- | --- |
| Shared Slot | Rs. 2,500 / person | 1–11 | Shared |
| Couple | Rs. 10,000 | 2 | Entire cinema |
| Group of 4 | Rs. 15,000 | 3–4 | Entire cinema |
| Group of 6 | Rs. 20,000 | 5–6 | Entire cinema |
| More than 6 | Rs. 25,000 | 7–11 | Entire cinema |

All editable from **Admin → Packages**. Ten 2.5-hour slots run around the clock and
are editable from **Admin → Time slots**.

## Wiring up the database

The app stores everything in **Postgres**. Set one environment variable:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

That is the whole setup. On the first request the app creates its tables and seeds
the movies, slots, packages and settings — there is no migration or seed command to
run, and pointing it at an empty database is enough.

Any Postgres works, because the app speaks plain SQL rather than a vendor SDK:

| Provider | Where the connection string lives |
| --- | --- |
| **Supabase** | Project settings → Database → Connection string → URI. Use the **transaction pooler** (port `6543`) on Vercel. |
| **Neon** | Dashboard → Connection details → pooled connection string. |
| **Vercel Postgres** | Added to the project automatically as `DATABASE_URL`. |
| **Local** | `postgresql://postgres:postgres@localhost:5432/trovert` |

Leave `DATABASE_URL` unset and the app falls back to a JSON file at `.data/db.json`
(gitignored), so `npm run dev` works with no database installed. That fallback is for
development only — on serverless each instance keeps its own copy.

### How it fits together

**Nothing in the app imports a concrete store.** Every page and route goes through one
interface, so the two implementations are interchangeable:

```
src/lib/db/
├── repository.ts           ← the CinemaRepository interface (the contract)
├── postgres-repository.ts  ← Postgres, used when DATABASE_URL is set
├── json-repository.ts      ← file-backed fallback for local development
├── schema.ts               ← the SQL schema, applied on first use
├── errors.ts               ← BookingConflictError
├── seed.ts                 ← starting content, shared by both
└── index.ts                ← picks which implementation to export
```

Tables are prefixed `cinema_` (`cinema_movies`, `cinema_bookings`, …) so the app can
share a database with other things.

### Double-booking

A seat cannot be sold twice, even under a race. `POST /api/bookings` checks
availability before it writes, but two guests can both pass that check in the same
instant — so `createBooking` re-runs the check *inside* its write transaction, behind
a Postgres advisory lock on the date and slot. Attempts on the same showing queue up,
and the loser gets a `BookingConflictError` that the route turns into the same
friendly `400` as the pre-flight check. One booking is written, never two.

## API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/movies` `/api/slots` `/api/packages` `/api/settings` | public | Listings |
| `GET` | `/api/availability?date=&slotId=` | public | Taken, held and sold-out state |
| `POST` | `/api/bookings` | public | Create a booking request |
| `GET` | `/api/bookings` | admin | All bookings |
| `PATCH` `DELETE` | `/api/bookings/[id]` | admin | Confirm, cancel, delete |
| `POST` `PATCH` `DELETE` | `/api/movies`, `/api/slots`, `/api/packages/[id]` | admin | Manage content |
| `GET` `POST` `DELETE` | `/api/blocks` | admin | Hold seats back |
| `POST` `DELETE` | `/api/admin/session` | — | Sign in / out |

Bookings arrive as `pending`; an admin confirms them once payment is agreed.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Postgres · Tailwind CSS v4 ·
three.js with React Three Fiber and drei.

## Brand

The mark follows the Trovert family — a split disc, deep maroon over blush, with a
projector throwing light across a row of recliners where Trovert Space has clasped
hands and Trovert Travellers has mountains. Files live in
[`public/brand/`](public/brand): `logo.svg` (full lockup), `icon.svg` (mark only,
also the favicon) and `wordmark.svg`.

Palette: maroon `#6E101A` · signal red `#B3221F` · blush `#FBE0E0` ·
cream `#F2E4D2` · lamp tan `#D9A87C` · hall black `#0B0708`.

---

Built for [@trovertspace](https://instagram.com/trovertspace).
