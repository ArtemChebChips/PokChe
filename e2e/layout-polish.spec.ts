import { test, expect } from "./fixtures";
import { combinationTask } from "../src/combinationTasks";
import { handFlowTask } from "../src/handFlowTasks";
import { fresh } from "../src/progress";
const root = process.env.E2E_PATH || "/";
for (const width of [320, 390]) {
  test(`единые карты, отступы и матрица на ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto(root);
    for (const skill of ["combination", "best", "winner"] as const) {
      const task = combinationTask(skill);
      await page.evaluate(
        (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
        { ...fresh(), mistakes: [task] },
      );
      await page.reload();
      await page
        .getByRole("button", { name: "Тренажёры", exact: true })
        .click();
      await page.getByRole("button", { name: /Повторить ошибки/ }).click();
      const sizes = await page.locator(".table .card").evaluateAll((els) =>
        els.map((e) => ({
          w: e.getBoundingClientRect().width,
          h: e.getBoundingClientRect().height,
        })),
      );
      expect(sizes.length).toBeGreaterThanOrEqual(7);
      expect(
        Math.max(...sizes.map((s) => s.w)) - Math.min(...sizes.map((s) => s.w)),
      ).toBeLessThan(1);
      expect(
        Math.max(...sizes.map((s) => s.h)) - Math.min(...sizes.map((s) => s.h)),
      ).toBeLessThan(1);
      await page.screenshot({
        path: `test-results/equal-${skill}-${width}.png`,
      });
    }
    const task = handFlowTask("call");
    await page.evaluate(
      (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
      { ...fresh(), mistakes: [task] },
    );
    await page.reload();
    await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
    await page.getByRole("button", { name: /Повторить ошибки/ }).click();
    await page.getByRole("button", { name: task.answer, exact: true }).click();
    await page.getByRole("button", { name: "Проверить ответ" }).click();
    await page.locator("main").evaluate((e) => (e.scrollTop = e.scrollHeight));
    const gap = await page
      .getByRole("button", { name: "Закончить тренировку", exact: true })
      .evaluate(
        (e) =>
          e.closest("main")!.getBoundingClientRect().bottom -
          e.getBoundingClientRect().bottom,
      );
    expect(gap).toBeGreaterThanOrEqual(32);
    await page.screenshot({ path: `test-results/bottom-gap-${width}.png` });
    await page.goto(root);
    await page
      .getByRole("button", { name: "Открыть: Стартовые руки", exact: true })
      .click();
    await expect(page.locator(".chapter-tabs .chapter-number")).toHaveCount(3);
    await page
      .getByRole("button", { name: "Глава 3: Матрица и диапазон" })
      .click();
    await expect(page.locator(".mini-matrix > span")).toHaveCount(169);
    await page.getByRole("button", { name: "AKo", exact: true }).click();
    await expect(page.locator(".matrix-selected")).toHaveText("AKo");
    await page.locator(".lesson-matrix").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/lesson04-${width}.png` });
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
    ).toBe(true);
    await page.getByRole("button", { name: "Уроки", exact: true }).click();
    await page
      .getByRole("button", { name: "Открыть: Как идёт раздача", exact: true })
      .click();
    await expect(page.locator(".seat-bet")).toHaveCount(2);
    await expect(page.locator(".dealer-marker")).toHaveCount(1);
    await expect(page.locator(".chapter-tabs .chapter-number")).toHaveCount(3);
    // Центральная полоса карт не пересекается с кругами мест и ставками.
    await page.getByRole("button", { name: "Глава 2: Общие карты" }).click();
    await page.getByRole("button", { name: "Далее", exact: true }).click();
    expect(
      await page.locator(".position-table").evaluate((el) => {
        const board = el.querySelector(".scene-board")!.getBoundingClientRect();
        return [
          ...el.querySelectorAll(
            ".seat-marker circle, .seat-bet > .chip-art, .seat-bet > text, .pot-marker > .chip-art, .pot-marker > text, .dealer-marker > .chip-art",
          ),
        ].every((e) => {
          // SVG считает невидимые поля PNG в boundingClientRect. Проверяем видимую область viewBox.
          let r = e.getBoundingClientRect();
          if (e instanceof SVGSVGElement) {
            const v = e.viewBox.baseVal,
              m = e.getScreenCTM()!;
            const a = new DOMPoint(v.x, v.y).matrixTransform(m);
            const b = new DOMPoint(
              v.x + v.width,
              v.y + v.height,
            ).matrixTransform(m);
            r = new DOMRect(a.x, a.y, b.x - a.x, b.y - a.y);
          }
          return (
            r.right <= board.left ||
            r.left >= board.right ||
            r.bottom <= board.top ||
            r.top >= board.bottom
          );
        });
      }),
    ).toBe(true);
  });
}
