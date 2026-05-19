import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      "Cache-Control": "no-store",
    },
  },
  optimizeDeps: {
    force: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    // Optimized chunking for 400+ concurrent users
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor core — cached across all pages
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/framer-motion/") || id.includes("node_modules/lucide-react/") || id.includes("node_modules/sonner/") || id.includes("node_modules/class-variance-authority/") || id.includes("node_modules/clsx/") || id.includes("node_modules/tailwind-merge/")) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/@tanstack/react-query/")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/i18next/") || id.includes("node_modules/react-i18next/")) {
            return "vendor-i18n";
          }
          if (id.includes("node_modules/date-fns/")) {
            return "vendor-date";
          }
          if (id.includes("node_modules/recharts/")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@supabase/supabase-js/")) {
            return "vendor-supabase";
          }
        },
        // Content-hash for long-term caching
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 600,
  },
}));
