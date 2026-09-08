"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readRuleOfLaw } from "@/lib/genlayerClient";
import { RulingCard } from "@/components/RulingCard";
import type { Ruling } from "@/lib/types";

const PAGE_SIZE = 20;

export default function DocketPage() {
  const [rulings, setRulings] = useState<Ruling[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await readRuleOfLaw<string>("get_rulings_page", [BigInt(0), BigInt(PAGE_SIZE)]);
        const parsed: Ruling[] = JSON.parse(raw).map((r: string) => JSON.parse(r));
        if (!cancelled) setRulings(parsed);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="max-w-prose">
        <h1 className="text-4xl md:text-5xl leading-[1.1]">The Docket</h1>
        <p className="mt-4 text-ink-muted text-lg leading-relaxed">
          Every ruling below was reached by independent GenLayer validators
          reading the same public rulebook. Each one cites the exact rule
          applied — nothing is decided off the record.
        </p>
        <Link href="/submit" className="btn-primary mt-8 no-underline">
          Submit content for a ruling
        </Link>
      </div>

      <div className="mt-16 space-y-3">
        {error && (
          <div className="panel border-l-[3px] border-l-verdict-violation p-5">
            <p className="font-sans text-sm text-ink">
              Couldn&apos;t reach the contract: {error}
            </p>
            <p className="mt-1 font-sans text-xs text-ink-faint">
              Check that NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local matches a
              contract deployed on Studionet.
            </p>
          </div>
        )}

        {!error && rulings === null && (
          <p className="font-sans text-sm text-ink-faint">Loading the docket…</p>
        )}

        {rulings !== null && rulings.length === 0 && (
          <div className="panel p-8 text-center">
            <p className="font-sans text-sm text-ink-muted">
              No rulings yet. Be the first to submit something for judgment.
            </p>
          </div>
        )}

        {rulings?.map((ruling) => (
          <RulingCard key={`${ruling.type}-${ruling.id}`} ruling={ruling} />
        ))}
      </div>
    </div>
  );
}
