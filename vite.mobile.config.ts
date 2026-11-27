import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

export default defineConfig(({ mode }) => {
  const api = loadEnv(mode, process.cwd()).VITE_TRAVEL_ORIGIN;
  if (api && (!/^https:\/\//.test(api) || new URL(api).origin !== api))
    throw new Error("VITE_TRAVEL_ORIGIN must be a single HTTPS origin");
  return {
    publicDir: mode === "development" ? "public" : false,
    plugins: [
      react(),
      tailwind(),
      {
        name: "release-artwork",
        apply: "build",
        generateBundle() {
          for (const fileName of [
            "favicon.png",
            "apple-touch-icon.png",
            "brand/giza.jpg",
            "brand/splash/cross-world-intro.mp4",
            "brand/splash/cross-world-still.webp",
          ]) {
            this.emitFile({
              type: "asset",
              fileName,
              source: readFileSync(new NodeURL("./public/" + fileName, import.meta.url)),
            });
          }
        },
      },
      {
        name: "travel-content-policy",
        transformIndexHtml(html) {
          const policy = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'" + (api ? " " + api : ""),
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'self'",
          ].join("; ");
          return mode === "development"
            ? html
            : {
                html,
                tags: [
                  {
                    tag: "meta",
                    attrs: { "http-equiv": "Content-Security-Policy", content: policy },
                    injectTo: "head-prepend",
                  },
                ],
              };
        },
      },
    ],
    resolve: { alias: { "@": fileURLToPath(new NodeURL("./src", import.meta.url)) } },
    server: { host: "127.0.0.1", port: 5173, proxy: { "/api": "http://localhost:8000" } },
    build: { sourcemap: false },
  };
});
