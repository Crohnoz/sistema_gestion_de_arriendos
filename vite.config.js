import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "use-resilient-entrypoint",
      transformIndexHtml(html) {
        return html.replace("/src/main.jsx", "/src/entry.jsx");
      },
    },
  ],
});
