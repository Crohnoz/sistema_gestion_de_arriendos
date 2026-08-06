import assert from "node:assert/strict";
import { resolveAppMode, resolveProductName } from "../src/environmentRouting.js";

const cases = [
  ["arrendia.netlify.app", "private", "demo"],
  ["main--arrendia.netlify.app", "private", "demo"],
  ["arriendos-23.netlify.app", "demo", "private"],
  ["6a682a6d65fe0000080f078c--arriendos-23.netlify.app", "demo", "private"],
  ["crohnoz-property.netlify.app", "private", "demo"],
  ["main--crohnoz-property.netlify.app", "private", "demo"],
  ["sistema-administrativo-arriendos.netlify.app", "private", "demo"],
  ["main--sistema-administrativo-arriendos.netlify.app", "private", "demo"],
  ["sitio-renombrado.netlify.app", "private", "private"],
  ["localhost", "private", "private"],
  ["localhost", "", "demo"],
];

for (const [hostname, configuredMode, expectedMode] of cases) {
  assert.equal(
    resolveAppMode(hostname, configuredMode),
    expectedMode,
    `${hostname} debe resolverse como ${expectedMode}`,
  );
}

assert.equal(resolveProductName("arrendia.netlify.app"), "Arrendía · Demo");
assert.equal(resolveProductName("arriendos-23.netlify.app"), "Arrendía");
assert.equal(resolveProductName("crohnoz-property.netlify.app"), "Crohnoz Property · Demo");
assert.equal(
  resolveProductName("sistema-administrativo-arriendos.netlify.app"),
  "Crohnoz Property · Demo",
);
assert.equal(
  resolveProductName("sitio-renombrado.netlify.app", "Nombre configurado"),
  "Nombre configurado",
);

console.log("Environment routing validated successfully.");
