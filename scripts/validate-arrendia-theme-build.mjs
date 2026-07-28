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
  "arrendia-login-hero.svg",
  "arrendia-mark-enter",
  "arrendia-hero-panel-enter",
];

const missingMarkers = requiredMarkers.filter((marker) => !compiledCss.includes(marker));

if (missingMarkers.length) {
  throw new Error(`El tema de Arrendía no quedó incluido en el build: ${missingMarkers.join(", ")}`);
}

console.log("Tema visual y animaciones de Arrendía presentes en el build privado.");