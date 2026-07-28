import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const assetsDirectory = path.resolve("dist/assets");
const entries = await readdir(assetsDirectory, { withFileTypes: true });
const cssFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
  .map((entry) => path.join(assetsDirectory, entry.name));

if (!cssFiles.length) {
  throw new Error("El build privado no generó archivos CSS.");
}

const compiledCss = (await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))).join("\n");
const requiredMarkers = [
  "arrendia-mark.svg",
  "arrendia-mark-enter",
  "arrendia-logo-pulse",
  ".runtime-shell .login-page",
];

const missingMarkers = requiredMarkers.filter((marker) => !compiledCss.includes(marker));

if (missingMarkers.length) {
  throw new Error(`El tema de Arrendía no quedó incluido en el build: ${missingMarkers.join(", ")}`);
}

if (compiledCss.includes("arrendia-login-hero.svg")) {
  throw new Error("El build todavía incluye el panel gráfico antiguo del login.");
}

console.log("Tema limpio, logo y animaciones de Arrendía presentes en el build privado.");