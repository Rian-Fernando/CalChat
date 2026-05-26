import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";
import { isValidZone } from "@/lib/timezone";
import { firstAvailableColor, isPaletteColor } from "@/lib/colors";
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

  // Colors taken by OTHER participants (the current one can keep its own)
  const takenByOthers = Object.values(event.participants)
    .filter(p => p.id !== participantId)
    .map(p => p.color);

  let color: string;
  const requested = body.color;
  if (typeof requested === "string") {
    if (!isPaletteColor(requested)) {
      return NextResponse.json({ error: "Invalid color (not in palette)" }, { status: 400 });
    }
    if (takenByOthers.includes(requested)) {
      return NextResponse.json(
        { error: "That color is already taken — please pick another", takenByOthers },
        { status: 409 }
      );
    }
    color = requested;
  } else {
    // Back-compat: no color requested → keep existing or auto-assign first free
    color = existing?.color ?? firstAvailableColor(takenByOthers);
  }

  const noteRaw = body.note;
  let note: string | undefined;
  if (typeof noteRaw === "string") {
    note = noteRaw.slice(0, 500);
  } else if (noteRaw === null) {
    note = undefined;
  } else {
    // not provided — preserve existing
    note = existing?.note;
  }

  const participant: Participant = {
    id: participantId,
    name: name.trim().slice(0, 40),
    timezone,
    availability: Array.from(new Set(availability)).sort((a, b) => a - b),
    color,
    note,
    updatedAt: Date.now()
  };

  event.participants[participantId] = participant;
  await kv.set(`event:${params.id}`, event);
  return NextResponse.json(event);
}
