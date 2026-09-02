import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, notFound } from "../../_guard";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const ok = await db.deleteBlock(id);
  return ok ? NextResponse.json({ ok: true }) : notFound("Block not found");
}
