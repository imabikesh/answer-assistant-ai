import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { type DemoSet, pickDemoSet } from "@/lib/demo-data";
import {
  type BookletOptions,
  DEPTHS,
  DEPTH_LABEL,
  type Depth,
  type Format,
  estimatePages,
  solutionText,
} from "@/lib/booklet";
import { downloadDocx, downloadPdf } from "@/lib/export-booklet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vellum · Turn question papers into solved study booklets" },
      {
        name: "description",
        content:
          "Upload a PDF of questions and get a structured booklet with worked solutions, hints and an answer key — downloadable as PDF or DOCX.",
      },
      { property: "og:title", content: "Vellum · Study Compiler" },
      {
        property: "og:description",
        content:
          "Upload a question paper, customise the output, download a solved study booklet as PDF or DOCX.",
      },
    ],
  }),
  component: StudioPage,
});

type Source = { name: string; sizeMb: string; pages: number };

type Stage = "empty" | "generating" | "ready";

function StudioPage() {
  const [source, setSource] = useState<Source | null>(null);
  const [set, setSet] = useState<DemoSet | null>(null);
  const [stage, setStage] = useState<Stage>("empty");
  const [dragging, setDragging] = useState(false);
  const [excluded, setExcluded] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<BookletOptions>({
    format: "pdf",
    depth: "detailed",
    includeHints: true,
    includeSourceRefs: true,
    answerKey: false,
    includeTopicTags: true,
    title: "",
  });

  const acceptFile = useCallback((file: File) => {
    const demo = pickDemoSet(file.name);
    setSource({
      name: file.name,
      sizeMb: `${Math.max(0.1, file.size / 1024 / 1024).toFixed(1)} MB`,
      pages: 8 + (file.name.length % 9),
    });
    setSet(demo);
    setExcluded([]);
    setStage("ready");
    setOptions((o) => ({ ...o, title: demo.title }));
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const included = useMemo(
    () => (set ? set.questions.filter((q) => !excluded.includes(q.id)) : []),
    [set, excluded],
  );

  const activeSet: DemoSet | null = useMemo(
    () => (set ? { ...set, title: options.title || set.title, questions: included } : null),
    [set, included, options.title],
  );

  const pages = activeSet ? estimatePages(activeSet, options) : 0;

  const runGenerate = () => {
    if (!activeSet || !source || included.length === 0) return;
    setStage("generating");
    window.setTimeout(() => {
      setStage("ready");
      if (options.format === "pdf") downloadPdf(activeSet, options, source.name);
      else void downloadDocx(activeSet, options, source.name);
    }, 1400);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream font-body text-ink">
      <header className="sticky top-0 z-30 shrink-0 border-b border-sand bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-[8px] bg-sage font-display text-[13px] font-semibold text-cream">
              V
            </div>
            <span className="font-display text-[17px] font-semibold tracking-tight">Vellum</span>
            <span className="ml-1 hidden text-[11px] font-medium uppercase tracking-[0.14em] text-mute sm:inline">
              Study Compiler
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-mute sm:inline">
              {source ? "Autosaved just now" : "Demo data · no account needed"}
            </span>
            <button
              onClick={runGenerate}
              disabled={!activeSet || stage === "generating" || included.length === 0}
              className="inline-flex items-center gap-2 rounded-[10px] bg-sage px-3 py-2 text-sm font-medium text-cream transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Generate &amp; Download
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6 sm:px-8">
        {!source || !activeSet ? (
          <UploadPane
            dragging={dragging}
            setDragging={setDragging}
            onDrop={onDrop}
            onPick={() => inputRef.current?.click()}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="order-2 space-y-4 lg:order-1">
              <section className="rounded-[14px] bg-paper p-4 ring-1 ring-black/5">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-sand font-display text-sm font-semibold text-sage-deep">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-semibold">{source.name}</p>
                    <p className="mt-0.5 text-[12px] text-mute">
                      {source.pages} pages · {set!.questions.length} questions found
                    </p>
                  </div>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="shrink-0 text-[12px] font-medium text-rust underline-offset-2 hover:underline"
                  >
                    Replace
                  </button>
                </div>
              </section>

              <section className="rounded-[14px] bg-paper p-4 ring-1 ring-black/5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                  Output format
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["pdf", "docx"] as Format[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setOptions((o) => ({ ...o, format: f }))}
                      className={`flex items-center justify-center gap-1.5 rounded-[9px] py-2 text-sm font-medium transition-transform hover:-translate-y-px ${
                        options.format === f
                          ? "bg-sage text-cream"
                          : "text-ink ring-1 ring-black/10"
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[14px] bg-paper p-4 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                    Explanation depth
                  </h2>
                  <span className="text-[12px] font-medium text-sage-deep">
                    {DEPTH_LABEL[options.depth]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={DEPTHS.indexOf(options.depth) + 1}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      depth: DEPTHS[Number(e.target.value) - 1] as Depth,
                    }))
                  }
                  className="mt-3 w-full accent-[var(--sage)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-mute">
                  <span>Concise</span>
                  <span>Standard</span>
                  <span>Detailed</span>
                </div>
              </section>

              <section className="space-y-3 rounded-[14px] bg-paper p-4 ring-1 ring-black/5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                  Content
                </h2>
                <Toggle
                  label="Include hints & steps"
                  on={options.includeHints}
                  onChange={(v) => setOptions((o) => ({ ...o, includeHints: v }))}
                />
                <Toggle
                  label="Show source page refs"
                  on={options.includeSourceRefs}
                  onChange={(v) => setOptions((o) => ({ ...o, includeSourceRefs: v }))}
                />
                <Toggle
                  label="Topic tags"
                  on={options.includeTopicTags}
                  onChange={(v) => setOptions((o) => ({ ...o, includeTopicTags: v }))}
                />
                <Toggle
                  label="Answer key at end"
                  on={options.answerKey}
                  onChange={(v) => setOptions((o) => ({ ...o, answerKey: v }))}
                />
              </section>

              <section className="rounded-[14px] bg-paper p-4 ring-1 ring-black/5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                  Booklet title
                </h2>
                <input
                  value={options.title}
                  onChange={(e) => setOptions((o) => ({ ...o, title: e.target.value }))}
                  className="mt-3 w-full rounded-[9px] bg-cream px-3 py-2 font-doc text-[14px] text-ink outline-none ring-1 ring-black/10 focus:ring-sage"
                />
              </section>

              <section className="rounded-[14px] bg-paper p-4 ring-1 ring-black/5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                  Questions included
                </h2>
                <div className="mt-3 space-y-2">
                  {set!.questions.map((q, i) => {
                    const on = !excluded.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setExcluded((ex) =>
                              on ? [...ex, q.id] : ex.filter((id) => id !== q.id),
                            )
                          }
                          className="mt-0.5 size-3.5 accent-[var(--sage)]"
                        />
                        <span className={on ? "text-ink" : "text-mute line-through"}>
                          {i + 1}. {q.prompt.slice(0, 46)}…
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </aside>

            <section className="order-1 min-w-0 lg:order-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                    Live preview
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-sage-deep">
                    <span
                      className={`size-1.5 rounded-full ${stage === "generating" ? "bg-rust" : "bg-sage"}`}
                    />
                    {stage === "generating" ? "Generating" : "Draft ready"}
                  </span>
                </div>
                <div className="h-1 w-24 overflow-hidden rounded-full bg-sand sm:w-40">
                  {stage === "generating" && <div className="scan h-full w-full bg-sage" />}
                </div>
              </div>

              <article className="relative rounded-[16px] bg-paper p-6 shadow-paper ring-1 ring-black/5 sm:p-10">
                <div className="border-b border-sand pb-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rust">
                        Study Booklet
                      </p>
                      <h1 className="mt-1.5 max-w-[30ch] text-balance font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                        {activeSet.title}
                      </h1>
                      <p className="mt-1 font-doc text-sm text-mute">
                        Compiled from {source.name} · {included.length} questions
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-mute">
                      Page 1 of {pages}
                    </span>
                  </div>
                </div>

                {included.length === 0 ? (
                  <p className="mt-8 font-doc text-sm text-mute">
                    Every question is switched off. Re-enable at least one to build a booklet.
                  </p>
                ) : (
                  included.map((q, i) => (
                    <div key={q.id} className={i === 0 ? "mt-7" : "mt-6"}>
                      <div className="flex items-start gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage font-display text-[13px] font-semibold text-cream">
                          {i + 1}
                        </span>
                        <p className="pt-0.5 text-pretty font-doc text-[15px] leading-relaxed text-ink">
                          {q.prompt}
                        </p>
                      </div>
                      {q.options && (
                        <div className="ml-0 mt-2 grid gap-1 pl-10 sm:grid-cols-2">
                          {q.options.map((opt, oi) => (
                            <span key={opt} className="font-doc text-[13px] text-mute">
                              {String.fromCharCode(65 + oi)}) {opt}
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        key={`${q.id}-${options.depth}`}
                        className="solve ml-0 mt-3 border-l-2 border-sage/40 pl-4 sm:ml-10"
                      >
                        <p className="font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
                          Solution
                        </p>
                        <p className="mt-1.5 text-pretty font-doc text-[14px] leading-relaxed text-mute">
                          {solutionText(q, options.depth)}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink">
                            <span className="size-1.5 rounded-full bg-sage" />
                            Answer: {q.answer}
                          </span>
                          {options.includeHints && (
                            <span className="text-[11px] text-mute">Hint · {q.hint}</span>
                          )}
                          {options.includeTopicTags && (
                            <span className="text-[11px] text-mute">Topic · {q.topic}</span>
                          )}
                          {options.includeSourceRefs && (
                            <span className="text-[11px] text-mute">Source · p. {q.page}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {options.answerKey && included.length > 0 && (
                  <div className="mt-8 rounded-[12px] bg-cream p-4 ring-1 ring-black/5">
                    <h3 className="font-display text-[13px] font-semibold tracking-tight">
                      Answer key
                    </h3>
                    <div className="mt-2.5 grid grid-cols-2 gap-3 text-[12px] font-medium tabular-nums sm:grid-cols-3">
                      {included.map((q, i) => (
                        <span key={q.id}>
                          {i + 1} · {q.answer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              <div className="mt-4 flex flex-col items-stretch justify-between gap-3 rounded-[12px] bg-sand/60 p-4 ring-1 ring-black/5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Ready to export your study booklet</p>
                  <p className="mt-0.5 text-[12px] text-mute">
                    {options.format.toUpperCase()} · A4 · {pages} pages ·{" "}
                    {DEPTH_LABEL[options.depth].toLowerCase()} explanations
                    {options.includeHints ? ", hints" : ""}
                    {options.includeSourceRefs ? ", source refs" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSource(null);
                      setSet(null);
                      setStage("empty");
                    }}
                    className="rounded-[10px] px-3 py-2 text-sm font-medium text-ink ring-1 ring-black/10 transition-transform hover:-translate-y-px"
                  >
                    Start over
                  </button>
                  <button
                    onClick={runGenerate}
                    disabled={stage === "generating" || included.length === 0}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-rust px-3 py-2 text-sm font-medium text-cream ring-1 ring-rust transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {stage === "generating" ? "Generating…" : "Generate & Download"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) acceptFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full cursor-pointer items-center justify-between"
    >
      <span className="text-sm">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full ring-1 ring-black/10 ${
          on ? "bg-sage" : "bg-sand"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-cream transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function UploadPane({
  dragging,
  setDragging,
  onDrop,
  onPick,
}: {
  dragging: boolean;
  setDragging: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onPick: () => void;
}) {
  return (
    <div className="mx-auto max-w-[720px] py-10 sm:py-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rust">
        Study Booklet Compiler
      </p>
      <h1 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Drop a question paper. Get it back solved.
      </h1>
      <p className="mt-2 max-w-[52ch] text-pretty font-doc text-[15px] leading-relaxed text-mute">
        Vellum reads the questions in your file and lays out a clean booklet with the worked
        solution and explanation right beneath each one — ready to download as PDF or DOCX.
      </p>

      <div
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-8 cursor-pointer rounded-[16px] border-2 border-dashed p-12 text-center transition-colors ${
          dragging ? "border-sage bg-paper" : "border-sand bg-paper/60 hover:bg-paper"
        }`}
      >
        <div className="mx-auto grid size-12 place-items-center rounded-[12px] bg-sand font-display text-sm font-semibold text-sage-deep">
          PDF
        </div>
        <p className="mt-4 text-sm font-semibold">Drag your file here, or click to browse</p>
        <p className="mt-1 text-[12px] text-mute">PDF, DOCX, TXT or a photo of the paper</p>
      </div>

      <div className="mt-6 rounded-[12px] bg-sand/60 p-4 ring-1 ring-black/5">
        <p className="text-[12px] leading-relaxed text-mute">
          <span className="font-semibold text-ink">Prototype note ·</span> this build uses demo
          question banks instead of a live model, so any file you drop returns a sample booklet you
          can fully customise and export.
        </p>
      </div>
    </div>
  );
}
