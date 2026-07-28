const normalizeHostname = (hostname = "") => hostname.trim().toLowerCase();
const normalizeMode = (mode = "") => mode.trim().toLowerCase();

export function isNetlifySiteOrDeploy(hostname, siteName) {
  const normalizedHostname = normalizeHostname(hostname);
  return (
    normalizedHostname === `${siteName}.netlify.app` ||
    normalizedHostname.endsWith(`--${siteName}.netlify.app`)
  );
}

export function resolveAppMode(hostname, environmentMode = "") {
  if (isNetlifySiteOrDeploy(hostname, "arriendos-23")) return "private";
  if (isNetlifySiteOrDeploy(hostname, "sistema-administrativo-arriendos")) return "demo";

  return normalizeMode(environmentMode) || "demo";
}

export function resolveProductName(hostname, configuredName = "") {
  if (isNetlifySiteOrDeploy(hostname, "arriendos-23")) return "Arriendos 23";
  if (isNetlifySiteOrDeploy(hostname, "sistema-administrativo-arriendos")) {
    return "Sistema Administrativo de Arriendos · Demo";
  }

  return configuredName || "Sistema Administrativo de Arriendos";
}
