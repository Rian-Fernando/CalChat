import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const event = await kv.get<CalendarEvent>(`event:${params.id}`);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}
