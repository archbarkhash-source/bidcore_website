"use client";

import { useEffect, useState } from "react";

export interface SessionUser {
  name: string;
  companyName: string;
  tenderTrialStartedAt: string | null;
}

const CHANGE_EVENT = "bidcore-session-change";

export function notifySessionChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// undefined = still loading, null = signed out
export function useSession(): SessionUser | null | undefined {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/session")
        .then((r) => r.json())
        .then((d) => !cancelled && setUser(d.user ?? null))
        .catch(() => !cancelled && setUser(null));

    load();
    window.addEventListener(CHANGE_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGE_EVENT, load);
    };
  }, []);

  return user;
}
