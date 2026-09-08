"use client";

import { useEffect, useState } from "react";
import { readRuleOfLaw, writeRuleOfLaw } from "@/lib/genlayerClient";
import { getActiveAccount } from "@/lib/wallet";
import type { Rule } from "@/lib/types";

const STATUS_STYLE: Record<Rule["status"], string> = {
  active: "text-verdict-allowed",
  proposed: "text-verdict-uncertain",
  retired: "text-ink-faint line-through",
};

export default function RulebookPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const raw = await readRuleOfLaw<string>("get_all_rules", []);
    const parsed = JSON.parse(raw) as Record<string, { text: string; status: Rule["status"]; votes: number }>;
    const list: Rule[] = Object.entries(parsed).map(([id, v]) => ({
      id: Number(id),
      ...v,
    }));
    list.sort((a, b) => b.id - a.id);
    setRules(list);
  }

  useEffect(() => {
    refresh().catch((err) => setError((err as Error).message));
  }, []);

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    if (!proposalText.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const account = getActiveAccount();
      await writeRuleOfLaw(account, "propose_rule", [proposalText]);
      setProposalText("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVote(ruleId: number) {
    setBusy(true);
    setError(null);
    try {
      const account = getActiveAccount();
      await writeRuleOfLaw(account, "vote_rule", [BigInt(ruleId)]);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFinalize(ruleId: number) {
    setBusy(true);
    setError(null);
    try {
      const account = getActiveAccount();
      await writeRuleOfLaw(account, "finalize_rule", [BigInt(ruleId), BigInt(1)]);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl leading-[1.1]">The Rulebook</h1>
      <p className="mt-4 text-ink-muted leading-relaxed max-w-prose">
        This is the only authority validators are allowed to cite when
        judging content. Anyone can propose a rule; support from other
        addresses activates it.
      </p>

      {error && (
        <p className="mt-6 font-sans text-sm text-verdict-violation">{error}</p>
      )}

      <div className="mt-10 space-y-3">
        {rules === null && (
          <p className="font-sans text-sm text-ink-faint">Loading rulebook…</p>
        )}

        {rules?.map((rule) => (
          <div key={rule.id} className="panel p-5 flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-xs text-ink-faint">
                Rule {String(rule.id).padStart(3, "0")}
              </span>
              <p className="mt-1 font-sans text-[15px] text-ink leading-relaxed">
                {rule.text}
              </p>
              <p className={`mt-2 font-sans text-xs ${STATUS_STYLE[rule.status]}`}>
                {rule.status} · {rule.votes} vote{rule.votes === 1 ? "" : "s"}
              </p>
            </div>

            {rule.status === "proposed" && (
              <div className="flex flex-col gap-2 shrink-0">
                <button className="btn-secondary" disabled={busy} onClick={() => handleVote(rule.id)}>
                  Support
                </button>
                <button className="btn-secondary" disabled={busy} onClick={() => handleFinalize(rule.id)}>
                  Finalize
                </button>
              </div>
            )}
          </div>
        ))}

        {rules?.length === 0 && (
          <div className="panel p-8 text-center">
            <p className="font-sans text-sm text-ink-muted">
              No rules yet. Propose the first one below.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handlePropose} className="mt-14 border-t border-hairline pt-10">
        <h2 className="text-2xl">Propose a rule</h2>
        <label className="field-label mt-6" htmlFor="rule-text">
          Rule text
        </label>
        <textarea
          id="rule-text"
          className="field-input h-28 resize-none"
          placeholder="e.g. Content may not target an individual with credible threats of violence."
          value={proposalText}
          onChange={(e) => setProposalText(e.target.value)}
          disabled={busy}
        />
        <button type="submit" className="btn-primary mt-4" disabled={busy || !proposalText.trim()}>
          Propose rule
        </button>
      </form>
    </div>
  );
}
