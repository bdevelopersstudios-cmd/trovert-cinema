import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidPasscode, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Sign in with the shared admin passcode. */
export async function POST(request: Request) {
  const { passcode } = (await request.json()) as { passcode?: string };

  if (!(await isValidPasscode(passcode ?? ""))) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
