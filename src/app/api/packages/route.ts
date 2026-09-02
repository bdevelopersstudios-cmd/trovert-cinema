import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const activeOnly = new URL(request.url).searchParams.get("all") !== "1";
  return NextResponse.json(await db.listPackages({ activeOnly }));
}
