/**
 * Observa cambios en mobile/ y reexporta a public/mobile para /mobile en Next dev.
 */
import { spawn, spawnSync } from "child_process";
import { watch } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mobileRoot = join(root, "mobile");

const WATCH_DIRS = [
  join(mobileRoot, "app"),
  join(mobileRoot, "components"),
  join(mobileRoot, "hooks"),
  join(mobileRoot, "services"),
  join(mobileRoot, "utils"),
  join(mobileRoot, "context"),
  join(mobileRoot, "theme"),
];

let debounce = null;
let building = false;
let queued = false;

function runBuild(reason) {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  console.log(`\n[mobile] Recompilando (${reason})…`);
  const result = spawnSync(process.execPath, [join(root, "scripts", "build-mobile-web.mjs")], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, MOBILE_AUTO_RELOAD: "1" },
  });
  building = false;
  if (result.status !== 0) {
    console.warn("[mobile] Build falló; se reintentará en el próximo cambio.");
  } else {
    console.log("[mobile] Listo → http://localhost:3000/mobile (recarga automática si la pestaña está abierta)\n");
  }
  if (queued) {
    queued = false;
    scheduleBuild("cambios acumulados");
  }
}

function scheduleBuild(reason) {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => runBuild(reason), 900);
}

console.log("[mobile] Build inicial…");
runBuild("inicio");

for (const dir of WATCH_DIRS) {
  try {
    watch(dir, { recursive: true }, (_event, filename) => {
      if (!filename || filename.includes("node_modules")) return;
      if (!/\.(tsx?|jsx?|json)$/.test(filename)) return;
      scheduleBuild(filename);
    });
    console.log(`[mobile] Observando ${dir.replace(root, ".")}`);
  } catch (e) {
    console.warn(`[mobile] No se pudo observar ${dir}:`, e);
  }
}

console.log("[mobile] Watcher activo (sin Expo). Edita mobile/ y recarga /mobile.\n");
