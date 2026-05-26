import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";
import { isValidZone } from "@/lib/timezone";
import { nextColor } from "@/lib/colors";
import type { CalendarEvent, Participant, UpsertParticipantPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => null)) as UpsertParticipantPayload | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { participantId, name, timezone, availability } = body;

  if (!participantId || typeof participantId !== "string" || participantId.length > 40) {
    return NextResponse.json({ error: "participantId required" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (!isValidZone(timezone)) {
    return NextResponse.json({ error: "invalid timezone" }, { status: 400 });
  }
  if (!Array.isArray(availability) || availability.some(h => !Number.isInteger(h))) {
    return NextResponse.json({ error: "availability must be integer[]" }, { status: 400 });
  }

  const event = await kv.get<CalendarEvent>(`event:${params.id}`);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const existing = event.participants[participantId];
  const order = Object.keys(event.participants).length;
  const participant: Participant = {
    id: participantId,
    name: name.trim().slice(0, 40),
    timezone,
    availability: Array.from(new Set(availability)).sort((a, b) => a - b),
    color: existing?.color ?? nextColor(order),
    updatedAt: Date.now()
  };

  event.participants[participantId] = participant;
  await kv.set(`event:${params.id}`, event);
  return NextResponse.json(event);
}
