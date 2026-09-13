import { spawn } from "node:child_process";
import { createServer } from "node:net";
const pages = process.argv.includes("--pages");
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const url = `http://127.0.0.1:${port}${pages ? "/jsonforms-editor/" : "/"}`;
const server = spawn(
  "pnpm",
  [
    "--filter",
    "jsonforms-svelte-editor-demo",
    "exec",
    "vite",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
    "--base",
    pages ? "/jsonforms-editor/" : "/",
  ],
  { stdio: "inherit", detached: true },
);
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error("Preview server exited");
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Preview server did not start");
  const args = pages
    ? [
        "--filter",
        "jsonforms-svelte-editor-demo",
        "exec",
        "node",
        "--experimental-strip-types",
        "tests/npm-consumer.ts",
      ]
    : ["test:browser"];
  const test = spawn("pnpm", args, {
    stdio: "inherit",
    env: { ...process.env, EDITOR_DEMO_URL: url },
  });
  const code = await new Promise((resolve, reject) => {
    test.on("error", reject);
    test.on("exit", resolve);
  });
  if (code !== 0) throw new Error(`Demo tests exited with ${code}`);
} finally {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
}
