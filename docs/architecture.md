# Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  FRONTEND — Next.js 14 (TypeScript), deployed on Vercel        │
│                                                                 │
│  /              The Docket — live feed of past rulings          │
│  /submit        Submit content for judgment                     │
│  /rulebook      Propose, support, and finalize rules             │
│  /ruling/[id]   Verdict, cited rules, reasoning, appeal          │
│                                                                 │
│  Reads/writes go through genlayer-js directly from the browser. │
│  A burner wallet (generated client-side, key kept in             │
│  localStorage) signs transactions with zero setup friction.     │
└───────────────────────────────┬───────────────────────────────┘
                                 │ genlayer-js (viem-based JSON-RPC)
                                 ▼
┌───────────────────────────────────────────────────────────────┐
│  GENLAYER STUDIONET — chain ID 61999                            │
│  https://studio.genlayer.com/api                                │
│                                                                 │
│  Intelligent Contract: contracts/rule_of_law.py                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Rulebook state                                           │  │
│  │  rules, rule_status, rule_votes_for                      │  │
│  │  propose_rule → vote_rule → finalize_rule                │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ Moderation                                               │  │
│  │  submit_content(content)                                 │  │
│  │   → gl.nondet.exec_prompt(prompt) inside each validator  │  │
│  │   → gl.eq_principle.prompt_comparative reaches consensus │  │
│  │     on verdict + cited_rule_ids without requiring         │  │
│  │     word-for-word identical reasoning                    │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ Appeals                                                  │  │
│  │  appeal(ruling_id, reason) — re-runs judgment with the    │  │
│  │  original ruling + appeal reason as additional context   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ Precedent log                                            │  │
│  │  rulings — append-only, publicly readable                │  │
│  │  get_ruling / get_rulings_page / get_rulings_count        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Validators run GenLayer-hosted LLM backends — no API key ever  │
│  touches this codebase.                                         │
└───────────────────────────────────────────────────────────────┘
```

## Why Optimistic Democracy fits content moderation

Traditional moderation is a black box: a single model (or a single human)
decides, and the reasoning is rarely made public. GenLayer's validators
each independently read the same public rulebook and produce a verdict;
`prompt_comparative` equivalence only requires them to agree on the
**verdict category and cited rules**, not identical wording — which is
the right bar for a subjective judgment task like this one. If validators
can't converge, that itself is a signal the content is a genuinely hard
case, which is exactly when `Uncertain` should be surfaced instead of a
false-confidence ruling.

## Known limitations (MVP scope)

- `vote_rule` does not yet prevent an address from voting on the same
  rule twice. A production version would key votes by `(rule_id, address)`.
- Voting has no time window — finalization is a manual step, triggered
  once whoever is coordinating rule changes decides support is sufficient.
- Content is text-only. URL/image moderation was scoped out to keep the
  non-deterministic surface area small for the hackathon build window.
- The burner wallet trades security for zero-friction demoing. Swap for
  a real wallet connection before this handles anything of value.
