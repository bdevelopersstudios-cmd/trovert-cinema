/**
 * Smoke test for a running Trovert Cinema.
 *
 *   npm run smoke                        # against http://localhost:3000
 *   npm run smoke -- https://your-site   # against a deployment
 *
 * This exists because of two bugs that reached production. Both were invisible
 * to single-request API checks:
 *
 *   1. The pool was capped at one connection, so pages - which load movies,
 *      slots, packages and settings at once - hung while every API route
 *      stayed green.
 *   2. Cold starts took a global advisory lock, so the first visitor after an
 *      idle period waited on Supabase's two-minute statement timeout.
 *
 * So this checks PAGES as well as routes, checks them CONCURRENTLY, and fails
 * on latency rather than only on status. Read-only: it creates no bookings.
 */

const BASE = (process.argv[2] ?? process.env.SMOKE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SLOW_MS = Number(process.env.SMOKE_SLOW_MS ?? 10000);
const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 30000);

let failures = 0;
const pass = (m) => console.log(`  ok    ${m}`);
const fail = (m, d) => { failures++; console.log(`  FAIL  ${m}${d ? ` - ${d}` : ""}`); };

async function get(path) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(BASE + path, { signal: controller.signal, cache: "no-store" });
    const body = await res.text();
    return { status: res.status, body, ms: Date.now() - started };
  } catch (error) {
    return { status: 0, body: "", ms: Date.now() - started, error: error.name === "AbortError" ? `no response in ${REQUEST_TIMEOUT_MS}ms` : error.message };
  } finally {
    clearTimeout(timer);
  }
}

/** Every route must answer, and answer promptly. */
async function checkRoute(path, expect = []) {
  const { status, body, ms, error } = await get(path);
  if (status !== 200) return fail(`${path} -> ${status || "no response"}`, error);
  const missing = expect.filter((needle) => !body.includes(needle));
  if (missing.length) return fail(`${path} rendered without ${missing.join(", ")}`);
  if (ms > SLOW_MS) return fail(`${path} took ${ms}ms (limit ${SLOW_MS}ms)`);
  pass(`${path.padEnd(42)} ${String(ms).padStart(6)}ms`);
}

console.log(`Smoke test: ${BASE}\n`);

console.log("pages (each loads several tables at once)");
// Seeded content, so an empty or error page fails rather than silently passing.
await checkRoute("/", ["Trovert"]);
await checkRoute("/book", ["Trovert"]);
await checkRoute("/admin/login", []);

console.log("\napi routes");
await checkRoute("/api/movies", ["["]);
await checkRoute("/api/slots", ["["]);
await checkRoute("/api/packages", ["["]);
await checkRoute("/api/settings", ["currency"]);
await checkRoute("/api/availability?date=2030-01-01&slotId=sl_1830", ["takenSeatIds"]);

console.log("\nadmin routes must stay locked");
{
  const { status } = await get("/api/bookings");
  if (status === 401) pass("/api/bookings without a session -> 401");
  else fail("/api/bookings is not requiring auth", `got ${status}`);
}

console.log("\nthe data is real, not a fallback");
{
  const { status, body } = await get("/api/slots");
  let slots = [];
  try { slots = JSON.parse(body); } catch { /* handled below */ }
  if (status !== 200 || !Array.isArray(slots)) fail("/api/slots did not return a list");
  else if (slots.length === 0) fail("no slots configured");
  else pass(`${slots.length} slots, ${slots.filter((s) => s.active).length} active`);
}

console.log("\nconcurrent load (what a page fan-out and real visitors look like)");
{
  const burst = 8;
  const started = Date.now();
  const results = await Promise.all(Array.from({ length: burst }, () => get("/")));
  const wall = Date.now() - started;
  const bad = results.filter((r) => r.status !== 200);
  const slowest = Math.max(...results.map((r) => r.ms));
  if (bad.length) fail(`${bad.length}/${burst} concurrent requests failed`, bad[0].error ?? `status ${bad[0].status}`);
  else if (slowest > SLOW_MS) fail(`slowest of ${burst} concurrent requests was ${slowest}ms (limit ${SLOW_MS}ms)`);
  else pass(`${burst} concurrent requests, slowest ${slowest}ms, wall ${wall}ms`);
}

console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} smoke check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
