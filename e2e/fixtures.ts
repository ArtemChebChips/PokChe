import { test as base, expect } from "@playwright/test";
// Обычные регрессионные сценарии проверяют приложение после знакомства.
// Первый вход и сама экскурсия отдельно проверяются в tour.spec.ts.
export const test = base.extend<{ tourDismissed: void }>({
  tourDismissed: [
    async ({ context }, use) => {
      await context.addInitScript(() =>
        localStorage.setItem("river.tour.v1", "done"),
      );
      await use();
    },
    { auto: true },
  ],
});
export { expect };
