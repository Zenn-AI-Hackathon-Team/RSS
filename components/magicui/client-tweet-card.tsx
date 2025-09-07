"use client";

import { Tweet } from "react-tweet";

function extractTweetId(input?: string | null): string | null {
  if (!input) return null;
  // If numeric-ish id was provided
  if (/^\d{8,}$/.test(input)) return input;
  try {
    const u = new URL(input);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "status");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

export function ClientTweetCard({ id, url }: { id?: string; url?: string }) {
  const resolved = extractTweetId(id || url || null);
  if (!resolved) return null;
  return (
    <div className="flex justify-center w-full tweet-embed">
      <div className="w-full max-w-[560px]">
        <Tweet id={resolved} />
      </div>
    </div>
  );
}
