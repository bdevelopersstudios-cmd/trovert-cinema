import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, notFound } from "../../_guard";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const patch = (await request.json()) as Partial<Booking>;
  const booking = await db.updateBooking(id, patch);
  return booking ? NextResponse.json(booking) : notFound("Booking not found");
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const ok = await db.deleteBooking(id);
  return ok ? NextResponse.json({ ok: true }) : notFound("Booking not found");
}
