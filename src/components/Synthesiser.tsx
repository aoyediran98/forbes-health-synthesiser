"use client";

import { useRef, useState } from "react";
import type { Cluster, Synthesis } from "@/lib/method";

type Sample = { slug: string; name: string; text: string };

const iceTotal = (c: Cluster) => c.ice.impact + c.ice.confidence + c.ice.ease;

function toMarkdown(company: string, result: Synthesis) {
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [
    `# ${company}: research-to-hypothesis synthesis`,
    "",
    "| # | Problem | Freq | Sev | Priority | Hypothesis | Primary metric | ICE |",
    "|---|---|---|---|---|---|---|---|",
    ...result.clusters.map(
      (c, i) =>
        `| ${i + 1} | ${cell(c.problem)}${c.lowConfidence ? " _(low confidence)_" : ""} | ${c.frequency} | ${c.severity} | ${c.priority} | ${cell(c.hypothesis)} | ${cell(c.primaryMetric)} | ${iceTotal(c)} |`,
    ),
    "",
    "## Evidence",
    "",
    ...result.clusters.flatMap((c, i) => [
      `### ${i + 1}. ${c.problem}`,
      "",
      `Guardrail: ${c.guardrailMetric} · Principle: ${c.principle} · ICE: I${c.ice.impact} / C${c.ice.confidence} / E${c.ice.ease}`,
      "",
      ...c.verbatims.map((v) => `> ${v}`),
      "",
    ]),
    "## What to test first",
    "",
    result.firstTest,
    "",
  ];
  return lines.join("\n");
}

function Score({ label, value, max }: { label: string; value: number; max?: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">
        {value}
        {max ? <span className="text-sm font-normal text-muted">/{max}</span> : null}
      </dd>
    </div>
  );
}

export default function Synthesiser({
  samples,
  initialSlug,
}: {
  samples: Sample[];
  initialSlug?: string;
}) {
  const [slug, setSlug] = useState(initialSlug ?? samples[0]?.slug);
  const active = samples.find((s) => s.slug === slug) ?? samples[0];
  const company = active?.name ?? "Research";
  const [inputs, setInputs] = useState("");
  const [result, setResult] = useState<Synthesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function switchCompany(next: string) {
    setSlug(next);
    setInputs("");
    setResult(null);
    setError(null);
    window.history.replaceState(null, "", `/${next}`);
  }

  const append = (text: string) =>
    setInputs((current) => (current.trim() ? `${current.trimEnd()}\n${text}` : text));

  async function onFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      append((await file.text()).trim());
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function synthesise() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/synthesise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputs, company }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.clusters) {
        throw new Error(
          data?.error ?? "The synthesis took too long or failed. Try again with fewer inputs.",
        );
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyMarkdown() {
    if (!result) return;
    await navigator.clipboard.writeText(toMarkdown(company, result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lineCount = inputs.split("\n").filter((l) => l.trim()).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-sm font-medium text-accent">Research-to-hypothesis synthesiser</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{company}</h1>
        {samples.length > 1 && (
          <nav aria-label="Company" className="mt-4 flex flex-wrap gap-2">
            {samples.map((sample) => (
              <button
                key={sample.slug}
                type="button"
                aria-pressed={sample.slug === active.slug}
                onClick={() => switchCompany(sample.slug)}
                className={
                  sample.slug === active.slug
                    ? "rounded-full border border-accent bg-accent px-3 py-1 text-sm font-medium text-white"
                    : "rounded-full border border-line px-3 py-1 text-sm font-medium hover:border-accent hover:text-accent"
                }
              >
                {sample.name}
              </button>
            ))}
          </nav>
        )}
        <p className="mt-3 max-w-2xl text-muted">
          Paste reviews, support-ticket themes, survey verbatims or session notes. Get problem
          statements ranked by frequency and severity, each with a testable hypothesis, a primary
          and guardrail metric, and an ICE score.
        </p>
      </header>

      <section aria-label="Research inputs">
        <label htmlFor="inputs" className="mb-2 block text-sm font-medium">
          Research inputs <span className="font-normal text-muted">(one verbatim per line)</span>
        </label>
        <textarea
          id="inputs"
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
          rows={12}
          placeholder="[trustpilot 2★ 2026-05] Checkout kept failing on mobile…"
          className="w-full rounded-lg border border-line bg-surface p-3 font-mono text-sm leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={() => setInputs(active.text)}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent"
            >
              Load sample: {active.name} reviews
            </button>
          )}
          <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent">
            Add .txt or .csv
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              multiple
              className="sr-only"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
          <span className="text-sm text-muted">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
          <button
            type="button"
            onClick={synthesise}
            disabled={loading || !inputs.trim()}
            className="ml-auto rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Synthesising…" : "Synthesise"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          The bundled samples are synthetic: illustrative verbatims written for this demo, not real
          customer reviews.
        </p>
      </section>

      <div aria-live="polite" className="mt-8">
        {loading && (
          <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
            Clustering verbatims and writing hypotheses. This usually takes about a minute.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-accent bg-surface p-4 text-sm">
            {error}
          </p>
        )}
      </div>

      {result && (
        <section aria-label="Results" className="mt-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {result.clusters.length} problems, ranked by priority
            </h2>
            <button
              type="button"
              onClick={copyMarkdown}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent"
            >
              {copied ? "Copied" : "Copy as Markdown"}
            </button>
          </div>

          <div className="mb-6 rounded-lg border border-accent bg-surface p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">
              What to test first
            </h3>
            <p className="mt-2 leading-relaxed">{result.firstTest}</p>
          </div>

          <ol className="space-y-4">
            {result.clusters.map((c, i) => (
              <li key={i} className="rounded-lg border border-line bg-surface p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold leading-snug">
                    {c.problem}
                    {c.lowConfidence && (
                      <span className="ml-2 whitespace-nowrap rounded border border-line px-1.5 py-0.5 align-middle text-xs font-normal text-muted">
                        Low confidence
                      </span>
                    )}
                  </h3>
                </div>

                <dl className="mt-4 grid grid-cols-4 gap-3 border-y border-line py-3">
                  <Score label="Priority" value={c.priority} max={25} />
                  <Score label="Frequency" value={c.frequency} max={5} />
                  <Score label="Severity" value={c.severity} max={5} />
                  <Score label="ICE" value={iceTotal(c)} max={30} />
                </dl>

                <p className="mt-4 leading-relaxed">{c.hypothesis}</p>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Primary metric</dt>
                    <dd>{c.primaryMetric}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Guardrail metric</dt>
                    <dd>{c.guardrailMetric}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">Principle</dt>
                    <dd>{c.principle}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted">ICE breakdown</dt>
                    <dd className="tabular-nums">
                      Impact {c.ice.impact} · Confidence {c.ice.confidence} · Ease {c.ice.ease}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-4 space-y-2">
                  {c.verbatims.map((v, j) => (
                    <li key={j} className="border-l-2 border-accent pl-3 text-sm text-muted">
                      {v}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
