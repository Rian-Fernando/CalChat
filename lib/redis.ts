import { Redis } from "@upstash/redis";

interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let kv: KV;

if (url && token) {
  const redis = new Redis({ url, token });
  kv = {
    get: <T>(key: string) => redis.get<T>(key) as Promise<T | null>,
    set: (key, value) => redis.set(key, value)
  };
} else {
  // Local-dev fallback: in-memory store persisted across hot reloads via globalThis.
  // Data is lost on server restart — fine for dev, never used in prod (Vercel always has env vars).
  const g = globalThis as unknown as { __calchat_store?: Map<string, unknown> };
  const store = g.__calchat_store ?? (g.__calchat_store = new Map());
  if (!g.__calchat_store) {
    console.warn(
      "[calchat] Upstash env not set — using in-memory store. Set UPSTASH_REDIS_REST_URL & _TOKEN for persistence."
    );
  }
  kv = {
    get: async <T>(key: string) => (store.get(key) as T) ?? null,
    set: async (key, value) => {
      store.set(key, value);
      return "OK";
    }
  };
}

export { kv };
