import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";

/** Returns a 401 response when the caller is not a signed-in admin. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const ok = await isValidSession(jar.get(ADMIN_COOKIE)?.value);
  return ok ? null : NextResponse.json({ error: "Not authorised" }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
