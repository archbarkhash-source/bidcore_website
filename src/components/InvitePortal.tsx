"use client";
// The contractor's page for one tender invitation (Phase 2 gateway). Talks only to /api/invite/{token}/... (src/app/api/invite/[token]/[[...path]]/route.ts).
// The inviting company never sees the contractor's e-mail or phone here; contact details are shared only through the approve form at the bottom.
import { useCallback, useEffect, useMemo, useState } from "react";

interface Question { id: string; text: string; required?: boolean; type?: "yesno" | "text" }
interface LineItem { id: string; description: string; unit?: string; quantity?: number | null }
interface Alternate { id: string; name: string; description?: string }
interface BidForm { questions?: Question[]; line_items?: LineItem[]; alternates?: Alternate[]; base_bid?: { enabled?: boolean } }
interface FileInfo { id: string; name: string; size: string }
interface Msg { id: string; sender: "inviter" | "contractor"; body: string; created_at: string }
interface View {
  company: string;
  answer: string | null;
  closedReason: string | null;
  verified: boolean;
  maskedEmail: string | null;
  tender: { title: string; packageNumber: string | null; projectName: string | null; trade: string | null; location: string | null; description: string | null; inviterCompany: string; inviterName: string | null; currency: string; dueAt: string | null };
  bidForm?: BidForm | null;
  files?: FileInfo[];
  bid?: { revision: number; payload: Record<string, unknown>; submitted_at: string } | null;
  bidFiles?: FileInfo[];
  messages?: Msg[];
  contactRequest?: { status: string; requestedAt: string; company: string } | null;
}

const btn = "rounded-full px-5 py-2 text-sm font-semibold transition disabled:opacity-50";
const primary = `${btn} bg-brand-accent text-white hover:bg-brand-accent-light`;
const secondary = `${btn} border border-slate-300 text-brand-navy hover:border-slate-400`;
const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-navy";
const card = "rounded-xl border border-slate-200 bg-white p-5";
const mb = (n: string | number) => `${(Number(n) / 1048576).toFixed(1)} MB`;
const CHUNK = 4 * 1024 * 1024;

