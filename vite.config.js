import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "use-resilient-entrypoint",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          return html.replace("/src/main.jsx", "/src/entry.jsx");
        },
      },
    },
  ],
});
