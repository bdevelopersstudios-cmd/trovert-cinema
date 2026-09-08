/**
 * The Postgres schema, applied on first use.
 *
 * Every statement is `if not exists`, so booting a second instance against the
 * same database is a no-op rather than an error — there is no migration step
 * to run before the app starts. Tables are prefixed `cinema_` so the app can
 * live alongside other things in a shared database.
 *
 * Dates stay `text` in `YYYY-MM-DD` form, matching the domain types and the
 * wire format the booking UI already speaks; ISO dates sort correctly as text,
 * and nothing has to reason about the server's timezone.
 */
export const SCHEMA_SQL = `
-- Multiple statements in one simple query run as a single implicit
-- transaction, so SET LOCAL covers everything below and reverts with it.
-- Creating a table takes locks; bound the wait rather than letting a cold
-- start queue behind another instance for the pooler's two-minute default.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists cinema_movies (
  id            text primary key,
  title         text not null,
  year          integer,
  genre         text not null default '',
  language      text not null default '',
  duration_mins integer not null default 0,
  rating        text not null default '',
  synopsis      text not null default '',
  poster_url    text not null default '',
  accent        text not null default '#B3221F',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists cinema_slots (
  id         text primary key,
  label      text not null,
  start_time text not null,
  end_time   text not null,
  period     text not null,
  sort_order integer not null default 0,
  active     boolean not null default true
);

create table if not exists cinema_packages (
  id         text primary key,
  name       text not null,
  note       text not null default '',
  price      integer not null default 0,
  min_guests integer not null default 1,
  max_guests integer not null default 11,
  exclusive  boolean not null default false,
  sort_order integer not null default 0,
  active     boolean not null default true
);

-- slot_id and package_id are deliberately not foreign keys: an admin may retire
-- a slot or package that historic bookings still point at, exactly as the JSON
-- store allowed. A deleted movie only clears the reference.
create table if not exists cinema_bookings (
  id            text primary key,
  ref           text not null unique,
  customer_name text not null,
  phone         text not null,
  email         text not null default '',
  date          text not null,
  slot_id       text not null,
  movie_id      text references cinema_movies(id) on delete set null,
  package_id    text not null,
  seat_ids      text[] not null default '{}',
  guests        integer not null default 1,
  amount        integer not null default 0,
  status        text not null default 'pending'
                check (status in ('pending', 'confirmed', 'cancelled')),
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists cinema_bookings_slot_idx
  on cinema_bookings (date, slot_id);
create index if not exists cinema_bookings_recent_idx
  on cinema_bookings (date desc, created_at desc);

create table if not exists cinema_seat_blocks (
  id         text primary key,
  date       text not null,
  slot_id    text not null,
  seat_ids   text[] not null default '{}',
  reason     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists cinema_seat_blocks_slot_idx
  on cinema_seat_blocks (date, slot_id);

create table if not exists cinema_settings (
  id            integer primary key check (id = 1),
  venue_note    text not null default '',
  location_note text not null default '',
  whatsapp      text not null default '',
  instagram     text not null default '',
  currency      text not null default 'PKR'
);
`;
