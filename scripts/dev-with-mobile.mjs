/**
 * Arranca Next.js dev y recompila public/mobile al editar código móvil.
 */
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const isWin = process.platform === "win32";
const npx = isWin ? "npx.cmd" : "npx";

const watch = spawn(process.execPath, [join(root, "scripts", "watch-mobile-web.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

const next = spawn(npx, ["next", "dev"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: isWin,
});

function shutdown(code) {
  watch.kill();
  next.kill();
  process.exit(code ?? 0);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

watch.on("exit", (code) => {
  if (code != null && code !== 0) shutdown(code);
});

next.on("exit", (code) => {
  shutdown(code ?? 0);
});
