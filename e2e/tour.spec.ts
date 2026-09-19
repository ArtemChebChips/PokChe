import { test, expect } from "@playwright/test";
import { tourSteps } from "../src/tour";
const root = process.env.E2E_PATH || "/";
for (const [width, height] of [
  [320, 568],
  [390, 844],
])
  test(`экскурсия: восемь сцен, позы, фокус и завершение ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(root);
    const dialog = page.getByRole("dialog", { name: "Экскурсия с Иванычем" });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < tourSteps.length; i++) {
      await expect(
        dialog.getByRole("heading", { name: tourSteps[i].title, exact: true }),
      ).toBeVisible();
      await expect(page.locator(".app")).toHaveAttribute(
        "data-tour",
        tourSteps[i].target,
      );
      await expect(dialog.locator("img")).toHaveJSProperty("complete", true);
      expect(
        await dialog
          .locator("img")
          .evaluate((e: HTMLImageElement) => e.naturalWidth),
      ).toBeGreaterThan(0);
      expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      expect(
        await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]'),
        ),
      ).toBe(true);
      expect(
        await dialog
          .locator("img")
          .evaluate((e) => e.getBoundingClientRect().width),
      ).toBeGreaterThanOrEqual(208);
      const next = dialog.getByRole("button", {
        name: i === 7 ? "Поехали" : i === 0 ? "Покажи" : "Дальше",
        exact: true,
      });
      await next.scrollIntoViewIfNeeded();
      const b = await next.boundingBox();
      const nav = await page.locator(".bottom-nav").boundingBox();
      expect(nav!.y + nav!.height).toBeCloseTo(height, 0);
      expect(b!.y + b!.height).toBeLessThanOrEqual(nav!.y + 1);
      expect(await page.locator(".app").evaluate((e) => e.scrollTop)).toBe(0);
      expect(await dialog.evaluate((e) => e.closest("main") !== null)).toBe(
        true,
      );
      if ([0, 2, 5, 7].includes(i))
        await page.screenshot({ path: `test-results/tour-${width}-${i}.png` });
      await next.click();
    }
    await expect(dialog).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem("river.tour.v1")),
    ).toBe("done");
    const progress = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("river.progress.v1")!),
    );
    expect(progress.lessons).toEqual([]);
    expect(progress.attempts).toEqual([]);
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(errors).toEqual([]);
    const icons = page.locator(".route-row .topic-icon img");
    await expect(icons).toHaveCount(14);
    expect(
      await icons.evaluateAll((es) =>
        es.every(
          (e) =>
            (e as HTMLImageElement).complete &&
            (e as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    ).toBe(true);
  });
test("пропуск, повтор, назад, Escape и офлайн без анимации", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(root);
  await expect(page.locator(".tour-scene")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Пропустить экскурсию" }).click();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Настройки и установка" }).click();
  await page
    .getByRole("button", { name: "Экскурсия с Иванычем", exact: true })
    .click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "Покажи", exact: true }).click();
  await d.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(d.getByRole("heading")).toHaveText("Здорово, я Иваныч");
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(d).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "PokChe — на главную" }),
  ).toBeFocused();
});

test("сброс приветствия и повторный вход сохраняют нижнюю панель", async ({ page }) => {
 await page.goto(root);
 await page.getByRole("button", {name:"Пропустить экскурсию"}).click();
 await page.getByRole("button", {name:"Настройки и установка"}).click();
 await page.getByRole("button", {name:"Показать приветствие при следующем входе",exact:true}).click();
 await page.reload();
 await expect(page.getByRole("dialog")).toBeVisible();
 const before=await page.locator(".bottom-nav").boundingBox();
 await page.getByRole("dialog").getByRole("button", {name:"Покажи",exact:true}).click();
 await page.locator("main").evaluate(e=>e.scrollTop=e.scrollHeight);
 const after=await page.locator(".bottom-nav").boundingBox();
 expect(after!.y).toBe(before!.y);
 expect(after!.y+after!.height).toBeCloseTo(page.viewportSize()!.height,0);
 await expect(page.getByRole("dialog")).not.toContainText("В отличие от моего");
 await page.getByRole("button", {name:"Пропустить экскурсию"}).click();
 await expect(page.getByRole("button",{name:"Обучение",exact:true})).toBeVisible();
});
