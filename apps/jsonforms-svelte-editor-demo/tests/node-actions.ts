import { dragPalette } from "./drag-palette.ts";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch();
try {
  for (const integration of ["webcomponent", "native"]) {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1100 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    assert.equal(await page.locator(".design-node").count(), 0, "missing UI schema has a blank definition");
    await page.locator(".empty-design-sheet").click();
    assert.equal(await page.getByRole("heading", { name: "Vertical Layout properties", exact: true }).count(), 0);
    await dragPalette(page, "text");
    assert.equal(await page.locator(".design-node").count(), 1, "first control is the UI root");
    assert.equal(await page.locator(".design-sheet [data-drop-target]").count(), 0, "a root control cannot receive additional components");
    await page.locator(".sample-select").click();
    await page.getByRole("button", { name: "Remove #/properties/text", exact: true }).click();
    await dragPalette(page, "VerticalLayout");
    assert.equal(await page.locator(".design-node").count(), 1, "first layout has no implicit wrapper");
    for (const name of ["checkbox", "number", "textarea", "number", "number"]) {
      const before = await page.locator(".design-node").count();
      await dragPalette(page, name);
      await page.locator(".design-node").nth(before).waitFor();
      assert.equal(
        await page.locator(".design-node.selected").count(),
        0,
        "dropping a field clears selection until a node is explicitly selected",
      );
    }
    const numberNode = page
      .locator(".design-node")
      .filter({
        has: page.getByRole("button", {
          name: "Select #/properties/number",
          exact: true,
        }),
      })
      .last();
    // The frame is part of the selection target, not only its nested buttons.
    await numberNode.click({ position: { x: 3, y: 3 } });
    assert.equal(await page.locator(".design-node.selected").count(), 1);
    const properties = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    await properties
      .getByRole("heading", { name: "Control properties", exact: true })
      .waitFor();
    await properties
      .getByRole("textbox", { name: "Label", exact: true })
      .waitFor();
    await page
      .locator(".node-select")
      .filter({ hasText: "Vertical Layout" })
      .first()
      .click();
    await properties
      .getByRole("heading", { name: "Vertical Layout properties", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Select #/properties/number", exact: true })
      .click();
    await properties
      .getByRole("heading", { name: "Control properties", exact: true })
      .waitFor();
    assert.equal(await page.locator(".design-node.selected").count(), 1);
    await page.getByRole("button", { name: "New form", exact: true }).click();
    await page
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await page.locator("#example").selectOption("main");
    const select = page.getByRole("button", {
      name: "Select #/properties/firstName",
      exact: true,
    });
    const remove = page.locator('[aria-label="Remove #/properties/firstName"]');
    await select.waitFor();
    assert.equal(await remove.isVisible(), false);
    await select.hover();
    assert.equal(
      await remove.isVisible(),
      false,
      "hover alone does not reveal delete",
    );
    await select.focus();
    assert.equal(
      await remove.isVisible(),
      false,
      "focus alone does not reveal delete",
    );
    await select.click();
    await remove.waitFor({ state: "visible" });
    assert.equal(await remove.isVisible(), true);
    await remove.click();
    assert.equal(await select.count(), 0);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await select.waitFor();
    const layout = page
      .locator(".node-select")
      .filter({ hasText: "Horizontal Layout" })
      .first();
    await layout.click();
    await page
      .getByRole("button", { name: "Remove HorizontalLayout", exact: true })
      .click();
    assert.equal(await select.count(), 0);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await select.waitFor();
    // Removing the root switches to generated UI without discarding schema/data.
    const root = page.locator(".design-sheet > .design-node");
    await root.locator(":scope > .node-heading .node-select").click();
    await root.locator(":scope > .node-heading .canvas-node-actions button").click();
    assert.equal(await page.locator(".runtime-sample").count(), 0);
    assert.equal(await page.locator(".design-node").count(), 0, "removing the root leaves no placeholder layout");
    assert.equal(await root.locator(":scope > .node-heading .canvas-node-actions").count(), 0);
    await page.getByRole("button", { name: "Form Preview", exact: true }).click();
    await page.locator(".full-preview-workspace input").first().waitFor();
    await page.getByRole("radio", { name: "Design", exact: true }).click();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await select.waitFor();
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(await page.locator(".runtime-sample").count(), 0);
    assert.equal(await page.locator(".design-node").count(), 0, "removing the root leaves no placeholder layout");
    await page.locator("#example").selectOption("data-only-preview");
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await root.locator(":scope > .node-heading .node-select").click();
    await root.locator(":scope > .node-heading .canvas-node-actions button").click();
    await page.getByRole("button", { name: "Form Preview", exact: true }).click();
    const generated = page.locator(".full-preview-workspace");
    await generated.getByLabel(/^Name/).waitFor();
    assert.equal(await generated.getByLabel(/^Name/).inputValue(), "Ada");
    assert.equal(await generated.getByLabel(/^Age/).inputValue(), "37");
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Passed ${integration}: selected-only delete and host undo of controls/layouts.`,
    );
  }
} finally {
  await browser.close();
}
