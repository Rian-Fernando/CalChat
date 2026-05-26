import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint. Tells you whether the production runtime is talking to a real
 * Redis (vs the in-memory fallback) by attempting an actual set/get round-trip.
 * Never returns the values of any env vars.
 */
export async function GET() {
  const probeKey = `healthcheck:${Date.now()}`;
  const probeValue = "ok";
  let roundTripOk = false;
  let roundTripError: string | null = null;
  try {
    await kv.set(probeKey, probeValue);
    const got = await kv.get<string>(probeKey);
    roundTripOk = got === probeValue;
  } catch (e) {
    roundTripError = e instanceof Error ? e.message : String(e);
  }

  const namePattern = /(REDIS|UPSTASH|KV)/i;
  const candidates = Object.keys(process.env)
    .filter(n => namePattern.test(n))
    .sort()
    .map(name => ({ name, length: (process.env[name] ?? "").length }));

  return NextResponse.json({
    persistentStore: roundTripOk ? "connected" : "in-memory fallback (data will be lost)",
    roundTripOk,
    roundTripError,
    redisRelatedEnvNames: candidates,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
    timestamp: Date.now()
  });
}
