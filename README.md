# Rule of Law

**A public, versioned rulebook enforced by AI validators reaching on-chain consensus.**

Built for the GenLayer Agent Tank hackathon — Onchain Justice track.

Most content moderation is a black box: a model decides, and nobody sees
why. Rule of Law makes the rulebook itself public and community-amendable,
and forces every verdict to cite the exact rule it applied. Disagree with
a ruling? Appeal it, and independent validators re-review with your
reasoning as evidence. Every decision — original or appeal — stays on the
public record forever, building real precedent over time.

---

## How it works

1. **Anyone proposes a rule.** Anyone else can support it; once it clears
   the bar, it's finalized and becomes part of the active rulebook.
2. **Anyone submits content for judgment.** GenLayer validators
   independently read the *current* active rulebook — nothing else — and
   return a structured verdict: `Allowed`, `Violation`, or `Uncertain`,
   with the exact rule(s) cited, a confidence score, and a short
   reasoning.
3. **Consensus doesn't require identical wording.** Validators only need
   to agree on the verdict category and cited rules, via GenLayer's
   `prompt_comparative` equivalence principle — the right bar for a
   subjective judgment task.
4. **Anyone can appeal a ruling.** The appeal is re-judged with the
   original ruling and the appellant's reasoning as context, and the
   outcome (`Upheld` / `Overturned`) is recorded next to the original.
5. **Every ruling is public, forever.** The docket is an append-only log
   anyone can browse — real, citeable precedent, not a disappearing
   moderation queue.

## Why this needs GenLayer

A single LLM call can moderate content — but it can't be trusted the way
a *consensus of independently reasoning validators, bound to a public
rulebook they must cite*, can be. That's specifically what GenLayer's
Optimistic Democracy and Intelligent Contracts make possible: subjective,
evidence-based judgment, settled trustlessly on-chain, with a built-in
appeals path when validators (or humans) disagree.

## Tech stack

| Layer | Choice |
|---|---|
| Intelligent Contract | Python on GenLayer Studio / Studionet |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Chain client | [`genlayer-js`](https://github.com/genlayerlabs/genlayer-js) |
| Hosting | Vercel (frontend) · GenLayer Studionet (contract) |

No paid APIs anywhere — validator LLM calls run entirely on GenLayer's
hosted Studionet infrastructure.

## Project structure

```
rule-of-law/
├── contracts/
│   └── rule_of_law.py       # the Intelligent Contract
├── docs/
│   └── architecture.md
└── frontend/
    ├── src/
    │   ├── app/              # pages: docket, submit, rulebook, ruling detail
    │   ├── components/       # Logo, Header, Footer, RulingCard, VerdictBadge
    │   └── lib/               # genlayer-js client, burner wallet, types
    └── public/
```

## Running locally

**1. Deploy the contract**

Open [GenLayer Studio](https://studio.genlayer.com), paste in
`contracts/rule_of_law.py`, and deploy to Studionet. Copy the deployed
address.

**2. Run the frontend**

```bash
cd frontend
cp .env.example .env.local
# paste your deployed contract address into .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

**3. Deploy the frontend**

Push this repo to GitHub, import it into Vercel, set the project's root
directory to `frontend/`, add `NEXT_PUBLIC_CONTRACT_ADDRESS` as an
environment variable, and deploy.

## Design

The identity pairs two ideas the project fuses — a **balance** (the
scale of justice) and a **three-node consensus graph** — into a single
mark. The palette (ink navy, parchment, muted gold) and type system
(Fraunces for headlines, Public Sans — the U.S. government's own civic
type system — for interface text, JetBrains Mono for rule IDs and
addresses) are chosen to feel like a public record rather than a SaaS
product.

## Known limitations

See [`docs/architecture.md`](docs/architecture.md#known-limitations-mvp-scope)
for what's deliberately out of scope for the hackathon build window
(vote deduplication, timed voting windows, non-text content).

## License

MIT — see [`LICENSE`](LICENSE).
