import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const source = fileURLToPath(new URL("../", import.meta.url));
const artifacts = path.resolve(
  process.argv[2] ?? "/tmp/jsonforms-release-packs",
);
const overrides = JSON.parse(
  readFileSync(path.join(artifacts, "overrides.json"), "utf8"),
);
const workspace = mkdtempSync(path.join(tmpdir(), "jsonforms-editor-packed-"));
cpSync(source, workspace, {
  recursive: true,
  filter: (file) =>
    !path
      .relative(source, file)
      .split(path.sep)
      .some((part) =>
        ["node_modules", ".git", "dist", ".svelte-kit"].includes(part),
      ),
});
const config = path.join(workspace, "pnpm-workspace.yaml");
writeFileSync(
  config,
  readFileSync(config, "utf8").replace(
    "overrides:\n",
    "overrides:\n" +
      Object.entries(overrides)
        .map(
          ([name, value]) =>
            `  ${JSON.stringify(name)}: ${JSON.stringify(value)}\n`,
        )
        .join(""),
  ),
);
console.log(`Isolated packed consumer: ${workspace}`);
const run = (args, env = {}) => {
  const result = spawnSync("pnpm", args, {
    cwd: workspace,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0)
    throw new Error(`pnpm ${args.join(" ")} failed (${result.status})`);
};
run(["install", "--no-frozen-lockfile"]);
run(["install", "--frozen-lockfile", "--offline"]);
run(["build"]);
run(["check"]);
run(["test"]);
async function browserTest(args) {
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const url = `http://127.0.0.1:${port}`;
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
    ],
    { cwd: workspace, stdio: "inherit", detached: true },
  );
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
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
    run(args, { EDITOR_DEMO_URL: url });
  } finally {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  }
}
await browserTest([
  "--filter",
  "jsonforms-svelte-editor-demo",
  "exec",
  "node",
  "--experimental-strip-types",
  "tests/npm-consumer.ts",
]);
run(["--filter", "jsonforms-svelte-editor-demo", "build", "--mode", "test"]);
await browserTest(["test:browser"]);
console.log(
  `Packed consumer checks passed. Artifacts retained at ${workspace}`,
);
