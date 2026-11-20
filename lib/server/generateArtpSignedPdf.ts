import "server-only";

import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import {
  buildArtpDocumentBlocks,
  paginateArtpDocumentBlocks,
  type ArtpDocBlock,
} from "@/lib/artp/artpDocumentPagination";
import { mergeChangeAnswersFromPlanning } from "@/lib/artp/loadArtpWizardState";
import type { ArtpChangeAnswer, ArtpVersionDetail } from "@/types/artp";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 34;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 52;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const COLORS = {
  text: rgb(0.12, 0.14, 0.16),
  muted: rgb(0.42, 0.45, 0.48),
  line: rgb(0.75, 0.77, 0.8),
  head: rgb(0.95, 0.96, 0.97),
  panel: rgb(0.97, 0.97, 0.98),
  teal: rgb(0.05, 0.4, 0.38),
};

type Fonts = { regular: PDFFont; bold: PDFFont };

function siNo(value: boolean | null | undefined): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
}

function checkAnswer(value: string | null | undefined): string {
  if (value === "si") return "Sí";
  if (value === "no") return "No";
  if (value === "no_aplica") return "N/A";
  return "—";
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = (text || "—").replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.length ? lines : ["—"];
}

function dataUrlParts(value: string | null | undefined): { mime: string; bytes: Uint8Array } | null {
  if (!value?.startsWith("data:image/")) return null;
  const comma = value.indexOf(",");
  if (comma < 0) return null;
  const mime = value.slice(5, value.indexOf(";")) || "image/png";
  return { mime, bytes: Uint8Array.from(Buffer.from(value.slice(comma + 1), "base64")) };
}

async function embedDataUrl(pdf: PDFDocument, value: string | null | undefined): Promise<PDFImage | null> {
  const parts = dataUrlParts(value);
  if (!parts) return null;
  try {
    if (parts.mime.includes("png")) return await pdf.embedPng(parts.bytes);
    return await pdf.embedJpg(parts.bytes);
  } catch {
    try {
      return await pdf.embedPng(parts.bytes);
    } catch {
      return null;
    }
  }
}

async function loadFonts(pdf: PDFDocument): Promise<Fonts> {
  pdf.registerFontkit(fontkit);
  const fontDir = path.join(process.cwd(), "lib/server/fonts");
  const regularPath = path.join(fontDir, "noto-sans-latin-400-normal.woff");
  const boldPath = path.join(fontDir, "noto-sans-latin-700-normal.woff");
  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    throw new Error("Fuentes Noto Sans no encontradas en lib/server/fonts.");
  }
  return {
    regular: await pdf.embedFont(fs.readFileSync(regularPath), { subset: true }),
    bold: await pdf.embedFont(fs.readFileSync(boldPath), { subset: true }),
  };
}

class ArtpPdfWriter {
  private y = PAGE_H - MARGIN_TOP;
  private page: PDFPage;

  constructor(
    private pdf: PDFDocument,
    page: PDFPage,
    private fonts: Fonts
  ) {
    this.page = page;
  }

  private newPage(): void {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN_TOP;
  }

  private ensure(height: number): void {
    if (this.y - height < MARGIN_BOTTOM) this.newPage();
  }

  footer(
    page: PDFPage,
    input: { organizationName: string; docCode: string; taskName: string; page: number; total: number }
  ): void {
    const y = 28;
    page.drawText(input.organizationName.toUpperCase(), {
      x: MARGIN_X,
      y: y + 10,
      size: 9,
      font: this.fonts.bold,
      color: rgb(0.7, 0.72, 0.74),
      opacity: 0.35,
    });
    const meta = `${input.organizationName}  ·  ARTP ${input.docCode}  ·  ${input.taskName}`;
    page.drawText(meta.slice(0, 110), {
      x: MARGIN_X,
      y,
      size: 7,
      font: this.fonts.regular,
      color: COLORS.muted,
    });
    const pageLabel = `Hoja ${input.page} de ${input.total}`;
    const w = this.fonts.regular.widthOfTextAtSize(pageLabel, 7);
    page.drawText(pageLabel, {
      x: PAGE_W - MARGIN_X - w,
      y,
      size: 7,
      font: this.fonts.regular,
      color: COLORS.muted,
    });
  }

