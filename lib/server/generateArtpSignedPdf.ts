import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PdfFontDraw = { bold?: boolean; size?: number };

function pdfSafe(text: string): string {
  return text
    .replace(/[→⇒]/g, "->")
    .replace(/[—–]/g, "-")
    .replace(/[^\u0000-\u00FF]/g, " ");
}
function wrap(text: string, max = 92): string[] {
  const words = pdfSafe(text).replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ["—"];
}

export async function generateArtpSignedPdf(input: {
  taskName: string;
  statusLabel: string;
  snapshot: Record<string, unknown>;
  signatureImages: { label: string; png: Uint8Array | null }[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;

  const ensure = (need: number) => {
    if (y < need) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
  };

  const write = (text: string, opts?: PdfFontDraw) => {
    const size = opts?.size ?? 10;
    const face = opts?.bold ? bold : font;
    for (const line of wrap(text)) {
      ensure(40);
      page.drawText(line, { x: 40, y, size, font: face, color: rgb(0.12, 0.13, 0.14) });
      y -= size + 4;
    }
  };

  write(`ARTP — ${input.taskName}`, { bold: true, size: 16 });
  write(`Estado: ${input.statusLabel}`, { bold: true, size: 11 });
  y -= 8;

  const planning = (input.snapshot.planning ?? {}) as Record<string, unknown>;
  const work = (planning.workContext ?? {}) as Record<string, unknown>;
  write("I. Antecedentes", { bold: true, size: 12 });
  write(`Fecha: ${String(work.workDate ?? "—")}  Horario: ${String(work.startTime ?? "")} - ${String(work.endTime ?? "")}`);
  write(`Lugar: ${String(work.specificLocation ?? "—")}`);
  write(`Área: ${String(work.workArea ?? "—")}`);
  write(`Supervisor: ${String(work.supervisorName ?? "—")}`);
  y -= 6;

  write("II. Gestión de cambios", { bold: true, size: 12 });
  const answers = Array.isArray(planning.changeAnswers) ? planning.changeAnswers : [];
  for (const row of answers) {
    const item = row as Record<string, unknown>;
    const answer = item.answer === true ? "Sí" : item.answer === false ? "No" : "—";
    write(`${String(item.question ?? "")} → ${answer}`);
  }
  y -= 6;

  write("III. Paso a paso", { bold: true, size: 12 });
  const steps = Array.isArray(input.snapshot.steps) ? input.snapshot.steps : [];
  for (const step of steps) {
    const item = step as Record<string, unknown>;
    write(`${String(item.sequence ?? "")}. ${String(item.description ?? "")}`, { bold: true });
  }
  y -= 6;

  write("Firmas", { bold: true, size: 12 });
  for (const sig of input.signatureImages) {
    write(sig.label, { bold: true });
    if (sig.png) {
      ensure(90);
      try {
        const image = await doc.embedPng(sig.png);
        const scale = Math.min(140 / image.width, 50 / image.height, 1);
        page.drawImage(image, {
          x: 40,
          y: y - 50,
          width: image.width * scale,
          height: image.height * scale,
        });
        y -= 60;
      } catch {
        write("(firma registrada)");
      }
    } else {
      write("Pendiente");
    }
  }

  return doc.save();
}
