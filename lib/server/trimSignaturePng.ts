import "server-only";

import { PNG } from "pngjs";

function isBackground(r: number, g: number, b: number, a: number): boolean {
  if (a < 12) return true;
  if (r > 232 && g > 232 && b > 232) return true;
  return false;
}

/** Recorta márgenes blancos / marco del pad de firma; deja solo el trazo. */
export function trimSignaturePng(input: Uint8Array): Uint8Array {
  try {
    const png = PNG.sync.read(Buffer.from(input));
    const { width, height, data } = png;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (width * y + x) << 2;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (isBackground(r, g, b, a)) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      return input;
    }

    const pad = 4;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const out = new PNG({ width: cropW, height: cropH });

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const src = ((minY + y) * width + (minX + x)) << 2;
        const dst = (cropW * y + x) << 2;
        out.data[dst] = data[src];
        out.data[dst + 1] = data[src + 1];
        out.data[dst + 2] = data[src + 2];
        out.data[dst + 3] = data[src + 3];
      }
    }

    return new Uint8Array(PNG.sync.write(out));
  } catch {
    return input;
  }
}
