import { it, expect } from "vitest";
import { generateSession, generateSimilar } from "../src/tasks";
import { fresh, validProgress } from "../src/progress";
it("каждая пятёрка содержит все три сравнения картинок, туза и одно закрепление", () => {
  for (let i = 0; i < 100; i++) {
    const tasks = generateSession(["cards"], 5);
    const figures = tasks.filter((t) => t.variant === "figures");
    expect(figures).toHaveLength(3);
    expect(
      new Set(
        figures.map((t) =>
          t
            .cards!.map((c) => c[0])
            .sort()
            .join(""),
        ),
      ),
    ).toEqual(new Set(["JQ", "JK", "KQ"]));
    expect(tasks.filter((t) => t.variant === "ace")).toHaveLength(1);
    expect(
      tasks.filter((t) => t.variant === "numbers").length,
    ).toBeLessThanOrEqual(1);
    for (const t of tasks) {
      expect(new Set(t.cards).size).toBe(2);
      expect(t.choices).toContain(t.answer);
    }
    const source = figures[0],
      similar = generateSimilar(source);
    expect(similar.id).not.toBe(source.id);
    expect(similar.cards!.map((c) => c[0]).sort()).toEqual(
      source.cards!.map((c) => c[0]).sort(),
    );
  }
});
it("старые сохранения совместимы, некорректная закладка не принимается", () => {
  expect(validProgress(fresh())).toBe(true);
  expect(
    validProgress({ ...fresh(), reading: { cards: 2 }, lastLesson: "cards" }),
  ).toBe(true);
  expect(validProgress({ ...fresh(), reading: { cards: -1 } })).toBe(false);
});
