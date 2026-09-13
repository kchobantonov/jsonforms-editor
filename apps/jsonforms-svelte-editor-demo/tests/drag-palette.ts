import type { Page } from "playwright";
/** Exercise the same pointer drag used by a person; palette clicks never create nodes. */
export async function dragPalette(page: Page, preset: string) {
  const item = page
    .getByRole("complementary", { name: "Components", exact: true })
    .locator(`.drag-item[aria-label="${preset}"]`);
  await item.scrollIntoViewIfNeeded();
  const zone = page
    .locator(".design-sheet > .design-node > .drag-zone, .empty-design-sheet > .drag-zone")
    .first();
  await page.locator(".designer-pane").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  const source = await item.boundingBox();
  const target = await zone.boundingBox();
  const pane = await page.locator(".designer-pane").boundingBox();
  if (!source || !target || !pane)
    throw new Error("Missing drag source or target");
  // The first item's heading belongs to this zone, while lower points can
  // intersect a nested layout once a long form is clipped by the viewport.
  const targetY = target.y + Math.min(8, target.height / 2);
  if (targetY >= pane.y + pane.height)
    throw new Error("Root drop target is outside the designer viewport");
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source.x + source.width / 2 + 12,
    source.y + source.height / 2,
    { steps: 4 },
  );
  await page.mouse.move(target.x + Math.min(40, target.width / 2), targetY, {
    steps: 20,
  });
  await page.waitForTimeout(120);
  await page.mouse.up();
}
