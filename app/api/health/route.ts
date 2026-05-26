import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint. Hit GET /api/health to see whether the Upstash env vars are wired
 * into the production runtime. Returns 200 with a JSON snapshot — no secret values are
 * disclosed, just presence flags + lengths.
 */
export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  return NextResponse.json({
    upstashUrlSet: Boolean(url),
    upstashUrlLength: url?.length ?? 0,
    upstashTokenSet: Boolean(token),
    upstashTokenLength: token?.length ?? 0,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION ?? null,
    timestamp: Date.now()
  });
}
