"use client";

import { useEffect, useState } from "react";
import { readRuleOfLaw, writeRuleOfLaw } from "@/lib/genlayerClient";
import { getActiveAccount } from "@/lib/wallet";
import { VerdictBadge } from "@/components/VerdictBadge";
import type { Ruling } from "@/lib/types";

export default function RulingDetailPage({ params }: { params: { id: string } }) {
  const rulingId = Number(params.id);
  const [ruling, setRuling] = useState<Ruling | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [appealResult, setAppealResult] = useState<Ruling | null>(null);

  async function load() {
    try {
      const raw = await readRuleOfLaw<string>("get_ruling", [BigInt(rulingId)]);
      setRuling(JSON.parse(raw));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rulingId]);

  async function handleAppeal(e: React.FormEvent) {
    e.preventDefault();
    if (!appealReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const account = getActiveAccount();
      await writeRuleOfLaw(account, "appeal", [BigInt(rulingId), appealReason]);
      // The write finalized; the new appeal ruling is the last one in the log.
      const count = await readRuleOfLaw<bigint>("get_rulings_count", []);
      const raw = await readRuleOfLaw<string>("get_ruling", [count - BigInt(1)]);
      setAppealResult(JSON.parse(raw));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-sans text-sm text-verdict-violation">{error}</p>
      </div>
    );
  }

  if (!ruling) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-sans text-sm text-ink-faint">Loading ruling…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <span className="font-mono text-xs text-ink-faint">
        {ruling.type === "appeal" ? "APPEAL" : "CASE"} №{" "}
        {String(ruling.id).padStart(4, "0")}
      </span>

      <div className="mt-4 flex items-center gap-3">
        <VerdictBadge verdict={ruling.verdict} />
        <span className="font-mono text-sm text-ink-muted">
          {Math.round(ruling.confidence * 100)}% confidence
        </span>
      </div>

      <h1 className="mt-6 text-3xl leading-snug">Content under review</h1>
      <div className="panel mt-4 p-5">
        <p className="font-sans text-[15px] text-ink leading-relaxed whitespace-pre-wrap">
          {ruling.content}
        </p>
      </div>

      <h2 className="mt-10 text-xl">Cited rules</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {ruling.cited_rule_ids.length > 0 ? (
          ruling.cited_rule_ids.map((rid) => (
            <span key={rid} className="rounded-sm border border-hairline px-2.5 py-1 font-mono text-xs">
              Rule {rid}
            </span>
          ))
        ) : (
          <span className="italic text-sm text-ink-faint">No rule cited</span>
        )}
      </div>

      <h2 className="mt-10 text-xl">Reasoning</h2>
      <p className="mt-3 font-sans text-[15px] text-ink-muted leading-relaxed">
        {ruling.reasoning}
      </p>

      {ruling.type === "ruling" && !appealResult && (
        <form onSubmit={handleAppeal} className="mt-14 border-t border-hairline pt-10">
          <h2 className="text-2xl">Appeal this ruling</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Validators will re-review with your reason as additional context.
          </p>
          <textarea
            className="field-input mt-5 h-28 resize-none"
            placeholder="Why should this ruling be reconsidered?"
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="btn-secondary mt-4" disabled={busy || !appealReason.trim()}>
            {busy ? "Validators are re-reviewing…" : "Submit appeal"}
          </button>
        </form>
      )}

      {appealResult && (
        <div className="mt-14 border-t border-hairline pt-10">
          <h2 className="text-2xl">Appeal decision</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-sans text-sm font-medium text-ink">
              {appealResult.decision}
            </span>
            <VerdictBadge verdict={appealResult.verdict} />
          </div>
          <p className="mt-4 font-sans text-[15px] text-ink-muted leading-relaxed">
            {appealResult.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
