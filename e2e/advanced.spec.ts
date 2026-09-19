import { test, expect } from "@playwright/test";
import { planningTask, advancedTask } from "../src/advancedTasks";
import { fresh, record } from "../src/progress";
const root = process.env.E2E_PATH || "/";
test("связанные решения и сохранённая ошибка продолжаются после перезагрузки", async ({
  page,
}) => {
  const t = planningTask(),
    p = record(fresh(), t, false, false);
  await page.goto(root);
  await page.evaluate(
    (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
    p,
  );
  await page.reload();
  await page.getByRole("button", { name: "Мой прогресс", exact: true }).click();
  await page.getByRole("button", { name: "Повторить ошибки · 1" }).click();
  await page.getByRole("button", { name: t.answer, exact: true }).click();
  await page
    .getByRole("button", { name: "Проверить ответ", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Следующее решение", exact: true })
    .click();
  await expect(
    page.getByText(t.nextTask!.prompt, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: t.nextTask!.answer, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Проверить ответ", exact: true })
    .click();
  await expect(page.getByRole("status").last()).toContainText("Верно");
  await page
    .getByRole("button", { name: "Закончить повторение", exact: true })
    .click();
  await expect(page.locator(".big-result")).toContainText("2 / 2");
});
test("калькулятор линии и модель ривера меняют результат на 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(root);
  const p = { ...fresh(), reading: { plan: 5, advanced: 10 } };
  await page.evaluate(
    (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
    p,
  );
  await page.reload();
  await page
    .getByRole("button", {
      name: "Открыть: План на несколько улиц",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Ставка 8", exact: true }).click();
  await expect(page.locator(".line-planner [aria-live]")).toContainText("12");
  await expect(page.locator(".line-planner [aria-live]")).toContainText("50%");
  await expect(page.locator(".dealer-marker image")).toBeAttached();
  await page
    .locator(".line-planner")
    .screenshot({ path: "test-results/planner-320.png" });
  await page.reload();
  await page
    .getByRole("button", {
      name: "Открыть: Продвинутая стратегия",
      exact: true,
    })
    .click();
  await page.getByLabel("Размер в модели ривера").selectOption("4");
  await expect(page.locator(".river-lab dd")).toHaveText([
    "100%",
    "60%",
    "40%",
  ]);
  expect(
    await page
      .locator("main")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  await page
    .locator(".river-lab")
    .screenshot({ path: "test-results/river-lab-320.png" });
});
test("равноценные действия принимаются в офлайн-повторении", async ({
  page,
  context,
}) => {
  let t = advancedTask("action");
  while (!t.acceptedAnswers) t = advancedTask("action");
  await page.goto(root);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.evaluate(
    (p) => localStorage.setItem("river.progress.v1", JSON.stringify(p)),
    record(fresh(), t, false, false),
  );
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Мой прогресс", exact: true }).click();
  await page.getByRole("button", { name: "Повторить ошибки · 1" }).click();
  await page.getByRole("button", { name: "Чек", exact: true }).click();
  await page
    .getByRole("button", { name: "Проверить ответ", exact: true })
    .click();
  await expect(page.getByRole("status").last()).toContainText("Верно");
  await expect(page.locator(".choices button.correct")).toHaveCount(2);
});

test("смешанная практика сохраняет все навыки после первой подборки", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = window.Worker;
    (window as any).trainingMessages = [];
    window.Worker = class extends Original {
      postMessage(message: any, options?: any) {
        (window as any).trainingMessages.push(message);
        super.postMessage(message, options);
      }
    };
  });
  await page.goto(root);
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /Смешанная тренировка/ }).click();
  for (let i = 0; i < 12; i++) {
    await expect(
      page.getByRole("button", { name: "Проверить ответ", exact: true }),
    ).toBeVisible();
    if (await page.locator(".select-cards button").count()) {
      for (let j = 0; j < 5; j++)
        await page.locator(".select-cards button").nth(j).click();
    } else await page.locator(".choices button").first().click();
    await page
      .getByRole("button", { name: "Проверить ответ", exact: true })
      .click();
    await page
      .getByRole("button", { name: /^Следующ(ая задача|ее решение)$/ })
      .click();
    if (await page.evaluate(() => (window as any).trainingMessages.length >= 2))
      break;
  }
  const messages = await page.evaluate(() => (window as any).trainingMessages);
  expect(messages.length).toBeGreaterThanOrEqual(2);
  expect(messages[1].skills.slice().sort()).toEqual(
    messages[0].skills.slice().sort(),
  );
  expect(messages[1].skills.length).toBe(17);
});
