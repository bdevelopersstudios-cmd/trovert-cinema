import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, badRequest } from "../_guard";
import type { Movie } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const activeOnly = new URL(request.url).searchParams.get("all") !== "1";
  return NextResponse.json(await db.listMovies({ activeOnly }));
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json()) as Partial<Movie>;
  if (!body.title?.trim()) return badRequest("Title is required");

  const movie = await db.createMovie({
    title: body.title.trim(),
    year: body.year ?? null,
    genre: body.genre ?? "",
    language: body.language ?? "",
    durationMins: Number(body.durationMins) || 120,
    rating: body.rating ?? "",
    synopsis: body.synopsis ?? "",
    posterUrl: body.posterUrl ?? "",
    accent: body.accent || "#B3221F",
    active: body.active ?? true,
  });
  return NextResponse.json(movie, { status: 201 });
}