  async header(block: Extract<ArtpDocBlock, { kind: "fullHeader" }>): Promise<void> {
    const logo = await embedDataUrl(this.pdf, block.organizationLogoUrl);
    let textX = MARGIN_X;
    if (logo) {
      const scale = Math.min(54 / logo.width, 42 / logo.height, 1);
      const w = logo.width * scale;
      const h = logo.height * scale;
      this.page.drawImage(logo, { x: MARGIN_X, y: this.y - h, width: w, height: h });
      textX += w + 10;
    }
    this.page.drawText(block.organizationName, {
      x: textX,
      y: this.y - 12,
      size: 10,
      font: this.fonts.bold,
      color: COLORS.text,
    });
    this.page.drawText("Análisis de Riesgo de la Tarea Planificada (ARTP)", {
      x: textX,
      y: this.y - 26,
      size: 9,
      font: this.fonts.bold,
      color: COLORS.text,
    });
    this.page.drawText(block.taskName.slice(0, 70), {
      x: textX,
      y: this.y - 38,
      size: 8,
      font: this.fonts.regular,
      color: COLORS.muted,
    });
    const badge = `Versión ${block.versionNumber} · ${block.status}`;
    this.page.drawText(badge, {
      x: textX,
      y: this.y - 52,
      size: 8,
      font: this.fonts.bold,
      color: COLORS.teal,
    });
    const code = `Código: ${block.docCode}`;
    const date = `Fecha: ${block.emissionDate}`;
    this.page.drawText(code, {
      x: PAGE_W - MARGIN_X - this.fonts.bold.widthOfTextAtSize(code, 8),
      y: this.y - 12,
      size: 8,
      font: this.fonts.bold,
      color: COLORS.text,
    });
    this.page.drawText(date, {
      x: PAGE_W - MARGIN_X - this.fonts.regular.widthOfTextAtSize(date, 8),
      y: this.y - 24,
      size: 8,
      font: this.fonts.regular,
      color: COLORS.text,
    });
    this.y -= 68;
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_W - MARGIN_X, y: this.y },
      thickness: 1.2,
      color: COLORS.text,
    });
    this.y -= 14;
  }

  sectionTitle(roman: string, title: string): void {
    this.ensure(18);
    this.page.drawText(`${roman}. ${title}`.toUpperCase(), {
      x: MARGIN_X,
      y: this.y - 10,
      size: 9,
      font: this.fonts.bold,
      color: COLORS.text,
    });
    this.y -= 16;
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_W - MARGIN_X, y: this.y },
      thickness: 0.6,
      color: COLORS.line,
    });
    this.y -= 10;
  }

  async antecedentes(block: Extract<ArtpDocBlock, { kind: "antecedentes" }>): Promise<void> {
    const rows: [string, string][] = [
      ["Empresa", block.organizationName],
      ["Tarea / ARTP", block.taskName],
      ["Fecha", block.workDate || "—"],
      ["Hora inicio", (block.startTime || "—").slice(0, 5)],
      ["Hora término", (block.endTime || "—").slice(0, 5)],
      ["Lugar específico", block.specificLocation || "—"],
      ["Área de trabajo", block.workArea || "—"],
      ["Supervisor responsable", block.supervisorName || "—"],
    ];
    const lineH = 14;
    const height = 12 + rows.length * lineH + 48;
    this.ensure(height);
    const top = this.y;
    this.page.drawRectangle({
      x: MARGIN_X,
      y: top - height,
      width: CONTENT_W,
      height,
      color: COLORS.panel,
      borderColor: COLORS.line,
      borderWidth: 0.6,
    });
    let y = top - 16;
    for (const [label, value] of rows) {
      this.page.drawText(label.toUpperCase(), {
        x: MARGIN_X + 8,
        y,
        size: 6.5,
        font: this.fonts.bold,
        color: COLORS.muted,
      });
      this.page.drawText(value.slice(0, 90), {
        x: MARGIN_X + 130,
        y,
        size: 8,
        font: this.fonts.regular,
        color: COLORS.text,
      });
      y -= lineH;
    }
    const signature = await embedDataUrl(this.pdf, block.supervisorSignatureDataUrl);
    if (signature) {
      const scale = Math.min(120 / signature.width, 36 / signature.height, 1);
      this.page.drawImage(signature, {
        x: MARGIN_X + 130,
        y: top - height + 8,
        width: signature.width * scale,
        height: signature.height * scale,
      });
    }
    this.y = top - height - 12;
  }

  subTitle(label: string): void {
    this.ensure(16);
    this.page.drawText(label, {
      x: MARGIN_X,
      y: this.y - 10,
      size: 9,
      font: this.fonts.bold,
      color: COLORS.text,
    });
    this.y -= 16;
  }

  changeTable(rows: ArtpChangeAnswer[]): void {
    const cols = [CONTENT_W * 0.46, CONTENT_W * 0.1, CONTENT_W * 0.44];
    this.drawTable(
      ["Pregunta", "Sí/No", "Detalle (si No)"],
      cols,
      rows.map((row) => [
        row.question,
        siNo(row.answer),
        row.answer === false
          ? `Cambio: ${row.changeDescription || "—"}\nEvento: ${row.undesiredEvent || "—"}\nControles ad.: ${row.additionalControl || "—"}\nVerificación: ${siNo(row.implementationVerified)}`
          : "—",
      ])
    );
  }

  stepTable(
    rows: {
      stepSequence: number;
      stepDescription: string;
      tools: string;
      event: string;
      control: string;
      verification: string;
      verificationAnswer: string | null;
    }[]
  ): void {
    const cols = [28, 90, 80, 90, 100, 110, CONTENT_W - 498];
    this.drawTable(
      ["N°", "Paso", "Herramientas", "Evento", "Controles", "Pregunta", "Resp."],
      cols,
      rows.map((row) => [
        String(row.stepSequence),
        row.stepDescription,
        row.tools,
        row.event,
        row.control,
        row.verification,
        checkAnswer(row.verificationAnswer),
      ])
    );
  }

  async workersTable(
    rows: { name: string; signature?: string | null }[]
  ): Promise<void> {
    const cols = [CONTENT_W * 0.55, CONTENT_W * 0.45];
    const headerH = 16;
    this.ensure(headerH + 28);
    let x = MARGIN_X;
    this.page.drawRectangle({
      x: MARGIN_X,
      y: this.y - headerH,
      width: CONTENT_W,
      height: headerH,
      color: COLORS.head,
      borderColor: COLORS.line,
      borderWidth: 0.4,
    });
    ["Nombre", "Firma"].forEach((label, index) => {
      this.page.drawText(label, {
        x: x + 4,
        y: this.y - 11,
        size: 7,
        font: this.fonts.bold,
        color: COLORS.text,
      });
      x += cols[index];
    });
    this.y -= headerH;
    for (const row of rows) {
      const rowH = 42;
      this.ensure(rowH);
      this.page.drawRectangle({
        x: MARGIN_X,
        y: this.y - rowH,
        width: CONTENT_W,
        height: rowH,
        borderColor: COLORS.line,
        borderWidth: 0.4,
      });
      this.page.drawText(row.name.slice(0, 48), {
        x: MARGIN_X + 4,
        y: this.y - 18,
        size: 8,
        font: this.fonts.bold,
        color: COLORS.text,
      });
      const image = await embedDataUrl(this.pdf, row.signature);
      if (image) {
        const scale = Math.min(130 / image.width, 30 / image.height, 1);
        this.page.drawImage(image, {
          x: MARGIN_X + cols[0] + 6,
          y: this.y - rowH + 6,
          width: image.width * scale,
          height: image.height * scale,
        });
      }
      this.y -= rowH;
    }
    this.y -= 10;
  }

  private drawTable(headers: string[], cols: number[], body: string[][]): void {
    const headerH = 16;
    this.ensure(headerH + 20);
    let x = MARGIN_X;
    this.page.drawRectangle({
      x: MARGIN_X,
      y: this.y - headerH,
      width: CONTENT_W,
      height: headerH,
      color: COLORS.head,
      borderColor: COLORS.line,
      borderWidth: 0.4,
    });
    headers.forEach((label, index) => {
      this.page.drawText(label, {
        x: x + 3,
        y: this.y - 11,
        size: 6.5,
        font: this.fonts.bold,
        color: COLORS.text,
      });
      x += cols[index];
    });
    this.y -= headerH;

    for (const row of body) {
      const heights = row.map((cell, index) => {
        const parts = cell.split("\n");
        return parts.reduce(
          (sum, part) => sum + wrap(this.fonts.regular, part, 7, cols[index] - 6).length * 9,
          8
        );
      });
      const rowH = Math.max(18, ...heights);
      this.ensure(rowH);
      this.page.drawRectangle({
        x: MARGIN_X,
        y: this.y - rowH,
        width: CONTENT_W,
        height: rowH,
        borderColor: COLORS.line,
        borderWidth: 0.3,
      });
      let cx = MARGIN_X;
      row.forEach((cell, index) => {
        const parts = cell.split("\n");
        let ly = this.y;
        for (const part of parts) {
          const lines = wrap(this.fonts.regular, part, 7, cols[index] - 6);
          for (const line of lines) {
            this.page.drawText(line, {
              x: cx + 3,
              y: ly - 10,
              size: 7,
              font: index === 1 ? this.fonts.bold : this.fonts.regular,
              color: COLORS.text,
            });
            ly -= 9;
          }
        }
        cx += cols[index];
      });
      this.y -= rowH;
    }
    this.y -= 10;
  }

  async drawBlocks(blocks: ArtpDocBlock[]): Promise<void> {
    let i = 0;
    while (i < blocks.length) {
      const block = blocks[i];
      if (block.kind === "fullHeader") {
        await this.header(block);
        i += 1;
        continue;
      }
      if (block.kind === "sectionTitle") {
        this.sectionTitle(block.roman, block.title);
        i += 1;
        continue;
      }
      if (block.kind === "antecedentes") {
        await this.antecedentes(block);
        i += 1;
        continue;
      }
      if (block.kind === "changeSubTitle") {
        this.subTitle(block.label);
        i += 1;
        continue;
      }
      if (block.kind === "changeRow") {
        const rows: ArtpChangeAnswer[] = [];
        const category = block.row.category;
        while (i < blocks.length && blocks[i].kind === "changeRow") {
          const row = (blocks[i] as Extract<ArtpDocBlock, { kind: "changeRow" }>).row;
          if (rows.length && row.category !== category) break;
          rows.push(row);
          i += 1;
        }
        this.changeTable(rows);
        continue;
      }
      if (block.kind === "stepTableHead" || block.kind === "stepRow") {
        const rows = [];
        let j = i + (block.kind === "stepTableHead" ? 1 : 0);
        while (j < blocks.length && blocks[j].kind === "stepRow") {
          rows.push((blocks[j] as Extract<ArtpDocBlock, { kind: "stepRow" }>).row);
          j += 1;
        }
        if (rows.length) this.stepTable(rows);
        i = j;
        continue;
      }
      if (block.kind === "workersTableHead" || block.kind === "workerRow") {
        const rows: { name: string; signature?: string | null }[] = [];
        let j = i + (block.kind === "workersTableHead" ? 1 : 0);
        while (j < blocks.length && blocks[j].kind === "workerRow") {
          const row = blocks[j] as Extract<ArtpDocBlock, { kind: "workerRow" }>;
          rows.push({
            name: row.worker?.workerName || "________________________________",
            signature: row.worker?.signatureDataUrl,
          });
          j += 1;
        }
        if (rows.length) await this.workersTable(rows);
        i = j;
        continue;
      }
      i += 1;
    }
  }
}

