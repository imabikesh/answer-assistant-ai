import { describe, expect, it } from "vitest";
import { Document, Paragraph, Packer } from "docx";
import { jsPDF } from "jspdf";
import { readPaper } from "./read-paper.server";
import { chunkPaper, MAX_FILE_BYTES, validateSolvedPaper, validateUpload } from "./paper-validation";

const prompt = "1. Solve 3x + 7 = 22.\n\n2. Which number is prime? A) 9 B) 11 C) 15";
describe("paper file rules", () => {
  it("reads uploaded TXT on the server", async () => {
    const result = await readPaper(new File([prompt], "paper.txt"));
    expect(result.chunks[0]?.text).toContain("3x + 7 = 22");
    expect(result.pages).toBeNull();
  });
  it("reads a text-based PDF and real page count", async () => {
    const pdf = new jsPDF(); pdf.text(prompt, 20, 20); pdf.addPage(); pdf.text("3. Find 8 times 5.", 20, 20);
    const result = await readPaper(new File([pdf.output("arraybuffer")], "paper.pdf"));
    expect(result.pages).toBe(2);
    expect(result.chunks.map(c => c.text).join(" ")).toContain("[Page 2]");
  });
  it("reads DOCX paragraphs without merging questions", async () => {
    const document = new Document({ sections: [{ children: [new Paragraph("1. Solve 3x + 7 = 22."), new Paragraph("2. Find 8 times 5.")] }] });
    const result = await readPaper(new File([await Packer.toArrayBuffer(document)], "paper.docx"));
    expect(result.chunks[0]?.text).toContain("1. Solve 3x + 7 = 22.\n\n2. Find 8 times 5.");
  });
  it("rejects PDFs with no extractable text instead of returning samples", async () => {
    const pdf = new jsPDF();
    await expect(readPaper(new File([pdf.output("arraybuffer")], "scan.pdf"))).rejects.toThrow("Scanned papers aren't supported yet");
  });
  it("rejects image files without OCR", () => {
    expect(() => validateUpload("paper.png", 100)).toThrow("aren't supported yet");
  });
  it("rejects empty files", () => {
    expect(() => validateUpload("paper.txt", 0)).toThrow("empty");
  });
  it("rejects oversized files", () => {
    expect(() => validateUpload("paper.pdf", MAX_FILE_BYTES + 1)).toThrow("too large");
  });
  it("rejects blank text", async () => {
    await expect(readPaper(new File(["  \n"], "paper.txt"))).rejects.toThrow("No readable text");
  });
  it("chunks long papers without losing questions", () => {
    const text = Array.from({ length: 60 }, (_, i) => `${i + 1}. Solve this question ${"context ".repeat(30)}\n\n`).join("");
    const chunks = chunkPaper(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(c => c.text.length <= 6100)).toBe(true);
    expect(chunks.map(c => c.text).join("")).toBe(text);
  });
  it("rejects malformed AI responses", () => {
    expect(() => validateSolvedPaper({ questions: [{ prompt: "Hello" }] }, null)).toThrow("couldn't be read");
  });
  it("uses null pages when pagination is unknown and assigns sequential IDs", () => {
    const result = validateSolvedPaper({ subject: "Maths", title: "Algebra", questions: [{ id: 99, page: 10, topic: "Algebra", prompt: "Solve 3x + 7 = 22.", options: null, answer: "5", hint: "Subtract 7", concise: "x = 5", standard: "3x = 15; x = 5", detailed: "Subtract 7, then divide both sides by 3." }] }, null);
    expect(result.questions[0]?.page).toBeNull();
    expect(result.questions[0]?.id).toBe(1);
    expect(result.questions[0]?.options).toBeUndefined();
  });
});