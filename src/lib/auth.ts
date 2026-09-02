/**
 * Deliberately small admin gate: one shared passcode, one signed cookie.
 * Runs on both the Node and Edge runtimes (Web Crypto only), so middleware
 * can use it too. Swap for real accounts when the database lands.
 */

export const ADMIN_COOKIE = "tc_admin";

/** Convenience passcode for local development only. */
const DEV_PASSCODE = "1234";

/**
 * In production the passcode MUST come from the environment.
 *
 * This repository is public, so a committed fallback would be a published
 * password — anyone could read it and sign into the live dashboard. When
 * ADMIN_PASSCODE is missing in production the gate fails closed: no passcode
 * is accepted at all, and the sign-in page explains how to set one.
 */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE) || process.env.NODE_ENV !== "production";
}

function passcode(): string | null {
  if (process.env.ADMIN_PASSCODE) return process.env.ADMIN_PASSCODE;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSCODE;
}

function secret(): string {
  return process.env.ADMIN_SECRET ?? "trovert-cinema-dev-secret";
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The exact cookie value a signed-in admin should be carrying. */
export async function sessionToken(): Promise<string | null> {
  const code = passcode();
  return code === null ? null : sha256(code + ":" + secret());
}

export async function isValidPasscode(input: string): Promise<boolean> {
  const code = passcode();
  if (code === null || input.length === 0) return false;
  return timingSafeEqual(input, code);
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await sessionToken();
  if (expected === null) return false;
  return timingSafeEqual(token, expected);
}

/** Constant-time comparison so a wrong guess leaks nothing through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
