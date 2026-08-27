import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

import type { DemoSet } from "./demo-data";
import { type BookletOptions, DEPTH_LABEL, fileStem, solutionText } from "./booklet";

function meta(set: DemoSet, options: BookletOptions, sourceName: string) {
  return `Compiled from ${sourceName} · ${set.questions.length} questions · ${DEPTH_LABEL[options.depth]} explanations`;
}

export async function downloadDocx(
  set: DemoSet,
  options: BookletOptions,
  sourceName: string,
) {
  const children: Paragraph[] = [
    new Paragraph({
      text: "STUDY BOOKLET",
      spacing: { after: 80 },
    }),
    new Paragraph({ text: options.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [new TextRun({ text: meta(set, options, sourceName), italics: true })],
      spacing: { after: 320 },
    }),
  ];

  set.questions.forEach((q, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 80 },
        children: [new TextRun({ text: `${i + 1}. ${q.prompt}`, bold: true })],
      }),
    );

    if (q.options) {
      q.options.forEach((opt, oi) => {
        children.push(
          new Paragraph({
            text: `${String.fromCharCode(65 + oi)}) ${opt}`,
            indent: { left: 360 },
          }),
        );
      });
    }

    children.push(
      new Paragraph({
        spacing: { before: 120 },
        indent: { left: 360 },
        children: [new TextRun({ text: "Solution", bold: true })],
      }),
      new Paragraph({
        indent: { left: 360 },
        text: solutionText(q, options.depth),
      }),
      new Paragraph({
        indent: { left: 360 },
        children: [new TextRun({ text: `Answer: ${q.answer}`, bold: true })],
      }),
    );

    if (options.includeHints) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun({ text: `Hint: ${q.hint}`, italics: true })],
        }),
      );
    }
    const tail: string[] = [];
    if (options.includeTopicTags) tail.push(`Topic: ${q.topic}`);
    if (options.includeSourceRefs) tail.push(`Source: p. ${q.page}`);
    if (tail.length) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun({ text: tail.join("  ·  "), size: 18 })],
        }),
      );
    }
  });

  if (options.answerKey) {
    children.push(
      new Paragraph({
        text: "Answer key",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 120 },
      }),
    );
    set.questions.forEach((q, i) => {
      children.push(new Paragraph({ text: `${i + 1}. ${q.answer}` }));
    });
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Generated with Vellum Study Compiler (demo data)", size: 16 }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileStem(options.title)}.docx`);
}

export function downloadPdf(set: DemoSet, options: BookletOptions, sourceName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > bottom) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (
    text: string,
    opts: { size: number; style?: "normal" | "bold" | "italic"; indent?: number; gap?: number; color?: number[] },
  ) => {
    doc.setFont("times", opts.style ?? "normal");
    doc.setFontSize(opts.size);
    const c = opts.color ?? [42, 39, 31];
    doc.setTextColor(c[0]!, c[1]!, c[2]!);
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(text, width - indent) as string[];
    lines.forEach((line) => {
      ensure(opts.size * 1.35);
      doc.text(line, margin + indent, y);
      y += opts.size * 1.35;
    });
    y += opts.gap ?? 0;
  };

  write("STUDY BOOKLET", { size: 9, style: "bold", color: [189, 69, 44], gap: 6 });
  write(options.title, { size: 22, style: "bold", gap: 4 });
  write(meta(set, options, sourceName), { size: 10, style: "italic", color: [122, 116, 102], gap: 14 });

  set.questions.forEach((q, i) => {
    ensure(70);
    write(`${i + 1}. ${q.prompt}`, { size: 12, style: "bold", gap: 4 });
    if (q.options) {
      q.options.forEach((opt, oi) => {
        write(`${String.fromCharCode(65 + oi)}) ${opt}`, { size: 11, indent: 18 });
      });
      y += 4;
    }
    write("SOLUTION", { size: 8, style: "bold", indent: 18, color: [53, 82, 63], gap: 2 });
    write(solutionText(q, options.depth), { size: 11, indent: 18, color: [80, 76, 66], gap: 2 });
    write(`Answer: ${q.answer}`, { size: 11, style: "bold", indent: 18 });
    if (options.includeHints) {
      write(`Hint: ${q.hint}`, { size: 10, style: "italic", indent: 18, color: [122, 116, 102] });
    }
    const tail: string[] = [];
    if (options.includeTopicTags) tail.push(`Topic: ${q.topic}`);
    if (options.includeSourceRefs) tail.push(`Source: p. ${q.page}`);
    if (tail.length) {
      write(tail.join("  ·  "), { size: 9, indent: 18, color: [122, 116, 102] });
    }
    y += 12;
  });

  if (options.answerKey) {
    ensure(60);
    y += 6;
    write("Answer key", { size: 14, style: "bold", gap: 4 });
    set.questions.forEach((q, i) => write(`${i + 1}. ${q.answer}`, { size: 11 }));
  }

  doc.save(`${fileStem(options.title)}.pdf`);
}
