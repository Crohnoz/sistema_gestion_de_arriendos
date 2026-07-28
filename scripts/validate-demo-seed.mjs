import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = new URL("../src/demoSeed.js", import.meta.url);
const temporaryPath = join(tmpdir(), `arriendos-demo-seed-${process.pid}-${Date.now()}.mjs`);

try {
  const source = await readFile(sourcePath, "utf8");
  await writeFile(temporaryPath, source, "utf8");

  const module = await import(`${pathToFileURL(temporaryPath).href}?v=${Date.now()}`);
  const { demoSeed, createEmptyWorkspace } = module;

  if (!demoSeed || demoSeed.departamentos?.length !== 23) {
    throw new Error("La demo debe contener exactamente 23 departamentos.");
  }

  if (!demoSeed.boletas?.every((boleta) => typeof boleta.periodo === "string")) {
    throw new Error("Todas las boletas demo deben incluir un periodo válido.");
  }

  const emptyWorkspace = createEmptyWorkspace();
  if (emptyWorkspace.departamentos?.length !== 23) {
    throw new Error("El espacio privado inicial debe contener 23 departamentos.");
  }

  console.log("Demo seed validado correctamente.");
} finally {
  await unlink(temporaryPath).catch(() => {});
}
