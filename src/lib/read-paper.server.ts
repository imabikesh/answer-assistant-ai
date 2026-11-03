import { extractText, getDocumentProxy } from "unpdf";
import { strFromU8, unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";
import { chunkPaper, MAX_TEXT_CHARS, validateUpload, type ReadPaper } from "./paper-validation";

function wordText(nodes: unknown): string {
  if (!Array.isArray(nodes)) return "";
  return nodes.map((node: Record<string, unknown>) => {
    if ("#text" in node) return String(node["#text"]);
    return Object.entries(node).map(([tag, children]) => {
      if (tag === ":@") return "";
      if (tag === "w:tab") return "\t";
      if (tag === "w:br" || tag === "w:cr") return "\n";
      return wordText(children) + (tag === "w:p" || tag === "w:tr" ? "\n\n" : tag === "w:tc" ? "\t" : "");
    }).join("");
  }).join("");
}

export async function readPaper(file: File): Promise<ReadPaper> {
  const extension = validateUpload(file.name, file.size);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";
  let pages: number | null = null;
  try {
    if (extension === "pdf") {
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("invalid");
      const pdf = await getDocumentProxy(bytes);
      try {
        const result = await extractText(pdf, { mergePages: false });
        pages = result.totalPages;
        if (!result.text.some(page => page.trim())) {
          throw new Error("This PDF appears to be scanned or image-only. Scanned papers aren't supported yet. Please upload a PDF with selectable text, DOCX or TXT.");
        }
        // A mixed scan/text file must not silently omit unreadable question pages.
        if (result.text.some(page => !page.trim())) {
          throw new Error("Some pages have no readable text and may be scanned or blank. Please remove those pages or upload a text-based version; scanned pages aren't supported yet.");
        }
        text = result.text.map((page, i) => `[Page ${i + 1}]\n${page}`).join("\n\n");
      } finally { await pdf.loadingTask.destroy(); }
    } else if (extension === "docx") {
      const parts = unzipSync(bytes, {
        filter: entry => {
          if (entry.name !== "word/document.xml") return false;
          if (entry.originalSize > 4 * 1024 * 1024) throw new Error("This document expands to too much text. Please split it into smaller files.");
          return true;
        },
      });
      const document = parts["word/document.xml"];
      if (!document) throw new Error("invalid");
      const parser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, parseTagValue: false, processEntities: false });
      text = wordText(parser.parse(strFromU8(document))).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    } else {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (text.includes("\0")) throw new Error("invalid");
    }
  } catch (error) {
    if (error instanceof Error && /supported yet|too much text|no readable text/.test(error.message)) throw error;
    throw new Error("This file couldn't be read. Please check that it opens correctly and upload a valid text-based PDF, DOCX or UTF-8 TXT file.");
  }
  if (text.length > MAX_TEXT_CHARS) throw new Error("This paper has too much text to process at once. Please split it into smaller files.");
  return { chunks: chunkPaper(text), pages, fileType: extension?.toUpperCase() ?? "TXT" };
}