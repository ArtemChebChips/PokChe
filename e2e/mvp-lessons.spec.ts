import { test, expect } from "@playwright/test";
import { lessons } from "../src/content";
const root = process.env.E2E_PATH || "/";
for (const id of ["board", "bets", "postflop", "plan", "adjust", "advanced"])
  for (const width of [320, 390])
    test(`урок ${id} и практика на ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      await page.goto(root);
      const l = lessons.find((l) => l.id === id)!;
      await page
        .getByRole("button", { name: "Открыть: " + l.title, exact: true })
        .click();
      for (let i = 0; i < l.slides.length; i++) {
        await expect(
          page.getByRole("heading", { name: l.slides[i].title, exact: true }),
        ).toBeVisible();
        expect(
          await page
            .locator("main")
            .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
        ).toBe(true);
        if (i === 10)
          await page.screenshot({
            path: `test-results/lesson-${id}-${width}.png`,
          });
        await page
          .getByRole("button", {
            name: i === l.slides.length - 1 ? "Завершить чтение" : "Далее",
            exact: true,
          })
          .click();
      }
      await page
        .getByRole("button", { name: "Тренироваться", exact: true })
        .click();
      await expect(page.locator(".choices button").first()).toBeVisible();
      await page.locator(".choices button").first().click();
      await page
        .getByRole("button", { name: "Проверить ответ", exact: true })
        .click();
      await expect(page.getByRole("status").last()).toBeVisible();
    });
