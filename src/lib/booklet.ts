import type { DemoSet, Question } from "./demo-data";

export type Depth = "concise" | "standard" | "detailed";
export type Format = "pdf" | "docx";

export type BookletOptions = {
  format: Format;
  depth: Depth;
  includeHints: boolean;
  includeSourceRefs: boolean;
  answerKey: boolean;
  includeTopicTags: boolean;
  title: string;
};

export const DEPTH_LABEL: Record<Depth, string> = {
  concise: "Concise",
  standard: "Standard",
  detailed: "Detailed",
};

export const DEPTHS: Depth[] = ["concise", "standard", "detailed"];

export function solutionText(q: Question, depth: Depth): string {
  return q[depth];
}

export function estimatePages(set: DemoSet, options: BookletOptions): number {
  const per = options.depth === "detailed" ? 0.55 : options.depth === "standard" ? 0.38 : 0.28;
  const base = 0.6 + set.questions.length * per;
  return Math.max(1, Math.ceil(base + (options.answerKey ? 0.3 : 0)));
}

export function fileStem(title: string): string {
  return title.replace(/[^\w\s·-]/g, "").replace(/[\s·]+/g, "_") || "study_booklet";
}
