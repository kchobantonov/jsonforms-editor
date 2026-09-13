import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

test("host provides every UI component imported by the installed renderer", () => {
  const local = new URL(
    "../../jsonforms-svelte-editor-webcomponent/src/components/ui/",
    import.meta.url,
  );
  const renderer = new URL(
    "../node_modules/@chobantonov/jsonforms-svelte-shadcn/dist/",
    import.meta.url,
  );
  let imports = 0;
  for (const entry of readdirSync(renderer, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(svelte|js|ts)$/.test(entry.name)) continue;
    const source = readFileSync(join(entry.parentPath, entry.name), "utf8");
    for (const match of source.matchAll(
      /@jsonforms-svelte-shadcn-ui\/([a-z0-9-]+)/g,
    )) {
      imports++;
      assert.ok(
        existsSync(new URL(`${match[1]}/index.ts`, local)),
        `Missing host component: ${match[1]}`,
      );
    }
  }
  assert.ok(imports > 0, "must inspect actual packed renderer imports");
});

test("editor interactive controls use shared shadcn primitives", () => {
  const root = new URL("../src/lib/editor/", import.meta.url);
  for (const entry of readdirSync(root, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !entry.name.endsWith(".svelte")) continue;
    const path = join(entry.parentPath, entry.name);
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /<(?:button|select|input|textarea)(?:\s|>)/,
      `${path}: a native-control exception requires documented owner awareness`,
    );
  }
});
