import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

// Dev proxy: MEXC contract API (Binance is geo-restricted from Replit servers;
// Railway uses Binance via server.js — prices are equivalent between exchanges).
// MEXC symbol map: some tokens use non-standard names on MEXC futures.
const MEXC_SYMBOL: Record<string, string> = {
  SNXUSDT:  "SNX_USDT",
  FILUSDT:  "FILECOIN_USDT",   // MEXC lists FIL as FILECOIN_USDT
  NEARUSDT: "NEAR_USDT",
};
function toMexcSymbol(raw: string): string {
  return MEXC_SYMBOL[raw] ?? raw.replace(/USDT$/, "_USDT");
}

const mexcProxyPlugin = {
  name: "mexc-proxy",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(
      "/proxy/mexc/kline",
      async (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
        try {
          const p        = new URLSearchParams((req.url || "").split("?")[1] || "");
          const symbol   = toMexcSymbol(p.get("symbol") || "");
          const interval = p.get("interval") || "Min1";
          const limit    = p.get("limit") || "25";
          const r = await fetch(
            `https://contract.mexc.com/api/v1/contract/kline/${symbol}?interval=${interval}&limit=${limit}`,
            { signal: AbortSignal.timeout(10000) },
          );
          const data = await r.json();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, message: String(e) }));
        }
      },
    );

    server.middlewares.use(
      "/proxy/mexc/depth",
      async (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
        try {
          const p      = new URLSearchParams((req.url || "").split("?")[1] || "");
          const symbol = toMexcSymbol(p.get("symbol") || "");
          const limit  = p.get("limit") || "10";
          const r = await fetch(
            `https://contract.mexc.com/api/v1/contract/depth/${symbol}?limit=${limit}`,
            { signal: AbortSignal.timeout(10000) },
          );
          const data = await r.json();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, message: String(e) }));
        }
      },
    );
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    mexcProxyPlugin,
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
