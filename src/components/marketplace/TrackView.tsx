"use client";

import { useEffect } from "react";

// Sends one page-view beacon per visit. Pages are cached, so views cannot be counted while rendering on the server.
export default function TrackView({ type, id }: { type: "company_view" | "listing_view"; id: string }) {
  useEffect(() => {
    const key = `mp-view-${type}-${id}`;
    try {
      if (sessionStorage.getItem(key)) return; // one count per browser session
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: still count once for this page load
    }
    fetch("/api/marketplace/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }), keepalive: true }).catch(() => {});
  }, [type, id]);
  return null;
}
