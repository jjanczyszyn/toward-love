import { jsPDF } from "jspdf";

export type Section = {
  id: string;
  title: string;
  duration?: string;
  markdown: string;
  fromTheme?: string; // which script this section was taken from
};

// Strip inline markdown emphasis that jsPDF can't render inline.
function clean(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^#+\s*/, "");
}

const M = 56; // page margin (pt)
const LINE = 14;

export function buildPdf(docTitle: string, sections: Section[]): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - M * 2;
  let y = M;

  const need = (h: number) => {
    if (y + h > pageH - M) {
      doc.addPage();
      y = M;
    }
  };

  // Cover
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("toward.love", M, y + 6);
  y += 30;
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(docTitle, M, y, { maxWidth: maxW });
  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Finalized event script · assembled at script.toward.love", M, y);
  y += 24;
  doc.setDrawColor(220);
  doc.line(M, y, pageW - M, y);
  y += 24;
  doc.setTextColor(20);

  const para = (text: string, opts: { size?: number; indent?: number; gap?: number } = {}) => {
    const size = opts.size ?? 11;
    const indent = opts.indent ?? 0;
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW - indent);
    for (const ln of lines) {
      need(LINE);
      doc.text(ln, M + indent, y);
      y += LINE;
    }
    if (opts.gap) y += opts.gap;
  };

  const renderTable = (rows: string[]) => {
    const cells = rows
      .map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => clean(c.trim())))
      .filter((r) => !r.every((c) => /^-+:?$|^:?-+$|^:?-+:?$|^$/.test(c)));
    if (!cells.length) return;
    const cols = Math.max(...cells.map((r) => r.length));
    const colW = maxW / cols;
    doc.setFontSize(9.5);
    for (let i = 0; i < cells.length; i++) {
      const row = cells[i];
      const wrapped = row.map((c) => doc.splitTextToSize(c, colW - 8));
      const rowH = Math.max(...wrapped.map((w) => w.length)) * 11 + 6;
      need(rowH);
      if (i === 0) doc.setFont("helvetica", "bold");
      for (let c = 0; c < cols; c++) {
        const x = M + c * colW + 3;
        const ls = wrapped[c] || [""];
        ls.forEach((ln: string, k: number) => doc.text(ln, x, y + 9 + k * 11));
      }
      if (i === 0) doc.setFont("helvetica", "normal");
      y += rowH;
      doc.setDrawColor(235);
      doc.line(M, y - 2, pageW - M, y - 2);
    }
    y += 8;
  };

  for (const sec of sections) {
    need(40);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(150, 40, 90);
    const head = sec.duration ? `${sec.title}  ·  ${sec.duration}` : sec.title;
    para(head, { size: 15 });
    doc.setTextColor(20);
    doc.setFont("helvetica", "normal");
    if (sec.fromTheme) {
      doc.setFontSize(8.5);
      doc.setTextColor(140);
      para(`from “${sec.fromTheme}”`, { size: 8.5 });
      doc.setTextColor(20);
    }
    y += 4;

    const lines = sec.markdown.split("\n");
    let i = 0;
    while (i < lines.length) {
      const raw = lines[i];
      const line = raw.trimEnd();
      // Table block
      if (/^\s*\|.*\|\s*$/.test(line)) {
        const block: string[] = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i].trim())) {
          block.push(lines[i]);
          i++;
        }
        renderTable(block);
        continue;
      }
      i++;
      if (!line.trim()) {
        y += 6;
        continue;
      }
      // Headings inside section
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        y += 6;
        doc.setFont("helvetica", "bold");
        para(clean(h[2]), { size: h[1].length <= 3 ? 12.5 : 11.5 });
        doc.setFont("helvetica", "normal");
        continue;
      }
      // Bullets
      const b = line.match(/^\s*[-*]\s+(.*)$/);
      if (b) {
        para("•  " + clean(b[1]), { indent: 12 });
        continue;
      }
      // Numbered
      const n = line.match(/^\s*(\d+)\.\s+(.*)$/);
      if (n) {
        para(`${n[1]}.  ` + clean(n[2]), { indent: 12 });
        continue;
      }
      // Blockquote
      const q = line.match(/^\s*>\s?(.*)$/);
      if (q) {
        doc.setTextColor(90);
        para(clean(q[1]), { indent: 14, size: 10.5 });
        doc.setTextColor(20);
        continue;
      }
      // Horizontal rule
      if (/^\s*---+\s*$/.test(line)) {
        need(10);
        doc.setDrawColor(225);
        doc.line(M, y, pageW - M, y);
        y += 12;
        continue;
      }
      para(clean(line));
    }
    y += 10;
    need(20);
    doc.setDrawColor(230);
    doc.line(M, y, pageW - M, y);
    y += 12;
  }

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`toward.love · ${p} / ${pages}`, pageW / 2, pageH - 24, {
      align: "center",
    });
  }
  return doc;
}

export function pdfBase64(doc: jsPDF): string {
  // jsPDF: datauristring → strip the "data:...;base64," prefix
  const uri = doc.output("datauristring");
  return uri.substring(uri.indexOf(",") + 1);
}
