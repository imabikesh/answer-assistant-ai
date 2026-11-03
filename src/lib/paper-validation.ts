import { z } from "zod";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_CHARS = 120_000;
export const CHUNK_CHARS = 6_000;

export function validateUpload(name: string, size: number) {
  if (size === 0) throw new Error("This file is empty. Please upload a question paper with text.");
  if (size > MAX_FILE_BYTES) throw new Error("This file is too large. Please choose a file smaller than 10 MB.");
  const extension = name.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx", "txt"].includes(extension ?? "")) {
    throw new Error("Photos and image files aren't supported yet. Please upload a text-based PDF, DOCX or TXT file.");
  }
  return extension;
}

export type PaperChunk = { text: string; index: number };
export type ReadPaper = { chunks: PaperChunk[]; pages: number | null; fileType: string };

// Keep numbered questions together. Repeated page markers carry PDF attribution across chunks.
export function chunkPaper(text: string): PaperChunk[] {
  if (!text.trim()) throw new Error("No readable text was found. Please upload a question paper with text.");
  if (text.length > MAX_TEXT_CHARS) throw new Error("This paper has too much text to process at once. Please split it into smaller files.");
  const blocks = text.split(/(?=^\s*(?:(?:Question|Q)\s*)?\d+[.)\s:]\s)/im);
  const chunks: PaperChunk[] = [];
  let current = "";
  let pageMarker = "";
  for (const block of blocks) {
    if (block.length > CHUNK_CHARS) {
      // Fall back to paragraph boundaries for unnumbered papers; never silently truncate.
      if (/\n\s*\n/.test(block)) {
        const paragraphs = block.split(/\n\s*\n/);
        for (const paragraph of paragraphs) {
          if (paragraph.length > CHUNK_CHARS) throw new Error("A section of this paper is too long. Please split it into shorter questions or sections.");
          if (current.length + paragraph.length + 2 > CHUNK_CHARS) {
            chunks.push({ text: current, index: chunks.length });
            current = pageMarker;
          }
          current += `${paragraph}\n\n`;
          const markers = [...paragraph.matchAll(/\[Page \d+\]/g)];
          pageMarker = markers.at(-1)?.[0] ?? pageMarker;
        }
        continue;
      }
      throw new Error("A question is too long to process safely. Please split this paper into smaller sections.");
    }
    if (current.length + block.length > CHUNK_CHARS && current.trim()) {
      chunks.push({ text: current, index: chunks.length });
      current = pageMarker ? `${pageMarker}\n` : "";
    }
    current += block;
    const markers = [...block.matchAll(/\[Page \d+\]/g)];
    pageMarker = markers.at(-1)?.[0] ?? pageMarker;
  }
  if (current.trim()) chunks.push({ text: current, index: chunks.length });
  return chunks;
}

// Wire schema: all properties required; unknown page and absent MCQs are nullable.
export const solvedPaperSchema = z.object({
  subject: z.string(),
  title: z.string(),
  questions: z.array(z.object({
    id: z.number(), page: z.number().nullable(), topic: z.string(), prompt: z.string(),
    options: z.array(z.string()).nullable(), answer: z.string(), hint: z.string(),
    concise: z.string(), standard: z.string(), detailed: z.string(),
  }).strict()),
}).strict();

export function validateSolvedPaper(value: unknown, pages: number | null) {
  const parsed = solvedPaperSchema.safeParse(value);
  if (!parsed.success || !parsed.data.subject.trim() || !parsed.data.title.trim()) {
    throw new Error("The solutions couldn't be read correctly. Please try again.");
  }
  for (const q of parsed.data.questions) {
    if (![q.topic, q.prompt, q.answer, q.hint, q.concise, q.standard, q.detailed].every(s => s.trim())) {
      throw new Error("Some solutions were incomplete. Please try again.");
    }
  }
  return {
    subject: parsed.data.subject,
    title: parsed.data.title,
    questions: parsed.data.questions.map((q, index) => {
      const { options, ...rest } = q;
      const page = pages !== null && q.page !== null && Number.isInteger(q.page) && q.page > 0 && q.page <= pages ? q.page : null;
      return {
        ...rest, id: index + 1, page,
        prompt: q.prompt.replace(/^\s*(?:(?:Question|Q)\s*)?\d+[.):]\s*/i, ""),
        ...(options?.length ? { options: options.map(option => option.replace(/^\s*[A-Z][.)]\s*/i, "")) } : {}),
      };
    }),
  };
}