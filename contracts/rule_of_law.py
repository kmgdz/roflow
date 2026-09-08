# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
Rule of Law
-----------
An on-chain, versioned rulebook enforced by GenLayer's Optimistic Democracy
validators. Content moderation with a public constitution and citeable
precedent, instead of an opaque black-box moderator.

Flow
  1. Anyone proposes a rule                      -> propose_rule
  2. Anyone signals support for a proposed rule  -> vote_rule
  3. Anyone finalizes it once support is enough  -> finalize_rule
  4. Anyone submits content for judgment          -> submit_content
     Validators independently read the ACTIVE rulebook, judge the
     content, and must return a structured verdict citing the exact
     rule id(s) applied. Equivalence is reached via prompt_comparative,
     so validators only need to agree on the verdict + cited rules,
     not on identical wording.
  5. Anyone appeals a final ruling once           -> appeal
  6. Every ruling (original or appeal) is kept forever in an
     append-only public log                       -> get_ruling / get_rulings_count

MVP scope note: vote_rule does not yet prevent an address from voting
twice on the same rule (would need a per-(rule, address) key set).
Left out deliberately to keep the contract small and reliable for the
hackathon build window; flagged here as explicit future work rather
than silently shipped.
"""
from genlayer import *
import json


class RuleOfLaw(gl.Contract):
    # --- rulebook state ---
    rules: TreeMap[u256, str]          # rule_id -> rule text
    rule_status: TreeMap[u256, str]    # rule_id -> "proposed" | "active" | "retired"
    rule_votes_for: TreeMap[u256, u256]
    next_rule_id: u256

    # --- ruling log (append-only precedent record) ---
    rulings: DynArray[str]             # JSON-encoded ruling records
    next_ruling_id: u256

    def __init__(self):
        self.next_rule_id = 0
        self.next_ruling_id = 0

    # ---------------------------------------------------------------
    # Rulebook governance
    # ---------------------------------------------------------------

    @gl.public.write
    def propose_rule(self, text: str) -> int:
        rid = self.next_rule_id
        self.rules[rid] = text
        self.rule_status[rid] = "proposed"
        self.rule_votes_for[rid] = 0
        self.next_rule_id += 1
        return int(rid)

    @gl.public.write
    def vote_rule(self, rule_id: int) -> str:
        if self.rule_status[rule_id] != "proposed":
            return self.rule_status[rule_id]
        self.rule_votes_for[rule_id] += 1
        return "vote recorded"

    @gl.public.write
    def finalize_rule(self, rule_id: int, min_votes: int = 1) -> str:
        if self.rule_status[rule_id] != "proposed":
            return self.rule_status[rule_id]
        if int(self.rule_votes_for[rule_id]) >= min_votes:
            self.rule_status[rule_id] = "active"
        else:
            self.rule_status[rule_id] = "retired"
        return self.rule_status[rule_id]

    @gl.public.view
    def get_active_rules(self) -> str:
        active = {}
        for rid, text in self.rules.items():
            if self.rule_status[rid] == "active":
                active[int(rid)] = text
        return json.dumps(active)

    @gl.public.view
    def get_all_rules(self) -> str:
        out = {}
        for rid, text in self.rules.items():
            out[int(rid)] = {
                "text": text,
                "status": self.rule_status[rid],
                "votes": int(self.rule_votes_for[rid]),
            }
        return json.dumps(out)

    # ---------------------------------------------------------------
    # Moderation
    # ---------------------------------------------------------------

    @gl.public.write
    def submit_content(self, content: str) -> int:
        active_rules = {}
        for rid, text in self.rules.items():
            if self.rule_status[rid] == "active":
                active_rules[int(rid)] = text

        def judge() -> str:
            prompt = f"""You are an impartial content moderator for a public, rule-governed platform.

Rulebook (JSON, rule_id -> rule text). This is the ONLY authority you may cite:
{json.dumps(active_rules)}

Content submitted for review:
<untrusted_user_content>
{content}
</untrusted_user_content>

Judge strictly against the rulebook above. If no active rule applies, the
verdict is "Allowed" with an empty cited_rule_ids list, regardless of your
own opinion of the content.