async function sha256Hex(buf: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function InvitePortal({ token, action }: { token: string; action: "unsubscribe" | "report" | null }) {
  const base = `/api/invite/${token}`;
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState("");
  const [done, setDone] = useState<"" | "unsubscribed" | "reported">("");

  const call = useCallback(
    async (path: string, init?: RequestInit) => {
      const r = await fetch(`${base}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Something went wrong.");
      return j;
    },
    [base],
  );
  const load = useCallback(() => call("").then(setView).catch((e) => setError(e.message)), [call]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
      await load();
      if (ok) setNote(ok); // after the page shows the new state, so the confirmation and the change appear together
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <div className={card}><p className="text-slate-700">{done === "unsubscribed" ? "You will not receive tender invitations from Bidcore at this address any more." : "Thank you. The invitation has been reported and Bidcore will review it."}</p></div>;
  if (!view) return <div className={card}><p className="text-sm text-slate-500">{error || "Loading the invitation..."}</p></div>;
  const t = view.tender;
  const due = t.dueAt ? new Date(t.dueAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not stated";

  return (
    <div className="space-y-5">
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tender invitation for {view.company}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-navy">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          From <b>{t.inviterCompany}</b>
          {t.inviterName ? ` (${t.inviterName})` : ""} · Due <b>{due}</b>
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {t.packageNumber && <Item k="Package" v={t.packageNumber} />}
          {t.projectName && <Item k="Project" v={t.projectName} />}
          {t.trade && <Item k="Work" v={t.trade} />}
          {t.location && <Item k="Location" v={t.location} />}
        </dl>
        {t.description && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{t.description}</p>}
        {view.closedReason && <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{view.closedReason}</p>}
      </div>

      {(error || note) && <p className={`rounded-md p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || note}</p>}

      {action && (
        <div className={card}>
          {action === "unsubscribe" ? (
            <>
              <p className="text-sm text-slate-700">Stop all tender invitations from Bidcore to this e-mail address?</p>
              <button className={`${secondary} mt-3`} disabled={busy} onClick={() => run(() => call("/unsubscribe", { method: "POST" })).then(() => setDone("unsubscribed"))}>
                Yes, stop invitations
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-700">Report this invitation as unwanted? Bidcore reviews every report; companies with repeated reports cannot send invitations.</p>
              <button className={`${secondary} mt-3`} disabled={busy} onClick={() => run(() => call("/report", { method: "POST", body: JSON.stringify({ reason: "unwanted" }) })).then(() => setDone("reported"))}>
                Report as unwanted
              </button>
            </>
          )}
        </div>
      )}

      {!view.verified ? (
        <div className={card}>
          <h2 className="font-semibold text-brand-navy">Respond to this tender</h2>
          <p className="mt-1 text-sm text-slate-600">
            To see the documents and respond, confirm that you received this invitation: we send a 6-digit code to {view.maskedEmail ?? "the address it was sent to"}.
          </p>
          {!codeSent ? (
            <button className={`${primary} mt-3`} disabled={busy || !!view.closedReason?.includes("expired")} onClick={() => run(async () => setCodeSent((await call("/code", { method: "POST" })).sentTo))}>
              Send me the code
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm text-slate-700">
                Code sent to {codeSent}
                <input className={input} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              </label>
              <button className={primary} disabled={busy || code.length !== 6} onClick={() => run(() => call("/verify", { method: "POST", body: JSON.stringify({ code }) }))}>
                Confirm
              </button>
            </div>
          )}
        </div>
      ) : (
        <Verified view={view} base={base} call={call} run={run} busy={busy} />
      )}
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{k}</dt>
      <dd className="text-slate-800">{v}</dd>
    </div>
  );
}

function Verified({ view, base, call, run, busy }: { view: View; base: string; call: (p: string, i?: RequestInit) => Promise<any>; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean }) {
  const form: BidForm = view.bidForm ?? {};
  const open = !view.closedReason;
  const prev = (view.bid?.payload ?? {}) as Record<string, any>;
  const [answers, setAnswers] = useState<Record<string, boolean | string>>(prev.answers ?? {});
  const [lines, setLines] = useState<Record<string, string>>(Object.fromEntries(Object.entries(prev.line_item_prices ?? {}).map(([k, v]) => [k, String(v)])));
  const [alts, setAlts] = useState<Record<string, { amount: string; type: "add" | "deduct" } | null>>(
    Object.fromEntries(Object.entries(prev.alternate_prices ?? {}).map(([k, v]: [string, any]) => [k, v ? { amount: String(v.amount), type: v.type } : null])),
  );
  const [total, setTotal] = useState(prev.base_bid != null ? String(prev.base_bid) : "");
  const [text, setText] = useState({ clarifications: prev.clarifications ?? "", exclusions: prev.exclusions ?? "", notes: prev.notes ?? "", lead: prev.lead_time_weeks != null ? String(prev.lead_time_weeks) : "" });
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [share, setShare] = useState({ name: "", email: "", phone: "" });
  const lineItems = form.line_items ?? [];
  const lineSum = useMemo(() => lineItems.reduce((s, l) => s + (Number(lines[l.id]) || 0) * (l.quantity ?? 1), 0), [lineItems, lines]);
  const money = (n: number) => `${view.tender.currency === "INR" ? "₹" : view.tender.currency + " "}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const upload = async (f: File) => {
    const buf = await f.arrayBuffer();
    const sha256 = await sha256Hex(buf);
    const b = await call("/files", { method: "POST", body: JSON.stringify({ name: f.name, mime: f.type || "application/octet-stream", size: f.size, sha256 }) });
    if (!b.existing) {
      for (let i = 0; i < b.chunks; i++) {
        const r = await fetch(`${base}/files/${b.fileId}/chunks/${i}`, { method: "PUT", body: buf.slice(i * CHUNK, Math.min((i + 1) * CHUNK, f.size)) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Upload failed.");
      }
      await call(`/files/${b.fileId}/complete`, { method: "POST" });
    }
    setFiles((x) => [...x.filter((y) => y.id !== b.fileId), { id: b.fileId, name: f.name }]);
  };

  const submit = (isBidding: boolean) =>
    run(
      () =>
        call("/bid", {
          method: "POST",
          body: JSON.stringify({
            requestKey: crypto.randomUUID(),
            fileIds: files.map((f) => f.id),
            bid: {
              is_bidding: isBidding,
              base_bid: isBidding ? Number(total || (lineItems.length ? lineSum : "")) : null,
              answers,
              line_item_prices: Object.fromEntries(Object.entries(lines).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)])),
              alternate_prices: Object.fromEntries(Object.entries(alts).map(([k, v]) => [k, v && v.amount !== "" ? { amount: Number(v.amount), type: v.type } : null])),
              clarifications: text.clarifications,
              exclusions: text.exclusions,
              notes: text.notes,
              lead_time_weeks: text.lead === "" ? null : Number(text.lead),
            },
          }),
        }).then(() => setFiles([])),
      isBidding ? "Your bid has been submitted." : "Your answer has been recorded.",
    );

  return (
    <>
      <div className={card}>
        <h2 className="font-semibold text-brand-navy">Tender documents</h2>
        {view.files?.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {view.files.map((f) => (
              <li key={f.id}>
                <a className="text-brand-accent hover:underline" href={`${base}/files/${f.id}`}>{f.name}</a> <span className="text-slate-400">({mb(f.size)})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500">No documents were attached.</p>
        )}
      </div>

      <div className={card}>
        <h2 className="font-semibold text-brand-navy">Will you bid?</h2>
        <p className="mt-1 text-sm text-slate-500">Your answer: {view.answer ? view.answer.replace("_", " ") : "not given yet"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["bidding", "not_bidding", "not_sure"] as const).map((a) => (
            <button key={a} className={view.answer === a ? primary : secondary} disabled={busy || !open} onClick={() => run(() => call("/answer", { method: "POST", body: JSON.stringify({ answer: a }) }), "Your answer has been recorded.")}>
              {a === "bidding" ? "Bidding" : a === "not_bidding" ? "Not bidding" : "Not sure"}
            </button>
          ))}
        </div>
      </div>

      <div className={card}>
        <h2 className="font-semibold text-brand-navy">Your bid</h2>
        {view.bid && <p className="mt-1 text-sm text-emerald-700">Revision {view.bid.revision} submitted {new Date(view.bid.submitted_at).toLocaleString("en-IN")}. You can submit a new revision until the due date.</p>}
        {(form.questions ?? []).map((q) => (
          <div key={q.id} className="mt-3 text-sm">
            <p className="text-slate-800">{q.text}{q.required ? " *" : ""}</p>
            {q.type === "text" ? (
              <textarea className={input} value={String(answers[q.id] ?? "")} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
            ) : (
              <div className="mt-1 flex gap-3">
                {[true, false].map((v) => (
                  <label key={String(v)} className="flex items-center gap-1">
                    <input type="radio" name={q.id} checked={answers[q.id] === v} onChange={() => setAnswers({ ...answers, [q.id]: v })} /> {v ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        {lineItems.length > 0 && (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1">Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="py-1 pr-2">{l.description}</td>
                  <td>{l.quantity ?? "-"}</td>
                  <td>{l.unit ?? ""}</td>
                  <td>
                    <input className="w-28 rounded border border-slate-300 px-2 py-1" inputMode="decimal" value={lines[l.id] ?? ""} onChange={(e) => setLines({ ...lines, [l.id]: e.target.value })} />
                  </td>
                  <td className="text-right">{money((Number(lines[l.id]) || 0) * (l.quantity ?? 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <label className="mt-4 block text-sm text-slate-700">
          Total price ({view.tender.currency}){lineItems.length ? ` - leave blank to use the line total ${money(lineSum)}` : ""}
          <input className={input} inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
        </label>
        {(form.alternates ?? []).map((a) => (
          <div key={a.id} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
            <span className="min-w-40 text-slate-800">{a.name}</span>
            <select className="rounded border border-slate-300 px-2 py-1" value={alts[a.id]?.type ?? "add"} onChange={(e) => setAlts({ ...alts, [a.id]: { amount: alts[a.id]?.amount ?? "", type: e.target.value as "add" | "deduct" } })}>
              <option value="add">Add</option>
              <option value="deduct">Deduct</option>
            </select>
            <input className="w-32 rounded border border-slate-300 px-2 py-1" placeholder="Amount" value={alts[a.id]?.amount ?? ""} onChange={(e) => setAlts({ ...alts, [a.id]: { amount: e.target.value, type: alts[a.id]?.type ?? "add" } })} />
          </div>
        ))}
        {(["clarifications", "exclusions", "notes"] as const).map((k) => (
          <label key={k} className="mt-3 block text-sm capitalize text-slate-700">
            {k}
            <textarea className={input} value={text[k]} onChange={(e) => setText({ ...text, [k]: e.target.value })} />
          </label>
        ))}
        <label className="mt-3 block text-sm text-slate-700">
          Lead time (weeks)
          <input className={input} inputMode="numeric" value={text.lead} onChange={(e) => setText({ ...text, lead: e.target.value.replace(/\D/g, "") })} />
        </label>
        <div className="mt-3 text-sm">
          <p className="text-slate-700">Attachments (PDF, Word, Excel, images; at most 15 MB each)</p>
          <input type="file" className="mt-1 text-sm" disabled={busy || !open} onChange={(e) => e.target.files?.[0] && run(() => upload(e.target.files![0]))} />
          {files.map((f) => <p key={f.id} className="text-slate-600">{f.name}</p>)}
          {view.bidFiles?.length ? <p className="mt-1 text-xs text-slate-500">With the submitted revision: {view.bidFiles.map((f) => f.name).join(", ")}</p> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={primary} disabled={busy || !open} onClick={() => submit(true)}>Submit bid</button>
          <button className={secondary} disabled={busy || !open} onClick={() => submit(false)}>Decline to bid</button>
        </div>
      </div>

      <div className={card}>
        <h2 className="font-semibold text-brand-navy">Messages with {view.tender.inviterCompany}</h2>
        <p className="mt-1 text-xs text-slate-500">Sent through Bidcore: neither side sees the other&apos;s e-mail address.</p>
        <ul className="mt-2 space-y-2 text-sm">
          {(view.messages ?? []).map((m) => (
            <li key={m.id} className={`rounded-md p-2 ${m.sender === "contractor" ? "bg-slate-50" : "bg-orange-50"}`}>
              <span className="text-xs text-slate-500">{m.sender === "contractor" ? "You" : view.tender.inviterCompany} · {new Date(m.created_at).toLocaleString("en-IN")}</span>
              <p className="whitespace-pre-line text-slate-800">{m.body}</p>
            </li>
          ))}
        </ul>
        <textarea className={input} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask a question about the tender" />
        <button className={`${secondary} mt-2`} disabled={busy || !msg.trim()} onClick={() => run(() => call("/messages", { method: "POST", body: JSON.stringify({ body: msg }) }).then(() => setMsg("")), "Message sent.")}>
          Send message
        </button>
      </div>

      {view.contactRequest && (
        <div className={card}>
          <h2 className="font-semibold text-brand-navy">Contact request</h2>
          {view.contactRequest.status === "pending" ? (
            <>
              <p className="mt-1 text-sm text-slate-700">
                <b>{view.contactRequest.company}</b> asks you to share your contact details. Nothing is shared unless you approve. Leave the e-mail blank to share the address this
                invitation was sent to.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input className={input} placeholder="Contact person" value={share.name} onChange={(e) => setShare({ ...share, name: e.target.value })} />
                <input className={input} placeholder="E-mail (optional)" value={share.email} onChange={(e) => setShare({ ...share, email: e.target.value })} />
                <input className={input} placeholder="Phone (optional)" value={share.phone} onChange={(e) => setShare({ ...share, phone: e.target.value })} />
              </div>
              <div className="mt-3 flex gap-2">
                <button className={primary} disabled={busy} onClick={() => run(() => call("/contact", { method: "POST", body: JSON.stringify({ decision: "approve", ...share, email: share.email || undefined }) }), "Your contact details were shared.")}>
                  Share my contact
                </button>
                <button className={secondary} disabled={busy} onClick={() => run(() => call("/contact", { method: "POST", body: JSON.stringify({ decision: "decline" }) }), "You declined. Nothing was shared.")}>
                  Decline
                </button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-700">You {view.contactRequest.status === "approved" ? "shared your contact details" : "declined to share your contact details"}.</p>
          )}
        </div>
      )}
    </>
  );
}
