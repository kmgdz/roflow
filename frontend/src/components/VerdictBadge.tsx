import type { Verdict } from "@/lib/types";

const STYLES: Record<Verdict, string> = {
  Allowed: "bg-verdict-allowed-bg text-verdict-allowed",
  Violation: "bg-verdict-violation-bg text-verdict-violation",
  Uncertain: "bg-verdict-uncertain-bg text-verdict-uncertain",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 font-sans text-xs font-medium ${STYLES[verdict]}`}
    >
      {verdict}
    </span>
  );
}
