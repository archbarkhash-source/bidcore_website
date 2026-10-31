import { NextRequest, NextResponse } from "next/server";
import { activate, clientIpHash, logCall } from "@/lib/software-gateway";

export const dynamic = "force-dynamic";

// An installed Bidcore program activates itself here with its signed licence and its computer code (see src/lib/software-gateway.ts).
export async function POST(req: NextRequest) {
  const ipHash = clientIpHash(req.headers);
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 16000) throw new Error("too large");
    body = JSON.parse(text);
  } catch {
    await logCall({ endpoint: "activate", status: 400, ipHash, detail: "BAD_REQUEST" });
    return NextResponse.json({ error: "Invalid request.", code: "BAD_REQUEST" }, { status: 400 });
  }
  try {
    const r = await activate(body, ipHash);
    if (!r.ok) {
      await logCall({ endpoint: "activate", status: r.refusal.status, licenceId: r.licenceId ?? null, ipHash, detail: r.refusal.code });
      return NextResponse.json({ error: r.refusal.message, code: r.refusal.code }, { status: r.refusal.status });
    }
    await logCall({ endpoint: "activate", status: 200, licenceId: r.result.licenceId, ipHash, detail: r.result.product });
    return NextResponse.json(r.result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Activation is not available right now. Try again later.", code: "UNAVAILABLE" }, { status: 503 });
  }
}
