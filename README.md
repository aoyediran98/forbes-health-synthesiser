# Research-to-hypothesis synthesiser: Forbes Health

Live: _added after deploy_

Turns messy qualitative research (reviews, support-ticket themes, survey verbatims, session-recording notes) into problem statements ranked by frequency and severity, each mapped to a testable hypothesis with a primary metric, a guardrail metric and an ICE score.

It is a prioritisation accelerator that feeds a rigorous test programme. It does not replace one.

## How to use it

1. Paste verbatims into the box, one per line, or add a `.txt` / `.csv` file. A source tag at the start of each line helps, for example `[trustpilot 2★ 2026-05]`.
2. Or press **Load sample: Forbes Health reviews**.
3. Press **Synthesise**. A full sample takes about a minute.
4. Press **Copy as Markdown** to paste the ranked table into a doc or deck.

## The method

1. **Normalise.** Split inputs into individual verbatims, tag source, rating and date, drop duplicates.
2. **Cluster** into 5–10 problem statements of the form _"[Who] struggles to [do what] because [root cause], which leads to [consequence]."_ Clusters follow the job-to-be-done that is failing, not the surface topic.
3. **Score.** Frequency (1–5) is the share of verbatims in the cluster: under 5%, 5–10%, 10–20%, 20–35%, over 35%. Severity (1–5): 5 blocks purchase or activation, 4 damages trust, 3 causes friction, 2 annoys, 1 cosmetic. Priority = Frequency × Severity.
4. **Hypothesis** per cluster: _"We believe that [change] for [segment] will [outcome] because [evidence]. We'll know this is true when [primary metric] moves by at least [minimum detectable effect] with [guardrail metric] unchanged."_
5. **ICE** (Impact, Confidence, Ease, each 1–10) plus the persuasion or UX principle the hypothesis leans on.
6. **Output.** Ranked clusters, two or three representative verbatims each, and a paragraph on what to test first. Clusters with fewer than three verbatims are marked low-confidence.

## About the sample data

`src/data/forbes-health.txt` is **synthetic**. Every line is tagged `[synthetic]`. Forbes Health has no public review listing of its own, so the sample was written for this demo. Its themes follow the complaints and praise that appear in public reviews of Forbes and its rankings (paid placement, partner billing, lead-form follow-up calls, content accuracy), but none of the lines is a real customer quote. Replace it with real verbatims before drawing conclusions.

## Run locally

```bash
npm install
cp .env.example .env.local   # then add your Anthropic API key
npm run dev
```

Open http://localhost:3000.

## How it is built

- Next.js (App Router) and Tailwind, deployed on Vercel.
- `src/app/api/synthesise/route.ts` takes `{ inputs, company }` and calls the Claude Messages API (`claude-sonnet-5-5`) with the method as the system prompt and a JSON schema for the response.
- `src/lib/method.ts` holds the method and the response schema.
- `src/data/companies.ts` lists the sample datasets; each has a `<slug>.txt` beside it.

To add another company, add `src/data/<slug>.txt` and an entry in `src/data/companies.ts`.
