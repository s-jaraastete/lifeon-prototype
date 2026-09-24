import "server-only";



import fs from "fs";

import path from "path";

import fontkit from "@pdf-lib/fontkit";

import { PDFDocument, rgb, type PDFPage, type PDFFont, type RGB } from "pdf-lib";

import {

  IRL_LEGAL_BADGE,

  IRL_LEGAL_SUBTITLE,

  IRL_OBLIGATION_BODY,

  IRL_OBLIGATION_TITLE,

  IRL_WORKER_DECLARATION_INTRO,

  IRL_WORKER_DECLARATION_OUTRO,

  buildIrlDocumentCode,

  consequencesForIrlLevel,

  parseIrlSnapshot,

  type IrlEvaluationLike,

} from "@/lib/irl/irlDocumentCopy";

import { evaluationFromSnapshotRow } from "@/lib/irl/evaluationFromSnapshot";
import { trimSignaturePng } from "@/lib/server/trimSignaturePng";



export type GenerateIrlDeliveryPdfParams = {

  snapshot: Record<string, unknown>;

  documentCode: string | null;

  signedAt: string | null;

  signaturePngBytes?: Uint8Array | null;

};



const PAGE_W = 595;

const PAGE_H = 842;

const MARGIN = 52;

const CONTENT_W = PAGE_W - MARGIN * 2;



const EPP_ITEMS = [

  "Casco de seguridad dieléctrico",

  "Calzado de seguridad certificado",

  "Lentes de seguridad con filtro UV",

  "Guantes de protección mecánica",

];



const COLORS = {

  text: rgb(0.12, 0.12, 0.14),

  muted: rgb(0.45, 0.45, 0.5),

  border: rgb(0.82, 0.82, 0.84),

  headerBg: rgb(0.96, 0.96, 0.97),

  panelBg: rgb(0.97, 0.97, 0.98),

  blueBg: rgb(0.93, 0.96, 1),

  blueText: rgb(0.05, 0.2, 0.45),

  teal: rgb(0.05, 0.45, 0.4),

};



type Fonts = { regular: PDFFont; bold: PDFFont };



class IrlPdfWriter {

  private pdf: PDFDocument;

  private page: PDFPage;

  private y: number;

  private fonts: Fonts;



  constructor(pdf: PDFDocument, page: PDFPage, fonts: Fonts) {

    this.pdf = pdf;

    this.page = page;

    this.fonts = fonts;

    this.y = PAGE_H - MARGIN;

  }



  private newPage() {

    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);

