"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { TIMEZONE_OPTIONS, currentWeekMondayISO } from "@/lib/timezone";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
  } catch {
    return "Etc/UTC";
  }
}

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const zone = browserZone();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Call with friends",
          creatorZone: zone,
          weekStartDate: currentWeekMondayISO(zone)
        })
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const event = await res.json();
      router.push(`/event/${event.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCreating(false);
    }
  };

  return (
    <>
      <ThreeBackground />
      <main className="above-bg mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16">
        <div className="animate-fade-in text-center">
          {/* Brand lockup — terracotta accent fills the intersection of the two squares */}
          <img
            src="/brand/logo-lockup-horizontal-light.svg"
            alt="CalChat"
            height={48}
            className="mx-auto mb-6 h-12 w-auto"
          />
          <h1 className="mb-4 text-4xl font-medium tracking-tight text-ink-100 sm:text-5xl">
            Find a time that works,
            <br />
            <span className="text-accent">across every timezone.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-ink-300">
            Create a link, share with friends. Everyone picks the hours they&apos;re free in their
            own timezone. We&apos;ll show you the overlap.
          </p>
        </div>

        <div className="card animate-fade-in w-full max-w-md rounded-2xl p-6 shadow-2xl shadow-black/30">
          <label className="mb-2 block text-xs uppercase tracking-wider text-ink-300">
            What&apos;s this call about? <span className="text-ink-500">(optional)</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Catch-up with the group"
            className="w-full rounded-lg border border-ink-600 bg-ink-900/70 px-4 py-3 text-ink-100 placeholder:text-ink-500 transition focus:border-accent"
            maxLength={120}
          />

          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-medium text-ink-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create shareable link"}
          </button>

          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

          <p className="mt-4 text-center text-xs text-ink-400">
            Your timezone is detected as{" "}
            <span className="text-ink-200">
              {TIMEZONE_OPTIONS.find(t => t.zone === browserZone())?.label ?? browserZone()}
            </span>
          </p>
        </div>

        <footer className="mt-10 text-center text-xs text-ink-500">
          Free. No sign-up. Built with Next.js + Upstash.
        </footer>
      </main>
    </>
  );
}
