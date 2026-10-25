const STORAGE_KEY = "bidcore_saved_companies";

export function getSavedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isSaved(slug: string): boolean {
  return getSavedSlugs().includes(slug);
}

export function toggleSaved(slug: string): boolean {
  const current = getSavedSlugs();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("bidcore-saved-change"));
  return next.includes(slug);
}
