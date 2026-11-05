import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createApi } from "./server/api.ts";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { marketPlugin } from "./server/market";

function attachApi(
  server: {
    middlewares: { use: (middleware: ReturnType<typeof createApi>) => void };
    httpServer: {
      once: (event: string, listener: () => void) => unknown;
    } | null;
  },
  mode: string,
) {
  const api = createApi({
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  } as Record<string, string>);
  server.middlewares.use(api);
  const relay = createServer((req, res) => {
    if (!req.url?.startsWith("/hooks/jobs/")) {
      res.writeHead(404);
      res.end();
      return;
    }
    void api(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  relay.on("error", (error) =>
    console.error("Cohort callback relay:", error.message),
  );
  relay.listen(5174, "127.0.0.1");
  server.httpServer?.once("close", () => relay.close());
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    marketPlugin(resolve(__dirname, ".local/market.json")),
    {
      name: "cohort-research-api",
      configureServer(server) {
        attachApi(server, mode);
      },
      configurePreviewServer(server) {
        attachApi(server, mode);
      },
    },
  ],
  server: { port: 5173, strictPort: true },
}));
