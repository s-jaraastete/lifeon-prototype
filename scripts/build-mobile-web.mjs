/**
 * Exporta LifeOn Mobile (Expo Web) a public/mobile para servir en /mobile en Vercel.
 * Uso: node scripts/build-mobile-web.mjs
 */
import { readFileSync, rmSync, existsSync, mkdirSync, writeFileSync } from "fs";
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

if (process.env.MOBILE_AUTO_RELOAD === "1") {
  const indexPath = join(outDir, "index.html");
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, "utf8");
    if (!html.includes("lifeon-mobile-live-reload")) {
      const snippet = `<script id="lifeon-mobile-live-reload">
(function(){var k="lifeon-mobile-bundle",last=sessionStorage.getItem(k);
setInterval(function(){fetch("/mobile/index.html",{cache:"no-store"}).then(function(r){return r.text()}).then(function(t){
var m=t.match(/entry-[a-f0-9]+\\.js/);var h=m?m[0]:String(t.length);
if(last&&last!==h){sessionStorage.setItem(k,h);location.reload();}
if(!last)sessionStorage.setItem(k,h);
});},2500);})();
</script>`;
      html = html.replace("</body>", `${snippet}\n</body>`);
      writeFileSync(indexPath, html);
    }
  }
}

console.log("LifeOn Mobile web listo en public/mobile (URL: /mobile)");
