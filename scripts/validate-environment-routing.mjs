import assert from "node:assert/strict";
import { resolveAppMode, resolveProductName } from "../src/environmentRouting.js";

const cases = [
  ["arriendos-23.netlify.app", "", "private"],
  ["6a682a6d65fe0000080f078c--arriendos-23.netlify.app", "demo", "private"],
  ["sistema-administrativo-arriendos.netlify.app", "private", "demo"],
  ["main--sistema-administrativo-arriendos.netlify.app", "private", "demo"],
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

assert.equal(resolveProductName("arriendos-23.netlify.app"), "Arriendos 23");
assert.equal(
  resolveProductName("sistema-administrativo-arriendos.netlify.app"),
  "Sistema Administrativo de Arriendos · Demo",
);

console.log("Environment routing validated successfully.");
