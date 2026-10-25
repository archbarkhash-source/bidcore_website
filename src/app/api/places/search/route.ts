import { NextRequest, NextResponse } from "next/server";

// Live proxy to Google Places API — results are fetched on demand and
// returned directly to the client, never written to our database. Storing
// or caching Places data to build a competing business directory would
// violate Google's Maps Platform terms; this route intentionally never
// persists a response.
export async function GET(req: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken");

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");

  if (pageToken) {
    // A page token alone determines the next page — other params are ignored
    // by the API when present, and including them can trigger INVALID_REQUEST.
    url.searchParams.set("pagetoken", pageToken);
    url.searchParams.set("key", apiKey);
  } else {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusKm = Number(searchParams.get("radiusKm") ?? "25");
    const keyword = searchParams.get("keyword") ?? "construction contractor";

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required." }, { status: 400 });
    }

    const radiusMeters = Math.min(Math.max(radiusKm, 1), 50) * 1000;
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", String(radiusMeters));
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("key", apiKey);
  }

  try {
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "INVALID_REQUEST" && pageToken) {
      // The next_page_token can take a couple of seconds to activate.
      return NextResponse.json(
        { error: "Next page isn't ready yet — try again in a moment." },
        { status: 429 },
      );
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: data.error_message ?? data.status ?? "Places API error" },
        { status: 502 },
      );
    }

    const results = (data.results ?? []).map((r: {
      place_id: string;
      name: string;
      vicinity?: string;
      formatted_address?: string;
      rating?: number;
      user_ratings_total?: number;
      business_status?: string;
    }) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.vicinity ?? r.formatted_address ?? "",
      rating: r.rating ?? null,
      ratingsCount: r.user_ratings_total ?? 0,
      businessStatus: r.business_status ?? null,
    }));

    return NextResponse.json({ results, nextPageToken: data.next_page_token ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to reach Google Places API." }, { status: 502 });
  }
}
