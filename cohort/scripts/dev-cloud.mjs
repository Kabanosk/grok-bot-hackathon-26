import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
let app;
let shuttingDown = false;
const tunnel = spawn(
  "cloudflared",
  ["tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:5174"],
  { stdio: ["ignore", "pipe", "pipe"] },
);
const stop = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  app?.kill("SIGTERM");
  tunnel.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
tunnel.on("error", (error) => {
  console.error(
    `Could not start cloudflared: ${error.message}. Install cloudflared or use npm run dev with a public callback origin.`,
  );
  process.exitCode = 1;
  stop();
});
const onOutput = (chunk) => {
  const text = chunk.toString();
  const url = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
  if (url && !app) {
    console.log(`Cloud Bot callback relay: ${url}`);
    console.log(
      "Only authenticated run callbacks are exposed; the workspace stays on localhost.",
    );
    app = spawn(
      process.execPath,
      [
        fileURLToPath(
          new URL("../../node_modules/vite/bin/vite.js", import.meta.url),
        ),
        "--host",
        "127.0.0.1",
      ],
      {
        cwd: appDirectory,
        env: { ...process.env, COHORT_PUBLIC_URL: url },
        stdio: "inherit",
      },
    );
    app.on("exit", (code) => {
      process.exitCode = code ?? 0;
      stop();
    });
  }
  if (/ERR|failed/i.test(text)) process.stderr.write(text);
};
tunnel.stdout.on("data", onOutput);
tunnel.stderr.on("data", onOutput);
tunnel.on("exit", (code) => {
  if (!shuttingDown) {
    console.error("The cloud callback tunnel stopped.");
    process.exitCode = code ?? 1;
    stop();
  }
});
setTimeout(() => {
  if (!app) {
    console.error(
      "No public callback URL was assigned. Check your internet connection or configure your own HTTPS callback origin.",
    );
    process.exitCode = 1;
    stop();
  }
}, 30_000).unref();
