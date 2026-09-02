import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "../_guard";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await db.getSettings());
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const patch = (await request.json()) as Partial<Settings>;
  return NextResponse.json(await db.updateSettings(patch));
}
