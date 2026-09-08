import Link from "next/link";
import type { Ruling } from "@/lib/types";
import { VerdictBadge } from "./VerdictBadge";

const ACCENT: Record<Ruling["verdict"], string> = {
  Allowed: "border-l-verdict-allowed",
  Violation: "border-l-verdict-violation",
  Uncertain: "border-l-verdict-uncertain",
};

function excerpt(text: string, max = 160) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function RulingCard({ ruling }: { ruling: Ruling }) {
  return (
    <Link
      href={`/ruling/${ruling.id}`}
      className={`panel block border-l-[3px] ${ACCENT[ruling.verdict]} p-5 no-underline hover:bg-parchment/40 transition-colors`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-xs text-ink-faint">
          {ruling.type === "appeal" ? "APPEAL" : "CASE"} №{" "}
          {String(ruling.id).padStart(4, "0")}
        </span>
        <VerdictBadge verdict={ruling.verdict} />
      </div>

      <p className="mt-3 font-sans text-[15px] leading-relaxed text-ink">
        {excerpt(ruling.content)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 font-sans text-xs text-ink-muted">
        {ruling.cited_rule_ids.length > 0 ? (
          ruling.cited_rule_ids.map((rid) => (
            <span key={rid} className="rounded-sm border border-hairline px-2 py-0.5 font-mono">
              Rule {rid}
            </span>
          ))
        ) : (
          <span className="italic text-ink-faint">No rule cited</span>
        )}
        <span className="ml-auto font-mono">
          {Math.round(ruling.confidence * 100)}% confidence
        </span>
      </div>
    </Link>
  );
}
