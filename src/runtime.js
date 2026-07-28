import {
  isDemoHostname,
  isPrivateHostname,
  resolveAppMode,
  resolveProductName,
} from "./environmentRouting";

export const STORAGE_KEY = "sistema-arriendos-v3-clean";

const hostname = typeof window !== "undefined" ? window.location.hostname : "";
const environmentMode = import.meta.env.VITE_APP_MODE || "";

export const IS_PRIVATE_HOST = isPrivateHostname(hostname);
export const IS_DEMO_HOST = isDemoHostname(hostname);

// Los dominios oficiales tienen prioridad sobre variables de compilación para
// impedir que los dos sitios queden accidentalmente conectados al mismo modo.
export const APP_MODE = resolveAppMode(hostname, environmentMode);
export const IS_DEMO = APP_MODE === "demo";
export const IS_PRIVATE = APP_MODE === "private" || APP_MODE === "production";

// La publishable key es pública por diseño. La seguridad de los datos depende
// de Supabase Auth y de Row Level Security, nunca de ocultar esta clave.
const PRIVATE_SUPABASE_URL = "https://bjrwlpmxwpzhpjvfunbi.supabase.co";
const PRIVATE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aPfIuDwem3YnWIDG63oU1w_j8-zJTn3";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || (IS_PRIVATE ? PRIVATE_SUPABASE_URL : "");

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (IS_PRIVATE ? PRIVATE_SUPABASE_PUBLISHABLE_KEY : "");

export const PRODUCT_NAME = resolveProductName(
  hostname,
  import.meta.env.VITE_PRODUCT_NAME || "",
);
