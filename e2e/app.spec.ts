import { test, expect } from "@playwright/test";

test("урок → задачи → разбор → перезагрузка → повторение ошибок → офлайн", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.E2E_PATH || "/");
  await expect(
    page.getByRole("heading", { name: "Учимся играть", exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page.locator(".choices")).toHaveCount(0);
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Далее", exact: true }).click();
  await page.getByRole("button", { name: "Завершить чтение" }).click();
  await page
    .getByRole("button", { name: "Тренироваться", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Старшинство карт" }),
  ).toBeVisible();
  for (let i = 0; i < 5; i++) {
    const displayed = await page
      .locator(".table .card")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-card")!));
    const rank = (v: string) =>
      "23456789TJQKA".indexOf(v.startsWith("10") ? "T" : v[0]);
    const x = rank(displayed[0]),
      y = rank(displayed[1]);
    const correct = x === y ? "Равны" : x > y ? "Левая" : "Правая";
    const answer =
      i === 0 ? (correct === "Левая" ? "Правая" : "Левая") : correct;
    await page.getByRole("button", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: "Проверить ответ" }).click();
    await expect(page.getByRole("status")).toContainText(
      i === 0 ? "Ошибка" : "Верно",
    );
    if (i === 0)
      await page.screenshot({
        path: "test-results/review-mobile.png",
        fullPage: true,
      });
    await page
      .getByRole("button", {
        name: i === 4 ? "Закончить тренировку" : "Следующая задача",
      })
      .click();
  }
  await expect(page.locator(".big-result")).toContainText("4 / 5");
  await page.reload();
  await page.getByRole("button", { name: "Мой прогресс", exact: true }).click();
  await expect(page.locator(".stats")).toContainText("5");
  await expect(page.locator(".progress-card")).toContainText("1/9");
  await page.getByRole("button", { name: "Повторить ошибки · 1" }).click();
  await expect(
    page.getByRole("heading", { name: "Старшинство карт" }),
  ).toBeVisible();
  const repeated = await page
    .locator(".table .card")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-card")!));
  const rank = (v: string) =>
    "23456789TJQKA".indexOf(v.startsWith("10") ? "T" : v[0]);
  const a = rank(repeated[0]),
    b = rank(repeated[1]);
  await page
    .getByRole("button", {
      name: a === b ? "Равны" : a > b ? "Левая" : "Правая",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Верно");
  await page.getByRole("button", { name: "Закончить тренировку" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("river.progress.v1")!).mistakes.length,
    ),
  ).toBe(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("Без интернета · прогресс на устройстве"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /Оцени эквити Конкретная/ }).click();
  await expect(
    page.getByRole("heading", { name: "Оцени эквити" }),
  ).toBeVisible();
  await page.locator(".choices button").first().click();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Точное эквити");
  expect(
    await page
      .locator(".sava-panel img")
      .evaluateAll((els) =>
        els.every(
          (e) =>
            (e as HTMLImageElement).complete &&
            (e as HTMLImageElement).naturalWidth > 0,
        ),
      ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("матрица доступна через крупный селектор, узкий экран без горизонтальной прокрутки", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(process.env.E2E_PATH || "/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /Матрица стартовых рук/ }).click();
  await page.getByLabel("Выбрать руку крупным списком").selectOption("AKs");
  await expect(page.locator(".cell-description")).toContainText("AKs");
  await page.getByRole("button", { name: "Добавить в набор" }).click();
  await expect(
    page.getByRole("button", { name: "AKs", exact: true }),
  ).toHaveClass(/marked/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/matrix-320.png",
    fullPage: true,
  });
});

test("лучшая пятёрка: выбор карт и понятный разбор", async ({ page }) => {
  await page.goto(process.env.E2E_PATH || "/");
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /03 Лучшая пятёрка/ }).click();
  for (let i = 0; i < 5; i++)
    await page.locator(".select-cards button").nth(i).click();
  await expect(
    page.getByText("Выбрано 5 из 5.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Лучшая комбинация");
});

test("повреждённое сохранение не перезаписывается, корректный импорт восстанавливает запись", async ({
  page,
}) => {
  await page.goto(process.env.E2E_PATH || "/");
  await page.evaluate(() =>
    localStorage.setItem("river.progress.v1", "damaged-json"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Не удалось прочитать");
  expect(
    await page.evaluate(() => localStorage.getItem("river.progress.v1")),
  ).toBe("damaged-json");
  await page.getByRole("button", { name: "Настройки и установка" }).click();
  const restored = {
    version: 1,
    lessons: ["cards"],
    attempts: [],
    mistakes: [],
    format: "tournament",
    days: [],
  };
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(restored)),
  });
  await expect(page.getByRole("status")).toContainText(
    "Резервная копия восстановлена",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("river.progress.v1")!).lessons,
    ),
  ).toEqual(["cards"]);
});

