export const STORAGE_KEY = "sistema-arriendos-v3-clean";

export const APP_MODE = (import.meta.env.VITE_APP_MODE || "demo").toLowerCase();
export const IS_DEMO = APP_MODE === "demo";
export const IS_PRIVATE = APP_MODE === "private" || APP_MODE === "production";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const PRODUCT_NAME =
  import.meta.env.VITE_PRODUCT_NAME || "Sistema Administrativo de Arriendos";
