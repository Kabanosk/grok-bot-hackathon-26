import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { swarmPlugin } from "./server/swarm";
import { marketPlugin } from "./server/market";

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, resolve(__dirname, ".."), ""),
    ...loadEnv(mode, __dirname, ""),
    ...process.env,
  };
  return {
    plugins: [react(), swarmPlugin(env), marketPlugin(resolve(__dirname, ".local/market.json"))],
    server: { port: 5173, strictPort: true },
  };
});
