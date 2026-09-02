import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, notFound } from "../../_guard";
import type { Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const patch = (await request.json()) as Partial<Slot>;
  const slot = await db.updateSlot(id, patch);
  return slot ? NextResponse.json(slot) : notFound("Slot not found");
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const ok = await db.deleteSlot(id);
  return ok ? NextResponse.json({ ok: true }) : notFound("Slot not found");
}
