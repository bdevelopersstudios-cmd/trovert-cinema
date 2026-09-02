import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest } from "../_guard";

export const dynamic = "force-dynamic";

/** GET /api/availability?date=2026-09-02&slotId=sl_1830 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const slotId = url.searchParams.get("slotId");
  if (!date || !slotId) return badRequest("date and slotId are required");
  return NextResponse.json(await db.getAvailability(date, slotId));
}
