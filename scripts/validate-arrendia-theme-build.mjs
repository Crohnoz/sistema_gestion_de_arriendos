import { access, readFile } from "node:fs/promises";
import path from "node:path";

const indexPath = path.resolve("dist/index.html");
const themePath = path.resolve("dist/arrendia-login-runtime.css");
const markPath = path.resolve("dist/arrendia-mark.svg");

await Promise.all([access(indexPath), access(themePath), access(markPath)]);

const [indexHtml, themeCss] = await Promise.all([
  readFile(indexPath, "utf8"),
  readFile(themePath, "utf8"),
]);

const requiredIndexMarkers = [
  "arrendia-login-runtime.css",
];

const requiredThemeMarkers = [
  "body .login-page .login-icon",
  "arrendia-mark.svg?v=4",
  "arrendia-mark-enter",
  "arrendia-mark-float",
  "arrendia-logo-pulse",
  "display:none!important",
];

const missingIndexMarkers = requiredIndexMarkers.filter((marker) => !indexHtml.includes(marker));
const missingThemeMarkers = requiredThemeMarkers.filter((marker) => !themeCss.includes(marker));

if (missingIndexMarkers.length || missingThemeMarkers.length) {
  throw new Error(
    `El acceso de Arrendía no quedó correctamente conectado: ${[
      ...missingIndexMarkers,
      ...missingThemeMarkers,
    ].join(", ")}`,
  );
}

if (themeCss.includes(".runtime-shell .login-page") || themeCss.includes("arrendia-login-hero.svg")) {
  throw new Error("El tema del login todavía depende de una estructura inexistente o del panel gráfico antiguo.");
}

console.log("Logo real, animaciones y selectores del acceso de Arrendía validados en el build.");