test("закладка чтения и прокрутка списка сохраняются, прочитанное доступно повторно", async ({
  page,
}) => {
  await page.goto(process.env.E2E_PATH || "/");
  const nav = await page.locator(".bottom-nav").boundingBox();
  await page.locator(".lesson-scroll").evaluate((e) => {
    e.scrollTop = 200;
  });
  expect(await page.locator(".bottom-nav").boundingBox()).toEqual(nav);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Продолжить урок", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Карты по старшинству" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("river.progress.v1")!).attempts.length,
    ),
  ).toBe(0);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Далее", exact: true }).click();
  await page.getByRole("button", { name: "Завершить чтение" }).click();
  await page
    .getByRole("button", { name: "К списку уроков", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Повторить: Знакомство с картами",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Четыре масти" }),
  ).toBeVisible();
});
test("похожая задача продолжает текущую тренировку", async ({ page }) => {
  await page.goto(process.env.E2E_PATH || "/");
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /01 Старшинство карт/ }).click();
  const displayed = await page
    .locator(".table .card")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-card")!));
  const a = "23456789TJQKA".indexOf(displayed[0][0]),
    b = "23456789TJQKA".indexOf(displayed[1][0]);
  await page
    .getByRole("button", { name: a === b ? "Левая" : "Равны", exact: true })
    .click();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await page.getByRole("button", { name: "Решить похожую задачу" }).click();
  await expect(page.locator(".session-heading")).toContainText("Задание 2");
  const next = await page
    .locator(".table .card")
    .evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-card")![0]).sort(),
    );
  expect(next).toEqual(displayed.map((c) => c[0]).sort());
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("river.progress.v1")!).attempts.length,
    ),
  ).toBe(1);
});

test("новая главная: рисунки загружены, список доступен на коротком экране", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(process.env.E2E_PATH || "/");
    await expect(
      page.getByRole("heading", { name: "Учимся играть" }),
    ).toBeVisible();
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
    );
    const list = await page.locator(".lesson-scroll").boundingBox();
    expect(list!.height).toBeGreaterThan(140);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/home-" + viewport.width + ".png",
    });
  }
});

test("свободная практика продолжается после пятой задачи и заканчивается по выбору", async ({
  page,
}) => {
  await page.goto(process.env.E2E_PATH || "/");
  await page.getByRole("button", { name: "Тренажёры", exact: true }).click();
  await page.getByRole("button", { name: /01 Старшинство карт/ }).click();
  for (let i = 0; i < 7; i++) {
    await expect(page.locator(".session-heading")).toContainText(
      "Задание " + (i + 1),
    );
    const cards = await page
      .locator(".table .card")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-card")!));
    const ranks = "23456789TJQKA",
      diff = ranks.indexOf(cards[0][0]) - ranks.indexOf(cards[1][0]);
    await page
      .getByRole("button", {
        name: diff === 0 ? "Равны" : diff > 0 ? "Левая" : "Правая",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Проверить ответ" }).click();
    await expect(page.locator(".feedback")).toContainText("Верно");
    await expect(page.locator(".feedback .sava-panel")).toHaveCount(0);
    await expect(page.locator(".correct-burst")).toHaveCount(1);
    if (i < 6)
      await page
        .getByRole("button", { name: "Следующая задача", exact: true })
        .click();
  }
  await page
    .getByRole("button", { name: "Закончить тренировку", exact: true })
    .click();
  await expect(page.locator(".big-result")).toContainText("7 / 7");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("river.progress.v1")!).attempts.length,
    ),
  ).toBe(7);
});
test("урок 0: понятные подписи, крупный Сава и вся лестница из 13 карт", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(process.env.E2E_PATH || "/");
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page.getByText("Трефы (крести)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Карты по старшинству" }),
  ).toBeVisible();
  await expect(page.getByText("Это рубашка", { exact: false })).toHaveCount(0);
  expect(
    await page.locator(".card-center i").evaluateAll((els) =>
      els.every((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 3 && r.height > 3;
      }),
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/lesson-numbers.png" });
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await page.waitForFunction(() =>
    Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0),
  );
  await page.screenshot({ path: "test-results/lesson-sava.png" });
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await expect(page.locator(".rank-ladder .card")).toHaveCount(13);
  await page.screenshot({ path: "test-results/lesson-ladder.png" });
  await page.setViewportSize({ width: 320, height: 568 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/lesson-ladder-320.png" });
  await page.getByRole("button", { name: "Завершить чтение" }).click();
  await expect(
    page.getByRole("heading", { name: "Урок пройден" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Тренироваться", exact: true })
    .click();
  await page.locator(".choices button").first().click();
  await page.getByRole("button", { name: "Проверить ответ" }).click();
  await page
    .getByRole("button", { name: "Закончить тренировку", exact: true })
    .click();
  await expect(page.locator(".big-result")).toContainText("/ 1");
});
