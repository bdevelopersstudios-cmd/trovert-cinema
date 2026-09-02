import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, badRequest } from "../_guard";
import type { Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const activeOnly = new URL(request.url).searchParams.get("all") !== "1";
  return NextResponse.json(await db.listSlots({ activeOnly }));
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json()) as Partial<Slot>;
  if (!body.start || !body.end) return badRequest("Start and end times are required");

  const existing = await db.listSlots();
  const slot = await db.createSlot({
    label: body.label?.trim() || `${body.start} - ${body.end}`,
    start: body.start,
    end: body.end,
    period: body.period === "late-night-morning" ? "late-night-morning" : "afternoon-evening",
    order: body.order ?? existing.length + 1,
    active: body.active ?? true,
  });
  return NextResponse.json(slot, { status: 201 });
}