    this.y = PAGE_H - MARGIN;

  }



  private ensureSpace(needed: number) {

    if (this.y - needed >= MARGIN + 36) return;

    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);

    this.y = PAGE_H - MARGIN;

  }



  wrapLines(text: string, maxWidth: number, size: number, font: PDFFont): string[] {

    const words = text.replace(/\s+/g, " ").trim().split(" ");

    if (!words.length || (words.length === 1 && !words[0])) return [""];

    const lines: string[] = [];

    let line = "";

    for (const w of words) {

      const next = line ? `${line} ${w}` : w;

      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {

        lines.push(line);

        line = w;

      } else {

        line = next;

      }

    }

    if (line) lines.push(line);

    return lines;

  }



  drawTextBlock(

    text: string,

    opts: {

      size: number;

      bold?: boolean;

      color?: RGB;

      maxWidth?: number;

      lineGap?: number;

    }

  ): number {

    const font = opts.bold ? this.fonts.bold : this.fonts.regular;

    const maxWidth = opts.maxWidth ?? CONTENT_W;

    const size = opts.size;

    const lineGap = opts.lineGap ?? 4;

    const lines = this.wrapLines(text, maxWidth, size, font);

    const blockH = lines.length * (size + lineGap);

    this.ensureSpace(blockH);

    for (const line of lines) {

      this.page.drawText(line, {

        x: MARGIN,

        y: this.y,

        size,

        font,

        color: opts.color ?? COLORS.text,

      });

      this.y -= size + lineGap;

    }

    return blockH;

  }



  private drawJustifiedLine(

    words: string[],

    x: number,

    y: number,

    maxWidth: number,

    size: number,

    font: PDFFont,

    color: RGB,

    justify: boolean

  ) {

    if (words.length === 0) return;

    if (!justify || words.length === 1) {

      this.page.drawText(words.join(" "), { x, y, size, font, color });

      return;

    }

    const spaceW = font.widthOfTextAtSize(" ", size);

    let wordsWidth = 0;

    for (const w of words) {

      wordsWidth += font.widthOfTextAtSize(w, size);

    }

    const gaps = words.length - 1;

    const extra = maxWidth - wordsWidth - gaps * spaceW;

    const gap = gaps > 0 ? extra / gaps + spaceW : spaceW;

    let cx = x;

    for (let i = 0; i < words.length; i++) {

      this.page.drawText(words[i], { x: cx, y, size, font, color });

      if (i < words.length - 1) {

        cx += font.widthOfTextAtSize(words[i], size) + gap;

      }

    }

  }



  drawJustifiedTextBlock(

    text: string,

    opts: {

      size: number;

      bold?: boolean;

      color?: RGB;

      maxWidth?: number;

      lineGap?: number;

      x?: number;

    }

  ): number {

    const font = opts.bold ? this.fonts.bold : this.fonts.regular;

    const maxWidth = opts.maxWidth ?? CONTENT_W;

    const x = opts.x ?? MARGIN;

    const size = opts.size;

    const lineGap = opts.lineGap ?? 3;

    const lines = this.wrapLines(text, maxWidth, size, font);

    const blockH = lines.length * (size + lineGap);

    this.ensureSpace(blockH);

    for (let i = 0; i < lines.length; i++) {

      const words = lines[i].split(" ").filter(Boolean);

      const justify = i < lines.length - 1;

      this.drawJustifiedLine(words, x, this.y, maxWidth, size, font, opts.color ?? COLORS.text, justify);

      this.y -= size + lineGap;

    }

    return blockH;

  }



  drawTextInBox(

    x: number,

    topY: number,

    width: number,

    text: string,

    size: number,

    font: PDFFont,

    color: RGB

  ): number {

    const lines = this.wrapLines(text, width - 8, size, font);

    let cy = topY - 6;

    for (const line of lines) {

      this.page.drawText(line, { x: x + 4, y: cy - size, size, font, color });

      cy -= size + 3;

    }

    return topY - cy + 6;

  }



  gap(px: number) {

    this.y -= px;

  }



  drawHRule(thick = 1) {

    this.ensureSpace(thick + 4);

    this.page.drawLine({

      start: { x: MARGIN, y: this.y },

      end: { x: PAGE_W - MARGIN, y: this.y },

      thickness: thick,

      color: COLORS.text,

    });

    this.y -= 8;

  }



  drawRect(x: number, yBottom: number, w: number, h: number, fill: RGB, stroke?: RGB) {

    this.page.drawRectangle({

      x,

      y: yBottom,

      width: w,

      height: h,

      color: fill,

      borderColor: stroke,

      borderWidth: stroke ? 0.75 : 0,

    });

  }



  async drawLogo(url: string | null | undefined): Promise<number> {

    if (!url?.trim()) return 0;

    try {

      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) return 0;

      const buf = new Uint8Array(await res.arrayBuffer());

      const ct = res.headers.get("content-type") || "";

      let img;

      if (ct.includes("png") || url.toLowerCase().includes(".png")) {

        img = await this.pdf.embedPng(buf);

      } else {

        img = await this.pdf.embedJpg(buf);

      }

      const maxW = 72;

      const maxH = 56;

      const scale = Math.min(maxW / img.width, maxH / img.height, 1);

      const w = img.width * scale;

      const h = img.height * scale;

      this.ensureSpace(h + 4);

      this.page.drawImage(img, { x: MARGIN, y: this.y - h, width: w, height: h });

      return h;

    } catch {

      return 0;

    }

  }



  async drawHeaderBlock(params: {

    organizationName: string;

    code: string;

    matrixCode: string;

    emissionDate: string;

    logoUrl?: string | null;

  }) {

    const headerTop = this.y;

    const rightW = 118;

    const rightX = PAGE_W - MARGIN - rightW;

    let leftX = MARGIN;

    let leftMaxW = CONTENT_W - rightW - 12;

    let logoBottomY = headerTop;



    const metaLines = [

      { label: "Código Doc:", value: params.code },

      { label: "Ref. IPER:", value: params.matrixCode },

      { label: "Fecha Emisión:", value: params.emissionDate },

    ];

    let metaY = headerTop - 4;

    for (const row of metaLines) {

      this.page.drawText(row.label, {

        x: rightX,

        y: metaY,

        size: 7,

        font: this.fonts.bold,

        color: COLORS.muted,

      });

      metaY -= 9;

      const valLines = this.wrapLines(row.value, rightW, 8, this.fonts.bold);

      for (const vl of valLines) {

        this.page.drawText(vl, {

          x: rightX,

          y: metaY,

          size: 8,

          font: this.fonts.bold,

          color: COLORS.text,

        });

        metaY -= 10;

      }

      metaY -= 4;

    }



    if (params.logoUrl?.trim()) {

      try {

        const res = await fetch(params.logoUrl, { cache: "no-store" });

        if (res.ok) {

          const buf = new Uint8Array(await res.arrayBuffer());

          const ct = res.headers.get("content-type") || "";

          const img =

            ct.includes("png") || params.logoUrl.toLowerCase().includes(".png")

              ? await this.pdf.embedPng(buf)

              : await this.pdf.embedJpg(buf);

          const maxW = 72;

          const maxH = 56;

          const scale = Math.min(maxW / img.width, maxH / img.height, 1);

          const w = img.width * scale;

          const h = img.height * scale;

          this.page.drawImage(img, {

            x: MARGIN,

            y: headerTop - h,

            width: w,

            height: h,

          });

          leftX = MARGIN + w + 10;

          leftMaxW -= w + 10;

          logoBottomY = headerTop - h;

        }

      } catch {

        /* ignore logo */

      }

    }



    let leftY = headerTop;

    leftY -= 4;

    this.page.drawText(params.organizationName, {

      x: leftX,

      y: leftY - 11,

      size: 11,

      font: this.fonts.bold,

      color: COLORS.text,

    });

    leftY -= 16;

    this.page.drawText("INFORMACIÓN DE RIESGOS LABORALES (IRL)", {

      x: leftX,

      y: leftY - 11,

      size: 11,

      font: this.fonts.bold,

      color: COLORS.text,

    });

    leftY -= 14;

    const subLines = this.wrapLines(IRL_LEGAL_SUBTITLE, leftMaxW, 7, this.fonts.regular);

    let subY = leftY;

    for (let i = 0; i < subLines.length; i++) {

      const words = subLines[i].split(" ").filter(Boolean);

      this.drawJustifiedLine(

        words,

        leftX,

        subY - 7,

        leftMaxW,

        7,

        this.fonts.regular,

        COLORS.muted,

        i < subLines.length - 1

      );

      subY -= 10;

    }

    leftY = subY - 4;

    this.drawRect(leftX, leftY - 14, 52, 14, rgb(0.93, 0.98, 0.97), rgb(0.6, 0.85, 0.82));

    this.page.drawText(IRL_LEGAL_BADGE, {

      x: leftX + 6,

      y: leftY - 11,

      size: 7,

      font: this.fonts.bold,

      color: COLORS.teal,

    });

    leftY -= 20;



    const headerBottom = Math.min(leftY, metaY, logoBottomY) - 6;

    this.y = headerBottom;

    this.drawHRule(1.5);

  }



  drawMetadataPanel(fields: { label: string; value: string; highlight?: boolean }[]) {

    const pad = 12;

    const colW = (CONTENT_W - pad * 2) / 2;

    const rowH = 28;

    const rows = Math.ceil(fields.length / 2);

    const panelH = pad * 2 + rows * rowH;

    this.ensureSpace(panelH + 8);

    const bottom = this.y - panelH;

    this.drawRect(MARGIN, bottom, CONTENT_W, panelH, COLORS.panelBg, COLORS.border);



    fields.forEach((f, i) => {

      const col = i % 2;

      const row = Math.floor(i / 2);

      const x = MARGIN + pad + col * colW;

      const yTop = this.y - pad - row * rowH;

      this.page.drawText(f.label.toUpperCase(), {

        x,

        y: yTop - 8,

        size: 6.5,

        font: this.fonts.bold,

        color: COLORS.muted,

      });

      const valFont = f.highlight ? this.fonts.bold : this.fonts.regular;

      const valColor = f.highlight ? COLORS.teal : COLORS.text;

      this.page.drawText(f.value.slice(0, 120), {

        x,

        y: yTop - 20,

        size: 8.5,

        font: valFont,

        color: valColor,

      });

    });

    this.y = bottom - 10;

  }



  drawObligationBox() {

    const pad = 12;

    const titleH = 14;

    const bodyLines = this.wrapLines(IRL_OBLIGATION_BODY, CONTENT_W - pad * 2, 8, this.fonts.regular);

    const boxH = pad + titleH + bodyLines.length * 11 + pad;

    this.ensureSpace(boxH + 8);

    const bottom = this.y - boxH;

    this.drawRect(MARGIN, bottom, CONTENT_W, boxH, COLORS.blueBg, rgb(0.65, 0.78, 0.95));

    this.page.drawText(IRL_OBLIGATION_TITLE, {

      x: MARGIN + pad,

      y: this.y - pad - 10,

      size: 8.5,

      font: this.fonts.bold,

      color: COLORS.blueText,

    });

    let by = this.y - pad - titleH - 4;

    const innerW = CONTENT_W - pad * 2;

    for (let i = 0; i < bodyLines.length; i++) {

      const words = bodyLines[i].split(" ").filter(Boolean);

      const justify = i < bodyLines.length - 1;

      this.drawJustifiedLine(

        words,

        MARGIN + pad,

        by - 8,

        innerW,

        8,

        this.fonts.regular,

        COLORS.blueText,

        justify

      );

      by -= 11;

    }

    this.y = bottom - 22;

  }



  drawEvaluationsTable(evaluations: IrlEvaluationLike[]) {

    this.gap(14);

    this.drawTextBlock("1. Tareas, peligros, riesgos y medidas de control del cargo", {

      size: 9,

      bold: true,

    });

    this.page.drawText(`${evaluations.length} riesgo(s) asociado(s)`, {

      x: PAGE_W - MARGIN - 100,

      y: this.y + 2,

      size: 7,

      font: this.fonts.regular,

      color: COLORS.muted,

    });

    this.gap(6);



    const colFracs = [0.25, 0.25, 0.2, 0.3];

    const colWs = colFracs.map((f) => f * CONTENT_W);

    const headers = ["Tarea / actividad", "Peligro identificado", "Riesgo asociado", "Medidas de control"];

    const headerH = 22;

    const cellPad = 4;

    const fontSize = 7.5;



    const drawTableHeader = () => {

      this.ensureSpace(headerH + 4);

      const bottom = this.y - headerH;

      this.drawRect(MARGIN, bottom, CONTENT_W, headerH, COLORS.headerBg, COLORS.border);

      let cx = MARGIN;

      headers.forEach((h, i) => {

        this.page.drawText(h, {

          x: cx + cellPad,

          y: bottom + headerH - 10,

          size: 7.5,

          font: this.fonts.bold,

          color: COLORS.text,

        });

        if (i < headers.length - 1) {

          this.page.drawLine({

            start: { x: cx + colWs[i], y: bottom },

            end: { x: cx + colWs[i], y: bottom + headerH },

            thickness: 0.5,

            color: COLORS.border,

          });

        }

        cx += colWs[i];

      });

      this.y = bottom;

    };



    drawTableHeader();



    const buildCellTexts = (ev: IrlEvaluationLike): string[] => {

      const task = ev.task?.trim() || "—";

      const process = ev.process?.trim() ? `Proceso: ${ev.process}` : "";

      const taskCell = process ? `${task}\n${process}` : task;

      const hazard = ev.hazard?.trim() || "—";

      const risk = ev.riskEvent?.trim() || "—";

      const cons = `Consecuencias posibles: ${consequencesForIrlLevel(ev.initialLevel)}`;

      const riskCell = `${risk}\n${cons}`;

      const controls = ev.controls?.trim() || "—";

      return [taskCell, hazard, riskCell, controls];

    };



    const measureRow = (texts: string[]): number => {

      let maxH = 16;

      texts.forEach((t, i) => {

        const lines = t.split("\n").flatMap((part) =>

          this.wrapLines(part, colWs[i] - cellPad * 2, fontSize, this.fonts.regular)

        );

        const h = lines.length * (fontSize + 3) + cellPad * 2;

        if (h > maxH) maxH = h;

      });

      return maxH;

    };



    const drawRow = (texts: string[], rowH: number) => {

      this.ensureSpace(rowH + 2);

      const bottom = this.y - rowH;

      this.drawRect(MARGIN, bottom, CONTENT_W, rowH, rgb(1, 1, 1), COLORS.border);

      let cx = MARGIN;

      texts.forEach((t, i) => {

        const lines = t.split("\n").flatMap((part) =>

          this.wrapLines(part, colWs[i] - cellPad * 2, fontSize, this.fonts.regular)

        );

        let cy = this.y - cellPad - fontSize;

        for (const line of lines) {

          const f = i === 0 && line === texts[0].split("\n")[0] ? this.fonts.bold : this.fonts.regular;

          this.page.drawText(line, {

            x: cx + cellPad,

            y: cy,

            size: fontSize,

            font: f,

            color: COLORS.text,

          });

          cy -= fontSize + 3;

        }

        if (i < texts.length - 1) {

          this.page.drawLine({

            start: { x: cx + colWs[i], y: bottom },

            end: { x: cx + colWs[i], y: bottom + rowH },

            thickness: 0.5,

            color: COLORS.border,

          });

        }

        cx += colWs[i];

      });

      this.y = bottom;

    };



    if (evaluations.length === 0) {

      const rowH = 36;

      drawRow(["No hay evaluaciones registradas para este cargo en la matriz.", "", "", ""], rowH);

    } else {

      for (const ev of evaluations) {

        const texts = buildCellTexts(ev);

        const rowH = measureRow(texts);

        if (this.y - rowH < MARGIN + 40) {

          this.page = this.pdf.addPage([PAGE_W, PAGE_H]);

          this.y = PAGE_H - MARGIN;

          drawTableHeader();

        }

        drawRow(texts, rowH);

      }

    }

    this.gap(10);

  }



  drawEppSection() {

    this.newPage();

    this.drawTextBlock("2. Elementos de Protección Personal (EPP) de Uso Obligatorio", {

      size: 9,

      bold: true,

    });

    this.drawTextBlock(

      "Según procedimientos del centro de trabajo y evaluaciones de la matriz IPER vigente.",

      { size: 7.5, color: COLORS.muted, lineGap: 3 }

    );

    this.gap(6);

    const itemW = CONTENT_W / 2 - 4;

    const rowH = 20;

    const gridH = rowH * 2 + 10;

    this.ensureSpace(gridH);

    const gridTop = this.y;



    EPP_ITEMS.forEach((label, i) => {

      const col = i % 2;

      const row = Math.floor(i / 2);

      const x = MARGIN + col * (itemW + 8);

      const baseline = gridTop - row * rowH - 14;

      this.page.drawText("•", {

        x,

        y: baseline,

        size: 10,

        font: this.fonts.bold,

        color: COLORS.teal,

      });

      const lines = this.wrapLines(label, itemW - 14, 7.5, this.fonts.regular);

      this.page.drawText(lines[0] ?? label, {

        x: x + 12,

        y: baseline,

        size: 7.5,

        font: this.fonts.regular,

        color: COLORS.text,

      });

    });

    this.y -= gridH + 8;

  }



  async drawDeclaration(params: {

    cargoName: string;

    workerName: string;

    workerRut: string;

    signedDate: string;

    responsible: string;

    signaturePngBytes?: Uint8Array | null;

  }) {

    this.gap(28);

    this.drawTextBlock("3. Declaración de Recepción y Conformidad del Trabajador", {

      size: 9,

      bold: true,

    });

    const decl = `${IRL_WORKER_DECLARATION_INTRO} ${params.cargoName}. ${IRL_WORKER_DECLARATION_OUTRO}`;

    this.drawJustifiedTextBlock(decl, { size: 8, lineGap: 3, maxWidth: CONTENT_W });

    this.gap(14);



    const colGap = 20;

    const colW = (CONTENT_W - colGap) / 2;

    const blockH = 168;

    this.ensureSpace(blockH + 8);

    const blockBottom = this.y - blockH;



    const drawSigColumn = async (x: number, title: string, lines: string[]) => {

      const lineY = blockBottom + 92;

      const sigH = 76;



      if (params.signaturePngBytes?.length && title.includes("TRABAJADOR")) {

        try {

          const trimmed = trimSignaturePng(params.signaturePngBytes);

          const img = await this.pdf.embedPng(trimmed);

          const w = Math.min(colW - 8, (img.width / img.height) * sigH);

          this.page.drawImage(img, {

            x: x + (colW - w) / 2,

            y: lineY,

            width: w,

            height: sigH,

          });

        } catch {

          /* ignore */

        }

      }



      this.page.drawLine({

        start: { x: x + 6, y: lineY },

        end: { x: x + colW - 6, y: lineY },

        thickness: 0.65,

        color: COLORS.muted,

      });



      const titleSize = 7.5;

      const titleW = this.fonts.bold.widthOfTextAtSize(title, titleSize);

      let textY = lineY - 12;

      this.page.drawText(title, {

        x: x + Math.max(0, (colW - titleW) / 2),

        y: textY,

        size: titleSize,

        font: this.fonts.bold,

        color: COLORS.text,

      });

      textY -= 11;



      for (const line of lines) {

        const lineSize = 7;

        const lw = this.fonts.regular.widthOfTextAtSize(line, lineSize);

        this.page.drawText(line, {

          x: x + Math.max(4, (colW - lw) / 2),

          y: textY,

          size: lineSize,

          font: this.fonts.regular,

          color: COLORS.text,

        });

        textY -= 10;

      }

    };



    await drawSigColumn(MARGIN, "FIRMA DEL TRABAJADOR / TRABAJADORA", [

      `Nombre: ${params.workerName}`,

      `RUT/ID: ${params.workerRut} · Fecha: ${params.signedDate}`,

    ]);

    await drawSigColumn(MARGIN + colW + colGap, "POR LA EMPRESA / PREVENCIONISTA (APR)", [

      `Nombre: ${params.responsible || "—"}`,

      "Firma y Timbre Departamento SST",

    ]);



    this.y = blockBottom - 10;

  }

}



