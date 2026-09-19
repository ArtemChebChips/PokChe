import { test, expect } from "@playwright/test";
const root = process.env.E2E_PATH || "/";
async function noOverflow(page: any) {
  expect(
    await page.evaluate(() =>
      [
        document.documentElement,
        document.body,
        document.querySelector("main")!,
      ].every((e) => e.scrollWidth <= e.clientWidth + 1),
    ),
  ).toBe(true);
}
test("главы, пример Иваныча и десять комбинаций на узком экране", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(root);
    await page
      .getByRole("button", { name: "Открыть: Комбинации", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Глава 1: Виды комбинаций" })
      .click();
    await expect(
      page.locator('.chapter button[aria-current="step"]'),
    ).toHaveText("1");
    const hands = page.locator(".hand-example");
    await expect(hands.nth(0).locator(".card")).toHaveCount(5);
    await expect(hands.nth(1).locator(".card")).toHaveCount(2);
    await page.screenshot({ path: "test-results/chapters-" + width + ".png" });
    for (let i = 0; i < 6; i++)
      await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(page.locator(".sava-wide")).toContainText("Побеждает игрок 1");
    await page.locator(".sava-wide").scrollIntoViewIfNeeded();
    await noOverflow(page);
    await expect(page.locator(".sava-wide .card-face image")).toHaveCount(1);
    expect(
      await page.locator(".sava-wide .card-face image").evaluateAll((els) =>
        els.every((e) => {
          const r = e.getBoundingClientRect(),
            c = e.closest(".card")!.getBoundingClientRect();
          return r.width <= c.width + 1 && r.height <= c.height + 1;
        }),
      ),
    ).toBe(true);
    await page.screenshot({ path: "test-results/flush-" + width + ".png" });
    await page.getByRole("button", { name: "Глава 3: Кикеры и делёж" }).click();
    await expect(
      page.locator('.chapter button[aria-current="step"]'),
    ).toHaveText("3");
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(page.locator(".ranking-list li")).toHaveCount(10);
    await expect(page.locator(".ranking-list .card")).toHaveCount(50);
    await noOverflow(page);
    await page.screenshot({ path: "test-results/ranking-" + width + ".png" });
  }
});
test("следующий урок показывает позиции и улицы, затем запускает практику", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(root);
  await page
    .getByRole("button", { name: "Открыть: Как идёт раздача", exact: true })
    .click();
  await expect(page.locator(".position-table svg")).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: "test-results/flow-table-320.png" });
  await page.getByRole("button", { name: "Глава 2: Общие карты" }).click();
  await expect(page.locator(".street-board .card")).toHaveCount(3);
  await expect(page.locator(".empty-card")).toHaveCount(2);
  await noOverflow(page);
  await page.screenshot({ path: "test-results/flow-flop-320.png" });
  await page
    .getByRole("button", { name: "Глава 3: Действия и результат" })
    .click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Далее", exact: true }).click();
  await page.getByRole("button", { name: "Завершить чтение" }).click();
  await page
    .getByRole("button", { name: "Тренироваться", exact: true })
    .click();
  await expect(page.locator(".task-title")).toHaveText("Ход раздачи");
  await page.locator(".choices button").first().click();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.getByRole("button", { name: "Закончить тренировку" }).click();
  await page.reload();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("river.progress.v1")!).lessons.includes(
        "actions",
      ),
    ),
  ).toBe(true);
});
test("пять общих и две личные карты выбираются совместно и ошибка переживает перезагрузку", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(root);
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /03 Лучшая пятёрка/ }).click();
  await expect(page.locator(".board .select-cards button")).toHaveCount(5);
  await expect(page.locator(".hand .select-cards button")).toHaveCount(2);
  for (let i = 0; i < 4; i++)
    await page.locator(".board .select-cards button").nth(i).click();
  for (let i = 0; i < 2; i++)
    await page.locator(".hand .select-cards button").nth(i).click();
  await expect(
    page.getByRole("button", { name: "Проверить ответ" }),
  ).toBeEnabled();
  await noOverflow(page);
  await page.screenshot({ path: "test-results/select-board-320.png" });
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Не удалось прочитать сохранение.", { exact: false }),
  ).toHaveCount(0);
});
