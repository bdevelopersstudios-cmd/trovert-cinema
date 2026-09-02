/**
 * Deliberately small admin gate: one shared passcode, one signed cookie.
 * Runs on both the Node and Edge runtimes (Web Crypto only), so middleware
 * can use it too. Swap for real accounts when the database lands.
 */

export const ADMIN_COOKIE = "tc_admin";

function passcode(): string {
  return process.env.ADMIN_PASSCODE ?? "trovert2025";
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
export function sessionToken(): Promise<string> {
  return sha256(passcode() + ":" + secret());
}

export async function isValidPasscode(input: string): Promise<boolean> {
  return input.length > 0 && input === passcode();
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await sessionToken());
}
