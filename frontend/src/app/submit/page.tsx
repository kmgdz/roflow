"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readRuleOfLaw, writeRuleOfLaw } from "@/lib/genlayerClient";
import { getActiveAccount } from "@/lib/wallet";

type Stage = "idle" | "pending" | "error";

export default function SubmitPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setStage("pending");
    setError(null);

    try {
      const account = getActiveAccount();
      await writeRuleOfLaw(account, "submit_content", [content]);
      // The write finalized; the new ruling is the last one in the log.
      const count = await readRuleOfLaw<bigint>("get_rulings_count", []);
      router.push(`/ruling/${Number(count) - 1}`);
    } catch (err) {
      setStage("error");
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl leading-[1.1]">Submit content for a ruling</h1>
      <p className="mt-4 text-ink-muted leading-relaxed">
        Validators will judge this against the currently active rulebook and
        return a verdict with the exact rule(s) cited. This takes a short
        moment while consensus is reached — don&apos;t close the tab.
      </p>

      <form onSubmit={handleSubmit} className="mt-10">
        <label className="field-label" htmlFor="content">
          Content to review
        </label>
        <textarea
          id="content"
          className="field-input h-48 resize-none"
          placeholder="Paste the text you want judged against the rulebook…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={stage === "pending"}
        />

        <button
          type="submit"
          className="btn-primary mt-6"
          disabled={stage === "pending" || !content.trim()}
        >
          {stage === "pending" ? "Validators are deliberating…" : "Submit for ruling"}
        </button>

        {stage === "error" && (
          <p className="mt-4 font-sans text-sm text-verdict-violation">
            Something went wrong: {error}
          </p>
        )}
      </form>
    </div>
  );
}
