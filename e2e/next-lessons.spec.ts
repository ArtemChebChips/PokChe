import { test, expect } from "./fixtures";
import { lessons } from "../src/content";
import { preflopTask } from "../src/preflopTasks";
import { oddsTask } from "../src/mathTasks";
import { fresh } from "../src/progress";
const root = process.env.E2E_PATH || "/";
for (const width of [320, 390])
  test(`уроки 05/06, практика и офлайн на ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto(root);
    for (const id of ["preflop", "math"]) {
      const lesson = lessons.find((l) => l.id === id)!;
      await page
        .getByRole("button", { name: "Открыть: " + lesson.title, exact: true })
        .click();
      await expect(page.locator(".chapter-tabs .chapter-number")).toHaveCount(
        3,
      );
      for (let i = 0; i < lesson.slides.length; i++) {
        await expect(
          page.getByRole("heading", {
            name: lesson.slides[i].title,
            exact: true,
          }),
        ).toBeVisible();
        expect(
          await page
            .locator("main")
            .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
        ).toBe(true);
        if (lesson.slides[i].scene)
          await expect(page.locator(".situation-table")).toHaveCount(1);
        if ([0, 3, 7, 8].includes(i)) {
          if (lesson.slides[i].scene)
            await page.locator(".situation-table").scrollIntoViewIfNeeded();
          await page.screenshot({
            path: `test-results/lesson-${id}-${i}-${width}.png`,
          });
        }
        await page
          .getByRole("button", {
            name: i === lesson.slides.length - 1 ? "Завершить чтение" : "Далее",
            exact: true,
          })
          .click();
      }
      await expect(
        page.getByRole("heading", { name: "Урок пройден", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "К списку уроков", exact: true })
        .click();
    }
    for (const task of [preflopTask("min-raise"), oddsTask("decision")]) {
      await page.evaluate(
        (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
        { ...fresh(), mistakes: [task] },
      );
      await page.reload();
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await context.setOffline(true);
      await page
        .getByRole("button", { name: "Тренажёры", exact: true })
        .click();
      await page.getByRole("button", { name: /Повторить ошибки/ }).click();
      await expect(page.locator(".situation-table")).toBeVisible();
      await page.screenshot({
        path: `test-results/practice-${task.skill}-${width}.png`,
      });
      await page
        .getByRole("button", { name: task.answer, exact: true })
        .click();
      await page
        .getByRole("button", { name: "Проверить ответ", exact: true })
        .click();
      await expect(page.getByRole("status").last()).toContainText("Верно");
      await context.setOffline(false);
    }
  });
