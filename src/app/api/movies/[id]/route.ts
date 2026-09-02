import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, notFound } from "../../_guard";
import type { Movie } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const movie = await db.getMovie(id);
  return movie ? NextResponse.json(movie) : notFound("Movie not found");
}

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const patch = (await request.json()) as Partial<Movie>;
  const movie = await db.updateMovie(id, patch);
  return movie ? NextResponse.json(movie) : notFound("Movie not found");
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const ok = await db.deleteMovie(id);
  return ok ? NextResponse.json({ ok: true }) : notFound("Movie not found");
}
