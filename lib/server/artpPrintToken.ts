import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "lifeon-artp-print"
  );
}

export function createArtpPrintToken(versionId: string): string {
  const exp = Date.now() + 2 * 60 * 1000;
  const payload = `${versionId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyArtpPrintToken(versionId: string, token: string): boolean {
  const [payloadPart, sig] = token.split(".");
  if (!payloadPart || !sig) return false;
  let payload = "";
  try {
    payload = Buffer.from(payloadPart, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const splitAt = payload.lastIndexOf(".");
  if (splitAt < 0) return false;
  const id = payload.slice(0, splitAt);
  const exp = Number(payload.slice(splitAt + 1));
  if (id !== versionId || !Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
