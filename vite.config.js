import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },

      manifest: {
        name: "FitTrackr",
        short_name: "FitTrackr",
        description: "Personal workout and fitness tracker",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/logo.png",
            sizes: "1024x1024",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});