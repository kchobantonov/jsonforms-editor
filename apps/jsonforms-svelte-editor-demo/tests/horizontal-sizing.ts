import assert from "node:assert/strict";
import { chromium, type Locator } from "playwright";
import { selectSource } from "./source-selection.ts";
const browser = await chromium.launch();
async function expectFraction(item: Locator, fraction: number) {
  await item.scrollIntoViewIfNeeded();
  const measured = await item.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    parent: element.parentElement!.getBoundingClientRect().width,
  }));
  assert.ok(
    Math.abs(measured.width / measured.parent - fraction) < 0.01,
    JSON.stringify(measured),
  );
}
try {
  for (const integration of ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    await page.locator("#example").selectOption("horizontal-sizing");
    const canvasItem = page
      .locator(".drag-zone.horizontal > .drag-item")
      .first();
    await expectFraction(canvasItem, 0.25);
    await page.evaluate(() => {
      window.changes = [];
      document
        .querySelector("#editor-host")!
        .addEventListener("document-change", (event) => {
          window.changes.push((event as CustomEvent).detail);
        });
    });
    const resize = canvasItem.getByRole("slider");
    async function dragColumns(delta: number, cancel = false) {
      await canvasItem.scrollIntoViewIfNeeded();
      await canvasItem.hover();
      const handle = (await resize.boundingBox())!;
      const item = (await canvasItem.boundingBox())!;
      const columns = Number(await canvasItem.getAttribute("data-columns"));
      const x = handle.x + handle.width / 2;
      const y = handle.y + Math.min(25, handle.height / 2);
      const before = await page.evaluate(() => window.changes.length);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + (item.width / columns) * delta, y, {
        steps: 12,
      });
      assert.equal(
        await page.evaluate(() => window.changes.length),
        before,
        "Resize preview does not create history entries",
      );
      assert.equal(
        Number(await canvasItem.getAttribute("data-columns")),
        Math.min(16, Math.max(2, columns + delta)),
      );
      if (cancel) await page.keyboard.press("Escape");
      await page.mouse.up();
      await page.waitForFunction(
        ({ count, cancel }) =>
          window.changes.length === count + (cancel ? 0 : 1),
        { count: before, cancel },
      );
    }
    await dragColumns(2);
    assert.equal(await canvasItem.getAttribute("data-columns"), "6");
    const resizeProperties = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    await resizeProperties
      .getByRole("button", { name: "Layout", exact: true })
      .click();
    assert.equal(
      (
        await resizeProperties
          .getByRole("button", { name: "Columns", exact: true })
          .textContent()
      )?.trim(),
      "6",
    );
    await page.locator("#undo").click();
    await expectFraction(canvasItem, 0.25);
    await page.locator("#redo").click();
    assert.equal(await canvasItem.getAttribute("data-columns"), "6");
    await page.locator("#undo").click();
    await dragColumns(4, true);
    await expectFraction(canvasItem, 0.25);
    for (const [key, expected] of [
      ["ArrowRight", "5"],
      ["Home", "2"],
      ["End", "16"],
    ]) {
      await resize.focus();
      await resize.press(key);
      assert.equal(await canvasItem.getAttribute("data-columns"), expected);
      await page.locator("#undo").click();
      await expectFraction(canvasItem, 0.25);
    }
    assert.equal(
      await page
        .locator(
          ".drag-zone:not(.horizontal) > .drag-item > .column-resize-handle",
        )
        .count(),
      0,
    );
    await page
      .getByRole("button", {
        name: "Select #/properties/firstName",
        exact: true,
      })
      .first()
      .click();
    const properties = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    await properties
      .getByRole("button", { name: "Layout", exact: true })
      .click();
    await properties
      .getByRole("button", { name: "Columns", exact: true })
      .click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: "8", exact: true })
      .click();
    await page.waitForFunction(() => {
      const root =
        document.querySelector("jsonforms-svelte-editor")?.shadowRoot ??
        document;
      return (
        root
          .querySelector(".drag-zone.horizontal > .drag-item")
          ?.getAttribute("data-columns") === "8"
      );
    });
    await expectFraction(canvasItem, 0.5);
    await page.locator("#undo").click();
    await expectFraction(canvasItem, 0.25);
    await page.locator("#redo").click();
    await expectFraction(canvasItem, 0.5);
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    const preview = page.getByRole("region", {
      name: "Form Preview",
      exact: true,
    });
    await expectFraction(preview.locator("[data-columns]").first(), 0.5);

    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await selectSource(page, "uischema");
    // The source region is the only visible Monaco in JSON Model mode.
    const source = page.getByRole("region", {
      name: "Model source",
      exact: true,
    });
    const editor = source.locator(".monaco-editor");
    await editor.click({ position: { x: 80, y: 25 } });
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+C");
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const ui = JSON.parse(text);
    assert.equal(ui.elements[1].elements[0].elements[0].options.columns, 8);
    ui.elements[1].elements[0].elements[0].options.columns = 2;
    await page.evaluate(
      (text) => navigator.clipboard.writeText(text),
      JSON.stringify(ui, null, 2),
    );
    await page.keyboard.press("Control+V");
    await source.getByRole("button", { name: "Revert", exact: true }).click();
    await editor.click({ position: { x: 80, y: 25 } });
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Control+V");
    await source.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByRole("button", { name: "JSON Model", exact: true }).click();
    await expectFraction(canvasItem, 0.125);
    await expectFraction(preview.locator("[data-columns]").first(), 0.125);
    assert.deepEqual(errors, []);
    console.log(
      `Passed ${integration}: Pointer/keyboard resizing, cancellation, atomic undo, Columns inspector, preview and JSON Apply/Revert.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
