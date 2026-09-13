import type { Page } from "playwright";
export async function selectSource(page: Page, name: string) {
  await page.getByLabel("Source document", { exact: true }).click();
  await page
    .getByRole("listbox")
    .getByRole("option", { name, exact: true })
    .click();
}
