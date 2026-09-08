export type Verdict = "Allowed" | "Violation" | "Uncertain";

export interface Ruling {
  id: number;
  type: "ruling" | "appeal";
  content: string;
  verdict: Verdict;
  cited_rule_ids: number[];
  confidence: number;
  reasoning: string;
  submitter: string;
  status: string;
  // Appeal-only fields
  original_ruling_id?: number;
  appeal_reason?: string;
  decision?: "Upheld" | "Overturned";
}

export interface Rule {
  id: number;
  text: string;
  status: "proposed" | "active" | "retired";
  votes: number;
}
