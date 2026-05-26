import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint. Reports presence of any env var name that looks Redis-related,
 * so we can spot what the Vercel Upstash integration actually created. NEVER returns
 * the values themselves — just the names + lengths.
 */
export async function GET() {
  const namePattern = /(REDIS|UPSTASH|KV)/i;
  const candidates = Object.keys(process.env)
    .filter(name => namePattern.test(name))
    .sort()
    .map(name => ({
      name,
      length: (process.env[name] ?? "").length
    }));

  const expected = {
    upstashUrlSet: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    upstashTokenSet: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    upstashUrlLength: (process.env.UPSTASH_REDIS_REST_URL ?? "").length,
    upstashTokenLength: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").length
  };

  return NextResponse.json({
    expected,
    candidates,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION ?? null,
    timestamp: Date.now()
  });
}
