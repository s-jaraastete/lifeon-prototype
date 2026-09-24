/**
 * Exporta LifeOn Mobile (Expo Web) a public/mobile para servir en /mobile en Vercel.
 * Uso: node scripts/build-mobile-web.mjs
 */
import { readFileSync, rmSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mobileDir = join(root, "mobile");
const outDir = join(root, "public", "mobile");

function loadEnvLocal() {
  for (const envPath of [join(root, ".env.local"), join(mobileDir, ".env")]) {
    if (!existsSync(envPath)) continue;
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnvLocal();

if (!process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
}
if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });

console.log("Building Expo web → public/mobile …");

const npxCmd = process.platform === "win32" ? "npx" : "npx";
const result = spawnSync(
  npxCmd,
  ["expo", "export", "--platform", "web", "--output-dir", outDir],
  {
    cwd: mobileDir,
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("LifeOn Mobile web listo en public/mobile (URL: /mobile)");
