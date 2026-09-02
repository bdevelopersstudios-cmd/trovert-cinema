import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, notFound } from "../../_guard";
import type { Package } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const patch = (await request.json()) as Partial<Package>;
  const pkg = await db.updatePackage(id, patch);
  return pkg ? NextResponse.json(pkg) : notFound("Package not found");
}
