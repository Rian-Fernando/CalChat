import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { kv } from "@/lib/redis";
import { isValidZone, currentWeekMondayISO } from "@/lib/timezone";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title: string = (body?.title ?? "Untitled meet").toString().slice(0, 120);
  const creatorZone: string =
    typeof body?.creatorZone === "string" && isValidZone(body.creatorZone)
      ? body.creatorZone
      : "Etc/UTC";
  const weekStartDate: string =
    typeof body?.weekStartDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.weekStartDate)
      ? body.weekStartDate
      : currentWeekMondayISO(creatorZone);

  const id = nanoid(10);
  const event: CalendarEvent = {
    id,
    title,
    weekStartDate,
    createdAt: Date.now(),
    participants: {}
  };
  await kv.set(`event:${id}`, event);
  return NextResponse.json(event, { status: 201 });
}