export async function generateArtpFormalPdf(input: {
  organizationName: string;
  organizationLogoUrl: string | null;
  detail: ArtpVersionDetail;
}): Promise<Uint8Array> {
  const planning = input.detail.planning;
  const work = planning?.workContext;
  const emissionDate = work?.workDate
    ? new Date(work.workDate).toLocaleDateString("es-CL")
    : input.detail.version.publishedAt
      ? new Date(input.detail.version.publishedAt).toLocaleDateString("es-CL")
      : new Date().toLocaleDateString("es-CL");
  const docCode =
    input.detail.document.code ||
    `ARTP-${input.detail.version.versionNumber}`.replace(/\s+/g, "-").toUpperCase();

  const blocks = buildArtpDocumentBlocks({
    organizationName: input.organizationName,
    organizationLogoUrl: input.organizationLogoUrl,
    taskName: input.detail.version.taskName,
    versionNumber: input.detail.version.versionNumber,
    status: input.detail.version.status,
    docCode,
    emissionDate,
    workContext: work,
    changeAnswers: mergeChangeAnswersFromPlanning(planning?.changeAnswers),
    steps: input.detail.steps,
    workers: planning?.workers ?? [],
  });
  const pages = paginateArtpDocumentBlocks(blocks).flat();

  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const writer = new ArtpPdfWriter(pdf, pdf.addPage([PAGE_W, PAGE_H]), fonts);
  await writer.drawBlocks(pages);
  const rendered = pdf.getPages();
  rendered.forEach((page, index) => {
    writer.footer(page, {
      organizationName: input.organizationName,
      docCode,
      taskName: input.detail.version.taskName,
      page: index + 1,
      total: rendered.length,
    });
  });
  return pdf.save();
}
