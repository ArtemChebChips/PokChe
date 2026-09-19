import { lessons } from "../src/content";
import { test, expect } from "@playwright/test";
import { fresh } from "../src/progress";
const root = process.env.E2E_PATH || "/";
for (const width of [320, 390]) {
  test(`справка вместо урока и сохранение старого прогресса на ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(root);
    await page.evaluate(
      (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
      {
        ...fresh(),
        format: "tournament",
        lessons: ["formats", "cards"],
        lastLesson: "formats",
      },
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Открыть: Кэш|Повторить: Кэш/ }),
    ).toHaveCount(0);
    const sources = await page
      .locator(".route-row .topic-icon img")
      .evaluateAll((els) => els.map((el) => (el as HTMLImageElement).src));
    expect(new Set(sources).size).toBe(sources.length);
    await page.getByRole("button", { name: "Настройки и установка" }).click();
    await page
      .getByRole("button", { name: "Кэш и турниры: в чём разница" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Кэш и турниры", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Турниры", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: `test-results/formats-${width}.png` });
    await page.getByRole("button", { name: "Кэш", exact: true }).click();
    await page.getByRole("button", { name: "Настройки", exact: true }).click();
    await page.getByRole("button", { name: "Назад", exact: true }).click();
    await page
      .getByRole("button", { name: "Мой прогресс", exact: true })
      .click();
    await expect(page.getByText(`1/${lessons.filter(l=>l.ready).length}`, { exact: true })).toBeVisible();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("river.progress.v1")!),
    );
    expect(saved.format).toBe("cash");
    expect(saved.lessons).toEqual(["formats", "cards"]);
  });
}
