import assert from "node:assert/strict";
import { chromium } from "playwright";
import { dragPalette } from "./drag-palette.ts";
const browser = await chromium.launch();
try {
  for (const integration of process.env.EDITOR_INTEGRATION
    ? [process.env.EDITOR_INTEGRATION]
    : ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1100 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    const palette = page.getByRole("complementary", {
      name: "Components",
      exact: true,
    });
    const text = palette.locator('.drag-item[aria-label="text"]');
    await text.click();
    assert.equal(
      await page.locator(".sample-select").count(),
      0,
      "Palette clicks do not add elements",
    );
    await palette.getByRole("searchbox").fill("horizontal");
    assert.equal(await palette.locator(".drag-item").count(), 1);
    await palette.getByText("Horizontal Layout", { exact: true }).waitFor();
    await palette.getByRole("searchbox").fill("");
    await dragPalette(page, "text");
    await page.locator(".sample-select").waitFor();
    await page.locator(".sample-select").click();
    await page.screenshot({ path: `/tmp/editor-selected-${integration}.png` });
    const properties = page.getByRole("complementary", {
      name: "Properties",
      exact: true,
    });
    await properties
      .getByRole("button", { name: "Field", exact: true })
      .waitFor();
    const type = properties.getByRole("button", { name: "Type", exact: true });
    await type.click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: "integer", exact: true })
      .click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: "string", exact: true })
      .click();
    await page.keyboard.press("Escape");
    assert.equal(
      await properties
        .getByRole("button", { name: "Field", exact: true })
        .getAttribute("aria-expanded"),
      "true",
    );
    const defaultField = properties.locator('[data-slot="field"]').filter({
      has: page.getByRole("textbox", { name: "Default value", exact: true }),
    });
    await defaultField.getByRole("textbox").fill("12");
    await defaultField
      .getByRole("button", { name: "Apply value", exact: true })
      .click();
    const tree = page.getByRole("complementary", {
      name: "Schema tree",
      exact: true,
    });
    const row = page.locator(
      '[data-schema-pointer="#/properties/text"] > .schema-tree-row',
    );
    await row.getByRole("button", { name: "Rename text", exact: true }).click();
    assert.equal(await page.getByRole("dialog").count(), 0);
    await row
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("quantity");
    await row
      .getByRole("textbox", { name: "Name", exact: true })
      .press("Enter");
    await tree.getByRole("searchbox").fill("quantity");
    await page
      .locator('[data-schema-pointer="#/properties/quantity"]')
      .waitFor();
    await tree.getByRole("searchbox").fill("missing");
    await tree.getByText("No matching fields.").waitFor();
    await tree.getByRole("searchbox").fill("");
    await page
      .locator(".design-sheet > .design-node > .node-heading .node-select")
      .click();
    await properties
      .getByRole("button", { name: "Layout type", exact: true })
      .click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: "Horizontal Layout", exact: true })
      .click();
    await page
      .locator(".design-sheet > .design-node > .node-heading")
      .getByText("Horizontal Layout", { exact: true })
      .waitFor();
    assert.equal(await page.locator(".sample-select").count(), 1);
    await page
      .locator(
        '[data-schema-pointer="#/properties/quantity"] > .schema-tree-row',
      )
      .getByRole("button", { name: "Delete quantity", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.locator(".sample-select").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page.locator(".sample-select").waitFor();
    await page.locator(".sample-select").click();
    await properties
      .getByRole("button", { name: "Advanced", exact: true })
      .click();
    const examples = properties
      .locator('[data-slot="field"]')
      .filter({
        has: page.getByRole("textbox", { name: "Examples", exact: true }),
      });
    await examples.getByRole("textbox").fill("{}");
    await examples
      .getByRole("button", { name: "Apply value", exact: true })
      .click();
    await examples.getByRole("alert").waitFor();
    await examples.getByRole("textbox").fill("[12]");
    await examples
      .getByRole("button", { name: "Apply value", exact: true })
      .click();
    await examples.getByRole("alert").waitFor({ state: "hidden" });
    await properties
      .getByRole("button", { name: "Advanced", exact: true })
      .click();
    await page.locator("#mode").selectOption("dark");
    await page.locator("#editor-locale").selectOption("bg");
    await page
      .getByRole("complementary", { name: "Свойства", exact: true })
      .getByRole("button", { name: "Поле", exact: true })
      .waitFor();
    await page
      .getByText("Обяснете предназначението на полето и как да се попълни.")
      .waitFor();
    await page.locator("#editor-locale").selectOption("en");
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: `/tmp/editor-improvements-${integration}.png`,
    });
    await page.close();
    console.log(
      `Passed ${integration}: palette drag, filtering, inline rename, type/default edits, layout conversion and cascading deletion/undo.`,
    );
  }
} finally {
  await browser.close();
}
