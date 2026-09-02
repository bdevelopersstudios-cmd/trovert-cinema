import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, badRequest } from "../_guard";
import { SEAT_IDS } from "@/lib/seats";
import type { SeatBlock } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  return NextResponse.json(
    await db.listBlocks({
      date: url.searchParams.get("date") ?? undefined,
      slotId: url.searchParams.get("slotId") ?? undefined,
    }),
  );
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json()) as Partial<SeatBlock>;
  if (!body.date || !body.slotId) return badRequest("date and slotId are required");

  const seatIds = [...new Set(body.seatIds ?? [])].filter((id) => SEAT_IDS.includes(id));
  if (seatIds.length === 0) return badRequest("Pick at least one seat to block");

  const block = await db.createBlock({
    date: body.date,
    slotId: body.slotId,
    seatIds,
    reason: body.reason?.trim() ?? "",
  });
  return NextResponse.json(block, { status: 201 });
}
