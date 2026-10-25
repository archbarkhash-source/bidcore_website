"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LocateFixed, Star, UserPlus } from "lucide-react";

const PAGE_SIZE = 20;

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  ratingsCount: number;
  businessStatus: string | null;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

const CATEGORIES = [
  { label: "All", keyword: "construction contractor" },
  { label: "Architects", keyword: "architect" },
  { label: "Contractors", keyword: "construction contractor" },
  { label: "General Contractors", keyword: "general contractor" },
  { label: "Developers", keyword: "real estate developer" },
  { label: "Suppliers", keyword: "building material supplier" },
];

export default function NearMeFinder() {
  const [status, setStatus] = useState<
    "idle" | "locating" | "searching" | "loadingMore" | "error"
  >("idle");
  const [radiusKm, setRadiusKm] = useState(25);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(point);
        search(point, radiusKm, category.keyword);
      },
      () => {
        setStatus("error");
        setErrorMsg("Couldn't get your location.");
      },
      { timeout: 10000 },
    );
  }

  async function search(point: { lat: number; lng: number }, km: number, keyword: string) {
    setStatus("searching");
    setPage(1);
    try {
      const res = await fetch(
        `/api/places/search?lat=${point.lat}&lng=${point.lng}&radiusKm=${km}&keyword=${encodeURIComponent(keyword)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results);
      setNextPageToken(data.nextPageToken ?? null);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Search failed. Please try again.");
    }
  }

  // Fetches one more page from Google and appends it to what's already in
  // memory. Only called when the requested page isn't already loaded — once
  // results are fetched, paging back and forth between them is free (no
  // repeat API calls / quota use).
  async function fetchNextGooglePage() {
    if (!nextPageToken) return false;
    setStatus("loadingMore");
    try {
      const res = await fetch(`/api/places/search?pageToken=${nextPageToken}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load more");
      setResults((prev) => [...(prev ?? []), ...data.results]);
      setNextPageToken(data.nextPageToken ?? null);
      setStatus("idle");
      return true;
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Failed to load more results.");
      return false;
    }
  }

  async function goToNextPage() {
    const haveEnough = (results?.length ?? 0) > page * PAGE_SIZE;
    if (haveEnough) {
      setPage((p) => p + 1);
      return;
    }
    if (nextPageToken) {
      const ok = await fetchNextGooglePage();
      if (ok) setPage((p) => p + 1);
    }
  }

  function goToPrevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  function changeRadius(km: number) {
    setRadiusKm(km);
    if (coords) search(coords, km, category.keyword);
  }

  function changeCategory(cat: (typeof CATEGORIES)[number]) {
    setCategory(cat);
    if (coords) search(coords, radiusKm, cat.keyword);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => changeCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              category.label === cat.label
                ? "bg-brand-navy text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-accent hover:text-brand-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={useMyLocation}
          disabled={status === "locating" || status === "searching"}
          className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {status === "locating"
            ? "Finding your location..."
            : status === "searching"
              ? "Searching..."
              : "Use My Location"}
        </button>

        {coords && (
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-1">
            {RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                onClick={() => changeRadius(km)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  radiusKm === km
                    ? "bg-brand-navy text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        )}
      </div>

      {status === "error" && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

      {results && (
        <div className="mt-6">
          <p className="text-sm text-slate-500">
            {results.length} result{results.length === 1 ? "" : "s"} loaded within {radiusKm} km,
            live from Google and are not yet part of the verified Bidcore network.
          </p>
          <div className="mt-3 space-y-3">
            {results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((place) => (
              <div
                key={place.placeId}
                className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-medium text-brand-navy">{place.name}</p>
                  <p className="text-sm text-slate-500">{place.address}</p>
                  {place.rating !== null && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {place.rating} ({place.ratingsCount})
                    </p>
                  )}
                </div>
                <Link
                  href={`/invite?name=${encodeURIComponent(place.name)}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-brand-navy hover:text-brand-navy"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Invite to Bidcore
                </Link>
              </div>
            ))}
            {results.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No results nearby. Try a larger radius or a different category.
              </p>
            )}
          </div>

          {results.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={goToPrevPage}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-navy hover:text-brand-navy disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page}</span>
              <button
                onClick={goToNextPage}
                disabled={
                  status === "loadingMore" ||
                  (results.length <= page * PAGE_SIZE && !nextPageToken)
                }
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-navy hover:text-brand-navy disabled:opacity-40"
              >
                {status === "loadingMore" ? "Loading..." : "Next"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
