export const STORAGE_KEY = "sistema-arriendos-v3-clean";

const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

const isNetlifySiteOrDeploy = (siteName) =>
  hostname === `${siteName}.netlify.app` || hostname.endsWith(`--${siteName}.netlify.app`);

export const IS_PRIVATE_HOST = isNetlifySiteOrDeploy("arriendos-23");
export const IS_DEMO_HOST = isNetlifySiteOrDeploy("sistema-administrativo-arriendos");

const environmentMode = (import.meta.env.VITE_APP_MODE || "").trim().toLowerCase();

// Los dominios oficiales tienen prioridad sobre variables de compilación para
// impedir que los dos sitios queden accidentalmente conectados al mismo modo.
export const APP_MODE = IS_PRIVATE_HOST
  ? "private"
  : IS_DEMO_HOST
    ? "demo"
    : environmentMode || "demo";

export const IS_DEMO = APP_MODE === "demo";
export const IS_PRIVATE = APP_MODE === "private" || APP_MODE === "production";

// La publishable key es pública por diseño. La seguridad de los datos depende
// de Supabase Auth y de Row Level Security, nunca de ocultar esta clave.
const PRIVATE_SUPABASE_URL = "https://bjrwlpmxwpzhpjvfunbi.supabase.co";
const PRIVATE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aPfIuDwem3YnWIDG63oU1w_j8-zJTn3";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || (IS_PRIVATE_HOST ? PRIVATE_SUPABASE_URL : "");

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (IS_PRIVATE_HOST ? PRIVATE_SUPABASE_PUBLISHABLE_KEY : "");

export const PRODUCT_NAME = IS_PRIVATE_HOST
  ? "Arriendos 23"
  : IS_DEMO_HOST
    ? "Sistema Administrativo de Arriendos · Demo"
    : import.meta.env.VITE_PRODUCT_NAME || "Sistema Administrativo de Arriendos";
