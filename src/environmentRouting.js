const normalizeHostname = (hostname = "") => hostname.trim().toLowerCase();
const normalizeMode = (mode = "") => mode.trim().toLowerCase();

const PRIVATE_NETLIFY_SITES = ["arrendia", "arriendos-23"];
const DEMO_NETLIFY_SITES = ["crohnoz-property", "sistema-administrativo-arriendos"];

export function isNetlifySiteOrDeploy(hostname, siteName) {
  const normalizedHostname = normalizeHostname(hostname);
  return (
    normalizedHostname === `${siteName}.netlify.app` ||
    normalizedHostname.endsWith(`--${siteName}.netlify.app`)
  );
}

function matchesAnyNetlifySite(hostname, siteNames) {
  return siteNames.some((siteName) => isNetlifySiteOrDeploy(hostname, siteName));
}

export function isPrivateHostname(hostname) {
  return matchesAnyNetlifySite(hostname, PRIVATE_NETLIFY_SITES);
}

export function isDemoHostname(hostname) {
  return matchesAnyNetlifySite(hostname, DEMO_NETLIFY_SITES);
}

export function resolveAppMode(hostname, environmentMode = "") {
  if (isPrivateHostname(hostname)) return "private";
  if (isDemoHostname(hostname)) return "demo";

  return normalizeMode(environmentMode) || "demo";
}

export function resolveProductName(hostname, configuredName = "") {
  if (isPrivateHostname(hostname)) return "Arrendía";
  if (isDemoHostname(hostname)) return "Crohnoz Property · Demo";

  return configuredName || "Sistema Administrativo de Arriendos";
}
