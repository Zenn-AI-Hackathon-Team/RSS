import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";
import "server-only";

export function getServerApi() {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL || "");
    return hc<AppType>(base || "/");
  }

