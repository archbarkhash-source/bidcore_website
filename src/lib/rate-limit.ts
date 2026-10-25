// A small in-memory sliding-window limiter for public form endpoints. It is per server instance, so it is a safety net against bursts, not a substitute for a
// shared limiter if the site ever runs on several instances.
const hits = new Map<string, number[]>();

export function allow(key: string, max: number, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
