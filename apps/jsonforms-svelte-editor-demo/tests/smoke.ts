import { dragPalette } from "./drag-palette.ts";
import { selectSource } from "./source-selection.ts";
import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
const browser = await chromium.launch({ headless: true });
let page!: Page;
try {
  page = await browser.newPage({
    viewport: { width: 1500, height: 1100 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
  await page
    .getByRole("heading", { name: "Form Definition", exact: true })
    .waitFor();
  await page
    .locator("#integration")
    .selectOption(process.env.EDITOR_INTEGRATION ?? "webcomponent");
  await page.locator("#example").selectOption("main");
  assert.ok((await page.locator("#example option").count()) > 10);
  await page.evaluate(() => {
    window.changes = [];
    document
      .querySelector("#editor-host")!
      .addEventListener("document-change", (event) =>
        window.changes.push(
          (event as CustomEvent<(typeof window.changes)[number]>).detail,
        ),
      );
  });
  await dragPalette(page, "textarea");
  await page.waitForFunction(() =>
    window.changes
      .at(-1)
      ?.document.uischema.elements?.some(
        (node) => node.scope === "#/properties/notes",
      ),
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.changes
          .at(-1)!
          .document.uischema.elements!.find(
            (node) => node.scope === "#/properties/notes",
          )!.options!.multi,
    ),
    true,
  );
  await page
    .getByRole("button", { name: "Select #/properties/notes", exact: true })
    .click();
  const label = page
    .getByRole("complementary", { name: "Properties" })
    .getByRole("textbox", { name: "Label", exact: true });
  const inspector = page.getByRole("complementary", { name: "Properties" });
  assert.equal(
    await inspector.locator("jsonforms-svelte-shadcn").count(),
    0,
    "inspector uses native JSON Forms",
  );
  assert.equal(
    await label.evaluate(
      (el) => el.getRootNode() === el.closest(".editor")!.getRootNode(),
    ),
    true,
    "inspector shares the editor DOM/theme boundary",
  );
  await label.fill("Notes edited");
  await label.press("Tab");
  await page.waitForFunction(
    () =>
      window.changes
        .at(-1)!
        .document.uischema.elements!.find(
          (node) => node.scope === "#/properties/notes",
        )!.label === "Notes edited",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "JSON Model", exact: true }).click();
  await page.locator(".monaco-editor textarea").waitFor();
  await selectSource(page, "schema");
  await page.locator(".monaco-editor").click({ position: { x: 140, y: 30 } });
  await page.keyboard.press("Control+Home");
  await page.keyboard.press("Control+a");
  await page.evaluate(
    (text) => navigator.clipboard.writeText(text),
    '{"type":"object","properties":{"fromSource":{"type":"string"}}}',
  );
  await page.keyboard.press("Control+v");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.waitForFunction(
    () => window.changes.at(-1)!.document.schema.properties.fromSource,
  );
  await page.getByRole("radio", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: "fromSource", exact: true }).waitFor();
  await page.getByRole("button", { name: "JSON Model", exact: true }).click();
  // Invalid drafts are retained and prevent visual mutation.
  await page.locator(".monaco-editor").click({ position: { x: 140, y: 30 } });
  await page.keyboard.press("Control+a");
  await page.evaluate(() => navigator.clipboard.writeText("{invalid"));
  await page.keyboard.press("Control+v");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .locator('[aria-label="Components"].palette-locked')
    .waitFor({ state: "attached" });
  assert.ok(
    (await page
      .locator('[aria-label="Components"] .palette-row[aria-disabled="true"]')
      .count()) > 0,
  );
  await page.locator("#example").selectOption("combinator-properties");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.locator(".category-tab").first().waitFor();
  await page.locator(".category-tab").last().click();
  await dragPalette(page, "Group");
  await page.screenshot({
    path: "/tmp/editor-working-slice.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "Passed: example loading, real samples, insertion, inspector edit, undo/redo, Monaco Apply/Revert, draft lock, and tabs.",
  );
} catch (error) {
  await page
    ?.screenshot({ path: "/tmp/editor-smoke-failure.png", fullPage: true })
    .catch(() => {});
  await page
    ?.context()
    .tracing.stop({ path: "/tmp/editor-smoke-trace.zip" })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
}
