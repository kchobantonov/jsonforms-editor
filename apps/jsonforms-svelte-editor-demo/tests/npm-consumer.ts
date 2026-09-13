import assert from "node:assert/strict";
import { chromium } from "playwright";
import { getExamples } from "@jsonforms/examples";
const browser = await chromium.launch();
try {
  for (const integration of ["native", "webcomponent"]) {
    const page = await browser.newPage({
      viewport: { width: 1500, height: 1100 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.EDITOR_DEMO_URL ?? "http://127.0.0.1:4178");
    await page.locator("#integration").selectOption(integration);
    const expected = getExamples()
      .filter((example) => example.schema && example.uischema)
      .map((example) => example.name)
      .sort();
    const actual = await page
      .locator("#example option")
      .evaluateAll((options) =>
        options
          .map((option) => (option as HTMLOptionElement).value)
          .filter((value) => value !== "new")
          .sort(),
      );
    assert.deepEqual(
      actual,
      [...new Set(expected)],
      "production examples come only from @jsonforms/examples",
    );
    const example = expected.find((name) => name === "person") ?? expected[0];
    await page.locator("#example").selectOption(example);
    await page
      .getByRole("heading", { name: "Form Definition", exact: true })
      .waitFor();
    await page.getByRole("radio", { name: "Validate", exact: true }).click();
    const form = page
      .getByRole("region", { name: "Form Preview", exact: true })
      .locator("jsonforms-svelte-shadcn");
    await form.waitFor();
    await form.locator("input").first().waitFor({ state: "visible" });
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("Published-package native and web-component consumer smoke passed");
