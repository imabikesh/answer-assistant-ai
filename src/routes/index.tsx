import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Bell,
  Download,
  FileText,
  Gauge,
  LayoutGrid,
  ListChecks,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";

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
    <div className="grid-bg flex min-h-screen flex-col bg-cream font-body text-ink">
      <div className="flex flex-1">
        <Rail />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-white/8 bg-cream/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 sm:px-7">
              <div className="flex items-center gap-2 overflow-x-auto">
                <Chip icon={<FileText className="size-3" />} label="Source" value={source ? "1" : "0"} delay={0} />
                <Chip
                  icon={<ListChecks className="size-3" />}
                  label="Questions"
                  value={set ? String(included.length) : "0"}
                  delay={60}
                />
                <Chip
                  icon={<Gauge className="size-3" />}
                  label="Depth"
                  value={DEPTH_LABEL[options.depth]}
                  delay={120}
                />
                <Chip
                  icon={<LayoutGrid className="size-3" />}
                  label="Pages"
                  value={String(pages)}
                  delay={180}
                />
              </div>

              <div className="flex items-center gap-2.5">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-paper/70 px-3 py-1.5 text-[12px] text-mute springy hover:border-sage/40 md:flex">
                  <Search className="size-3.5" />
                  <span>{source ? "Autosaved just now" : "Demo data · no account needed"}</span>
                </div>
                <button className="relative grid size-9 place-items-center rounded-full border border-white/10 bg-paper/70 text-mute springy wobbly hover:text-sage">
                  <Bell className="size-4" />
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-rust font-mono text-[9px] font-bold text-cream ping-ring">
                    3
                  </span>
                </button>
                <button
                  onClick={runGenerate}
                  disabled={!activeSet || stage === "generating" || included.length === 0}
                  className="sheen inline-flex items-center gap-2 rounded-full bg-sage px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] springy hover:glow-lime disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:scale-100"
                >
                  <Sparkles className="size-4" />
                  Generate &amp; Download
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-7">
            {!source || !activeSet ? (
              <UploadPane
                dragging={dragging}
                setDragging={setDragging}
                onDrop={onDrop}
                onPick={() => inputRef.current?.click()}
              />
            ) : (
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
                <aside className="order-2 space-y-4 lg:order-1">
                  <Panel delay={0}>
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand font-mono text-[11px] font-bold text-sage floaty">
                        PDF
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{source.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-mute">
                          {source.pages} pages · {set!.questions.length} questions found
                        </p>
                      </div>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-rust springy hover:border-rust/50 hover:bg-rust/10"
                      >
                        Replace
                      </button>
                    </div>
                  </Panel>

                  <Panel delay={70}>
                    <Label icon={<Download className="size-3" />}>Output format</Label>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(["pdf", "docx"] as Format[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setOptions((o) => ({ ...o, format: f }))}
                          className={`sheen flex items-center justify-center gap-1.5 rounded-full py-2 font-mono text-[12px] font-bold tracking-wide springy ${
                            options.format === f
                              ? "bg-sage text-[color:var(--primary-foreground)] glow-lime"
                              : "border border-white/10 bg-sand/40 text-mute hover:text-ink"
                          }`}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </Panel>

                  <Panel delay={140}>
                    <div className="flex items-center justify-between">
                      <Label icon={<Gauge className="size-3" />}>Explanation depth</Label>
                      <span
                        key={options.depth}
                        className="ticker rounded-full bg-sage/15 px-2 py-0.5 font-mono text-[11px] font-bold text-sage"
                      >
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
                      className="mt-4 w-full accent-[var(--sage)] transition-transform hover:scale-[1.02]"
                    />
                    <div className="mt-1 flex justify-between font-mono text-[10px] uppercase text-mute">
                      <span>Concise</span>
                      <span>Standard</span>
                      <span>Detailed</span>
                    </div>
                  </Panel>

                  <Panel delay={210}>
                    <Label icon={<SlidersHorizontal className="size-3" />}>Content</Label>
                    <div className="mt-3 space-y-3">
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
                    </div>
                  </Panel>

                  <Panel delay={280}>
                    <Label icon={<FileText className="size-3" />}>Booklet title</Label>
                    <input
                      value={options.title}
                      onChange={(e) => setOptions((o) => ({ ...o, title: e.target.value }))}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-cream/60 px-3 py-2.5 text-[14px] text-ink outline-none transition-all duration-300 focus:border-sage/60 focus:bg-cream focus:glow-lime"
                    />
                  </Panel>

                  <Panel delay={350}>
                    <Label icon={<ListChecks className="size-3" />}>Questions included</Label>
                    <div className="mt-3 space-y-1.5">
                      {set!.questions.map((q, i) => {
                        const on = !excluded.includes(q.id);
                        return (
                          <label
                            key={q.id}
                            style={{ animationDelay: `${380 + i * 45}ms` }}
                            className={`slide-left flex cursor-pointer items-start gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-[13px] leading-snug springy hover:border-white/10 hover:bg-sand/40 ${
                              on ? "" : "opacity-55"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                setExcluded((ex) =>
                                  on ? [...ex, q.id] : ex.filter((id) => id !== q.id),
                                )
                              }
                              className="mt-0.5 size-3.5 accent-[var(--sage)] transition-transform hover:scale-125"
                            />
                            <span className={on ? "text-ink" : "text-mute line-through"}>
                              {i + 1}. {q.prompt.slice(0, 46)}…
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </Panel>
                </aside>

                <section className="order-1 min-w-0 lg:order-2">
                  <div className="mb-3 flex items-center justify-between rise">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
                        Live preview
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-paper/70 px-2.5 py-1 text-[11px] font-medium text-sage">
                        <span
                          className={`size-1.5 rounded-full breathe ${
                            stage === "generating" ? "bg-rust" : "bg-sage"
                          }`}
                        />
                        {stage === "generating" ? "Generating" : "Draft ready"}
                      </span>
                    </div>
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-sand sm:w-40">
                      {stage === "generating" && <div className="scan h-full w-full bg-sage" />}
                    </div>
                  </div>

                  <article className="relative overflow-hidden rounded-3xl border border-white/8 bg-paper p-6 shadow-paper sm:p-10">
                    <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-sage/10 blur-3xl floaty" />
                    <div className="border-b border-white/8 pb-5">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rust">
                            Study Booklet
                          </p>
                          <h1 className="mt-1.5 max-w-[30ch] text-balance font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                            {activeSet.title}
                          </h1>
                          <p className="mt-1 text-sm text-mute">
                            Compiled from {source.name} · {included.length} questions
                          </p>
                        </div>
                        <span
                          key={pages}
                          className="ticker shrink-0 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] tabular-nums text-mute"
                        >
                          Page 1 of {pages}
                        </span>
                      </div>
                    </div>

                    {included.length === 0 ? (
                      <p className="mt-8 text-sm text-mute">
                        Every question is switched off. Re-enable at least one to build a booklet.
                      </p>
                    ) : (
                      included.map((q, i) => (
                        <div
                          key={q.id}
                          style={{ animationDelay: `${i * 70}ms` }}
                          className={`rise group rounded-2xl border border-transparent p-3 transition-colors duration-300 hover:border-white/8 hover:bg-sand/25 ${
                            i === 0 ? "mt-6" : "mt-3"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sage font-mono text-[12px] font-bold text-[color:var(--primary-foreground)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                              {i + 1}
                            </span>
                            <p className="pt-0.5 text-pretty text-[15px] leading-relaxed text-ink">
                              {q.prompt}
                            </p>
                          </div>
                          {q.options && (
                            <div className="mt-2 grid gap-1 pl-10 sm:grid-cols-2">
                              {q.options.map((opt, oi) => (
                                <span
                                  key={opt}
                                  style={{ animationDelay: `${i * 70 + oi * 40}ms` }}
                                  className="ticker rounded-lg px-1.5 py-0.5 text-[13px] text-mute transition-colors duration-200 hover:bg-sand/60 hover:text-ink"
                                >
                                  <span className="font-mono text-sage">
                                    {String.fromCharCode(65 + oi)})
                                  </span>{" "}
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          <div
                            key={`${q.id}-${options.depth}`}
                            className="solve mt-3 rounded-2xl border-l-2 border-sage/50 bg-cream/40 py-3 pl-4 pr-3 sm:ml-10"
                          >
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sage">
                              Solution
                            </p>
                            <p className="mt-1.5 text-pretty text-[14px] leading-relaxed text-mute">
                              {solutionText(q, options.depth)}
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-2 py-0.5 text-[12px] font-medium text-ink springy">
                                <span className="size-1.5 rounded-full bg-sage breathe" />
                                Answer: {q.answer}
                              </span>
                              {options.includeHints && (
                                <MiniTag>Hint · {q.hint}</MiniTag>
                              )}
                              {options.includeTopicTags && <MiniTag>Topic · {q.topic}</MiniTag>}
                              {options.includeSourceRefs && (
                                <MiniTag>Source · p. {q.page}</MiniTag>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {options.answerKey && included.length > 0 && (
                      <div className="pop mt-8 rounded-2xl border border-white/8 bg-cream/60 p-4">
                        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-sage">
                          Answer key
                        </h3>
                        <div className="mt-2.5 grid grid-cols-2 gap-3 font-mono text-[12px] tabular-nums sm:grid-cols-3">
                          {included.map((q, i) => (
                            <span
                              key={q.id}
                              style={{ animationDelay: `${i * 40}ms` }}
                              className="ticker rounded-lg px-1.5 py-0.5 transition-colors duration-200 hover:bg-sand/60"
                            >
                              <span className="text-sage">{i + 1}</span> · {q.answer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>

                  <div className="rise mt-4 flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-white/8 bg-paper/70 p-4 backdrop-blur sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Ready to export your study booklet</p>
                      <p className="mt-0.5 font-mono text-[11px] text-mute">
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-sm font-medium text-mute springy hover:text-ink"
                      >
                        <RotateCcw className="size-3.5" />
                        Start over
                      </button>
                      <button
                        onClick={runGenerate}
                        disabled={stage === "generating" || included.length === 0}
                        className="sheen inline-flex items-center gap-2 rounded-full bg-rust px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)] springy hover:shadow-[0_10px_30px_-10px_var(--rust)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Download
                          className={`size-4 ${stage === "generating" ? "spin-slow" : ""}`}
                        />
                        {stage === "generating" ? "Generating…" : "Generate & Download"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>

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

function Rail() {
  const items = [LayoutGrid, FileText, ListChecks, SlidersHorizontal, Gauge];
  return (
    <nav className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center gap-2 border-r border-white/8 bg-paper/60 py-4 backdrop-blur-xl md:flex">
      <div className="pop grid size-10 place-items-center rounded-2xl bg-sage text-[color:var(--primary-foreground)] springy hover:rotate-90 hover:glow-lime">
        <Plus className="size-5" />
      </div>
      <div className="mt-3 flex flex-1 flex-col items-center gap-1.5">
        {items.map((Icon, i) => (
          <button
            key={i}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`pop grid size-10 place-items-center rounded-2xl springy wobbly ${
              i === 0
                ? "bg-sand text-sage"
                : "text-mute hover:bg-sand/60 hover:text-ink"
            }`}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
      <button className="grid size-10 place-items-center rounded-2xl text-mute springy hover:bg-sand/60 hover:text-ink">
        <Settings className="size-4" />
      </button>
    </nav>
  );
}

function Chip({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <span
      style={{ animationDelay: `${delay}ms` }}
      className="pop inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-paper/70 px-2.5 py-1.5 text-[11px] text-mute springy hover:border-sage/40 hover:text-ink"
    >
      <span className="text-sage">{icon}</span>
      {label}
      <span key={value} className="ticker font-mono font-bold text-ink">
        {value}
      </span>
    </span>
  );
}

function Panel({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="rise rounded-3xl border border-white/8 bg-paper/70 p-4 backdrop-blur transition-all duration-300 hover:border-white/15 hover:shadow-paper"
    >
      {children}
    </section>
  );
}

function Label({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
      <span className="text-sage">{icon}</span>
      {children}
    </h2>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-mute springy hover:border-sage/40 hover:text-ink">
      {children}
    </span>
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
      className="group flex w-full cursor-pointer items-center justify-between rounded-xl px-1 py-0.5 transition-colors duration-200 hover:bg-sand/40"
    >
      <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">
        {label}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-all duration-300 ${
          on ? "border-sage/50 bg-sage glow-lime" : "border-white/10 bg-sand"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-cream transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
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
    <div className="mx-auto max-w-[760px] py-10 sm:py-16">
      <p className="pop font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rust">
        Study Booklet Compiler
      </p>
      <h1
        style={{ animationDelay: "80ms" }}
        className="rise mt-2 text-balance font-display text-3xl font-semibold tracking-tight sm:text-5xl"
      >
        Drop a question paper. Get it back solved.
      </h1>
      <p
        style={{ animationDelay: "160ms" }}
        className="rise mt-3 max-w-[54ch] text-pretty text-[15px] leading-relaxed text-mute"
      >
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
        style={{ animationDelay: "240ms" }}
        className={`rise sheen mt-8 cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-paper active:scale-[0.99] ${
          dragging
            ? "scale-[1.02] border-sage bg-sage/10 glow-lime"
            : "border-white/12 bg-paper/50 hover:border-sage/50 hover:bg-paper"
        }`}
      >
        <div
          className={`mx-auto grid size-14 place-items-center rounded-2xl bg-sand text-sage ${
            dragging ? "ping-ring scale-110" : "floaty"
          } transition-transform duration-300`}
        >
          <UploadCloud className="size-6" />
        </div>
        <p className="mt-4 text-sm font-semibold">Drag your file here, or click to browse</p>
        <p className="mt-1 font-mono text-[11px] text-mute">
          PDF, DOCX, TXT or a photo of the paper
        </p>
      </div>

      <div
        style={{ animationDelay: "320ms" }}
        className="rise mt-6 rounded-2xl border border-white/8 bg-paper/60 p-4"
      >
        <p className="text-[12px] leading-relaxed text-mute">
          <span className="font-semibold text-sage">Prototype note ·</span> this build uses demo
          question banks instead of a live model, so any file you drop returns a sample booklet you
          can fully customise and export.
        </p>
      </div>
    </div>
  );
}