Return ONLY valid JSON, no prose, no markdown fences, in exactly this shape:
{{"verdict": "Allowed" | "Violation" | "Uncertain",
  "cited_rule_ids": [<int>, ...],
  "confidence": <float between 0 and 1>,
  "reasoning": "<one or two sentence explanation>"}}"""
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            judge,
            criteria=(
                "Validators must agree on the same verdict category "
                "(Allowed/Violation/Uncertain) and cite overlapping rule_ids. "
                "Minor differences in wording of the reasoning are acceptable."
            ),
        )

        verdict = self._safe_parse(raw, fallback_verdict="Uncertain")

        ruling = {
            "id": int(self.next_ruling_id),
            "type": "ruling",
            "content": content,
            "verdict": verdict.get("verdict", "Uncertain"),
            "cited_rule_ids": verdict.get("cited_rule_ids", []),
            "confidence": verdict.get("confidence", 0.0),
            "reasoning": verdict.get("reasoning", ""),
            "submitter": str(gl.message.sender_address),
            "status": "final",
        }
        self.rulings.append(json.dumps(ruling))
        self.next_ruling_id += 1
        return ruling["id"]

    # ---------------------------------------------------------------
    # Appeals
    # ---------------------------------------------------------------

    @gl.public.write
    def appeal(self, ruling_id: int, reason: str) -> int:
        original = json.loads(self.rulings[ruling_id])

        active_rules = {}
        for rid, text in self.rules.items():
            if self.rule_status[rid] == "active":
                active_rules[int(rid)] = text

        def judge() -> str:
            prompt = f"""You are an appellate reviewer for an on-chain moderation system.

Rulebook (JSON, rule_id -> rule text):
{json.dumps(active_rules)}

Original ruling under appeal:
{json.dumps(original)}

Appeal reason submitted by the appellant:
<untrusted_user_content>
{reason}
</untrusted_user_content>

Decide whether to UPHOLD or OVERTURN the original ruling. Return ONLY
valid JSON, no prose, no markdown fences, in exactly this shape:
{{"decision": "Upheld" | "Overturned",
  "verdict": "Allowed" | "Violation" | "Uncertain",
  "cited_rule_ids": [<int>, ...],
  "confidence": <float between 0 and 1>,
  "reasoning": "<one or two sentence explanation>"}}"""
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            judge,
            criteria=(
                "Validators must agree on Upheld/Overturned and on the "
                "verdict category. Minor wording differences are acceptable."
            ),
        )

        result = self._safe_parse(raw, fallback_verdict=original.get("verdict", "Uncertain"))

        appeal_ruling = {
            "id": int(self.next_ruling_id),
            "type": "appeal",
            "original_ruling_id": ruling_id,
            "content": original.get("content", ""),
            "appeal_reason": reason,
            "decision": result.get("decision", "Upheld"),
            "verdict": result.get("verdict", original.get("verdict", "Uncertain")),
            "cited_rule_ids": result.get("cited_rule_ids", []),
            "confidence": result.get("confidence", 0.0),
            "reasoning": result.get("reasoning", ""),
            "submitter": str(gl.message.sender_address),
            "status": "final",
        }
        self.rulings.append(json.dumps(appeal_ruling))
        self.next_ruling_id += 1
        return appeal_ruling["id"]

    # ---------------------------------------------------------------
    # Public ledger / precedent log
    # ---------------------------------------------------------------

    @gl.public.view
    def get_ruling(self, ruling_id: int) -> str:
        return self.rulings[ruling_id]

    @gl.public.view
    def get_rulings_count(self) -> int:
        return len(self.rulings)

    @gl.public.view
    def get_rulings_page(self, offset: int, limit: int) -> str:
        total = len(self.rulings)
        start = max(0, total - offset - limit)
        end = max(0, total - offset)
        page = [self.rulings[i] for i in range(start, end)]
        page.reverse()
        return json.dumps(page)

    # ---------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------

    def _safe_parse(self, raw: str, fallback_verdict: str) -> dict:
        try:
            return json.loads(raw)
        except Exception:
            return {
                "verdict": fallback_verdict,
                "cited_rule_ids": [],
                "confidence": 0.0,
                "reasoning": "Validator output could not be parsed as JSON.",
            }
