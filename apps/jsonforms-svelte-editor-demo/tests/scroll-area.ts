import { dragPalette } from "./drag-palette.ts";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 800 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    const palette = page.getByRole("complementary", {
      name: "Components",
      exact: true,
    });
    await palette.waitFor();
    const area = page.locator(".pane-scroll").filter({ has: palette });
    assert.equal(
      await page.locator('.pane-scroll[data-slot="scroll-area"]').count(),
      3,
    );
    assert.equal(
      await area.evaluate((el) => getComputedStyle(el).overflowY),
      "hidden",
    );
    const viewport = area.locator('[data-slot="scroll-area-viewport"]');
    assert.ok(
      await viewport.evaluate((el) => el.scrollHeight > el.clientHeight),
    );
    assert.equal(
      await viewport.evaluate((el) => getComputedStyle(el).scrollbarWidth),
      "none",
      "the viewport must hide native scrollbars",
    );
    await viewport.hover();
    await page.mouse.wheel(0, 400);
    await page.waitForFunction(
      (el) => el && el.scrollTop > 0,
      await viewport.elementHandle(),
    );
    await area.locator('[data-slot="scroll-area-thumb"]').first().waitFor();
    await page.locator("#example").selectOption("main");
    async function assertScrolls(selector: string) {
      const pane = page.locator(selector);
      await pane.waitFor();
      assert.ok(await pane.evaluate(el => el.scrollHeight > el.clientHeight), `${selector} overflows`);
      await pane.hover();
      await page.mouse.wheel(0, 10000);
      await page.waitForFunction(el => el && el.scrollTop > 0, await pane.elementHandle());
      await pane.evaluate(el => { el.scrollTop = el.scrollHeight; });
      assert.ok(await pane.evaluate(el => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 2), `${selector} reaches the bottom`);
    }
    await assertScrolls(".designer-pane");
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    await assertScrolls(".resizable-workspace .preview-content");
    const inlinePreview = page.locator(".resizable-workspace .preview-content");
    const field = inlinePreview.locator('input[type="text"]').first();
    await field.fill("Preview persists");
    await field.blur();
    await page.locator(".monaco-editor .view-lines").filter({ hasText: "Preview persists" }).waitFor();
    await page.getByRole("button", { name: "Form Preview", exact: true }).click();
    const expanded = page.locator(".full-preview-workspace");
    await expanded.waitFor();
    assert.equal(await page.locator(".designer-pane").isVisible(), false);
    assert.ok((await expanded.boundingBox())!.width > 1200, "preview uses the full editor width");
    assert.equal(await expanded.locator('input[type="text"]').first().inputValue(), "Preview persists");
    await expanded.locator('input[type="text"]').first().fill("Edited expanded");
    await expanded.locator('input[type="text"]').first().blur();
    await page.waitForFunction(el => (el as HTMLInputElement | null)?.value === "Edited expanded", await field.elementHandle());
    await page.getByRole("button", { name: "Form Preview", exact: true }).click();
    await inlinePreview.waitFor();
    assert.equal(await field.inputValue(), "Edited expanded");
    await page.getByRole("radio", { name: "Design", exact: true }).click();
    await dragPalette(page, "Spacer");
    await page.locator(".node-select").filter({ hasText: "Spacer" }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
      `Passed ${integration}: pane scrolling, full-width preview, preserved preview data and palette selection.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
