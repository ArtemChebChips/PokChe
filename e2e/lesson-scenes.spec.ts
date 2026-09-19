import { test, expect } from "@playwright/test";
import { handFlowTask } from "../src/handFlowTasks";
import { fresh } from "../src/progress";
const path = process.env.E2E_PATH || "/";
for (const width of [320, 390]) {
  test(`карты, стол и новые уроки на ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(path);
    await page
      .getByRole("button", { name: "Открыть: Комбинации", exact: true })
      .click();
    for (let i = 0; i < 6; i++)
      await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Флеш", exact: true }),
    ).toBeVisible();
    await page.locator(".sava-wide").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/flush-fixed-${width}.png` });
    expect(
      await page.locator(".sava-wide .card-face").evaluateAll((els) =>
        els.every((el) => {
          const svg = el as SVGSVGElement,
            m = svg.getScreenCTM()!;
          return Math.abs(m.a - m.d) < 0.001;
        }),
      ),
    ).toBe(true);
    // Масти не пересекаются: проверяем прямоугольники внутри каждого числового рисунка.
    expect(
      await page.locator(".card-face").evaluateAll((els) =>
        els.every((el) => {
          const pips = [...el.querySelectorAll(".card-pip")].map((p) =>
            p.getBoundingClientRect(),
          );
          return pips.every((a, i) =>
            pips
              .slice(i + 1)
              .every(
                (b) =>
                  Math.min(a.right, b.right) - Math.max(a.left, b.left) < 0.5 ||
                  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) < 0.5,
              ),
          );
        }),
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Уроки", exact: true }).click();
    await page
      .getByRole("button", { name: "Открыть: Как идёт раздача", exact: true })
      .click();
    await expect(page.locator(".position-table .table-art")).toHaveAttribute(
      "href",
      /poker-table-v2.png/,
    );
    await page.locator(".position-table").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/table-${width}.png` });
    await page.getByRole("button", { name: "Глава 2: Общие карты" }).click();
    await expect(page.locator(".street-new")).toHaveCount(3);
    await page.screenshot({ path: `test-results/flop-${width}.png` });
    await page.getByRole("button", { name: "Далее", exact: true }).click();
    await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(page.locator(".street-new")).toHaveCount(1);
    await expect(page.locator(".street-new .card")).toHaveAttribute(
      "data-card",
      "Kd",
    );
    await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(page.locator(".street-new .card")).toHaveAttribute(
      "data-card",
      "2h",
    );
    await page.getByRole("button", { name: "Уроки", exact: true }).click();
    await page
      .getByRole("button", { name: "Открыть: Позиции и стеки", exact: true })
      .click();
    await expect(page.locator(".stack-example")).toBeVisible();
    await page
      .getByRole("button", { name: "Глава 3: Стек относительно банка" })
      .click();
    await page.screenshot({ path: `test-results/spr-${width}.png` });
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
    ).toBe(true);
    for (const family of ["call", "showdown", "blind"]) {
      const task = handFlowTask(family);
      await page.evaluate(
        (progress) =>
          localStorage.setItem("river.progress.v1", JSON.stringify(progress)),
        { ...fresh(), mistakes: [task] },
      );
      await page.reload();
      await page
        .getByRole("button", { name: "Тренажёры", exact: true })
        .click();
      await page.getByRole("button", { name: /Повторить ошибки/ }).click();
      await expect(page.locator(".situation-table")).toBeVisible();
      await page.screenshot({
        path: `test-results/scene-${family}-${width}.png`,
      });
      expect(
        await page
          .locator("main")
          .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      ).toBe(true);
      await page
        .getByRole("button", { name: task.answer, exact: true })
        .click();
      await page.getByRole("button", { name: "Проверить ответ" }).click();
      await expect(page.getByRole("status")).toContainText("Верно");
    }
  });
}
