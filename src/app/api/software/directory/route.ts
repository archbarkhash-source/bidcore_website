import { NextRequest, NextResponse } from "next/server";
import { DIRECTORY_PRODUCTS } from "@/lib/software-licence-core";
import { authenticate, clientIpHash, directoryPage, directoryRateOk, logCall } from "@/lib/software-gateway";

export const dynamic = "force-dynamic";

// The Bidcore contractor directory for an activated program, as company cards only (no phone, e-mail, address or contact person - not even masked).
// GET ?cursor=<from the previous answer>&limit=<1..500>. The program stores the last cursor and asks only for what changed after it next time.
export async function GET(req: NextRequest) {
  const ipHash = clientIpHash(req.headers);
  try {
    const auth = await authenticate(req.headers);
    if (!auth.ok) {
      await logCall({ endpoint: "directory", status: auth.refusal.status, activationId: auth.caller?.activationId, licenceId: auth.caller?.licenceId, ipHash, detail: auth.refusal.code });
      return NextResponse.json({ error: auth.refusal.message, code: auth.refusal.code }, { status: auth.refusal.status });
    }
    const { caller } = auth;
    const log = (status: number, detail: string) => logCall({ endpoint: "directory", status, activationId: caller.activationId, licenceId: caller.licenceId, ipHash, detail });
    if (!DIRECTORY_PRODUCTS.has(caller.product)) {
      await log(403, "NOT_INCLUDED");
      return NextResponse.json({ error: "The contractor directory is not part of this program.", code: "NOT_INCLUDED" }, { status: 403 });
    }
    if (!(await directoryRateOk(caller))) {
      await log(429, "RATE_LIMITED");
      return NextResponse.json({ error: "Too many directory requests. Try again in an hour.", code: "RATE_LIMITED" }, { status: 429 });
    }
    const sp = req.nextUrl.searchParams;
    const page = await directoryPage(sp.get("cursor"), Number(sp.get("limit") ?? "500"));
    if ("bad" in page) {
      await log(400, "BAD_CURSOR");
      return NextResponse.json({ error: "Invalid cursor.", code: "BAD_CURSOR" }, { status: 400 });
    }
    await log(200, `items=${page.items.length}`);
    return NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The directory is not available right now. Try again later.", code: "UNAVAILABLE" }, { status: 503 });
  }
}