async function loadFonts(pdf: PDFDocument): Promise<Fonts> {
  pdf.registerFontkit(fontkit);
  const fontDir = path.join(process.cwd(), "node_modules/@fontsource/noto-sans/files");
  const regularPath = path.join(fontDir, "noto-sans-latin-400-normal.woff");
  const boldPath = path.join(fontDir, "noto-sans-latin-700-normal.woff");

  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    throw new Error(
      "Fuentes Noto Sans no encontradas. Ejecuta npm install en la raíz del proyecto."
    );
  }

  const regularBytes = fs.readFileSync(regularPath);
  const boldBytes = fs.readFileSync(boldPath);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  return { regular, bold };
}



export async function generateIrlDeliveryPdf(

  params: GenerateIrlDeliveryPdfParams

): Promise<Uint8Array> {

  const parsed = parseIrlSnapshot(params.snapshot);

  const org = parsed.organizationName?.trim() || "Empresa";

  const matrixCode = parsed.matrixCode?.trim() || "—";

  const matrixTitle = parsed.matrixTitle?.trim() || "Matriz IPER";

  const cargo = parsed.cargoName?.trim() || "—";

  const wc = parsed.workCenterName?.trim() || "—";

  const responsible = parsed.responsible?.trim() || "—";

  const code =

    parsed.documentCode ||

    params.documentCode ||

    buildIrlDocumentCode(matrixCode, cargo);

  const emissionDate = parsed.issuedAt

    ? new Date(parsed.issuedAt).toLocaleDateString("es-CL")

    : new Date().toLocaleDateString("es-CL");



  const evaluations = (parsed.evaluations ?? []).map((row) =>

    evaluationFromSnapshotRow(row as Record<string, unknown>)

  );



  const workerName =

    parsed.assigneeFullName?.trim() || "_____________________________________";

  const workerRut =

    parsed.assigneeIdentificationNumber?.trim() || "____________________";

  const signedDate = params.signedAt

    ? new Date(params.signedAt).toLocaleDateString("es-CL")

    : "___/___/______";



  const pdf = await PDFDocument.create();

  const fonts = await loadFonts(pdf);

  let page = pdf.addPage([PAGE_W, PAGE_H]);

  const w = new IrlPdfWriter(pdf, page, fonts);



  await w.drawHeaderBlock({

    organizationName: org,

    code,

    matrixCode,

    emissionDate,

    logoUrl: parsed.organizationLogoUrl,

  });



  w.drawMetadataPanel([

    { label: "Empresa / Razón Social", value: org },

    { label: "Centro de Trabajo / Faena", value: wc },

    { label: "Cargo / Puesto de Trabajo Evaluado", value: cargo, highlight: true },

    { label: "Matriz IPER de origen", value: matrixTitle },

    { label: "Responsable de Prevención (APR)", value: responsible },

  ]);



  w.drawObligationBox();

  w.drawEvaluationsTable(evaluations);

  w.drawEppSection();

  await w.drawDeclaration({

    cargoName: cargo,

    workerName,

    workerRut,

    signedDate,

    responsible,

    signaturePngBytes: params.signaturePngBytes,

  });



  return pdf.save();

}

