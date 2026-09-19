import { it, expect } from "vitest";
import solver from "pokersolver";
import { combinationSlides } from "../src/combinationLesson";
import {
  handCases,
  winnerCases,
  combinationTask,
} from "../src/combinationTasks";
import { generateSession, generateSimilar, check } from "../src/tasks";
import { evaluate, compare, validate } from "../src/poker";
it("каждая учебная иллюстрация соответствует заявленной комбинации", () => {
  for (const slide of combinationSlides)
    for (const h of slide.hands ?? []) {
      validate(h.cards);
      if (h.category !== undefined) {
        expect(evaluate(h.cards).score[0]).toBe(h.category);
        expect(solver.Hand.solve(h.cards).rank - 1).toBe(h.category);
      }
      if (h.highlight) {
        expect(h.highlight.every((c) => h.cards.includes(c))).toBe(true);
        if (h.highlight.length === 5)
          expect(
            compare(evaluate(h.highlight).score, evaluate(h.cards).score),
          ).toBe(0);
      }
    }
});
it("каждый целевой случай проверяется независимым ранжированием при перестановках мастей", () => {
  for (const c of handCases)
    for (let i = 0; i < 12; i++) {
      const t = combinationTask("best", c.id);
      expect(solver.Hand.solve(t.cards!).rank - 1).toBe(c.category);
      expect(check(t, "", t.solution)).toBe(true);
      expect(generateSimilar(t).scenario).toBe(c.id);
    }
});
it("исход каждого вскрытия совпадает с независимой библиотекой", () => {
  for (const c of winnerCases)
    for (let i = 0; i < 12; i++) {
      const t = combinationTask("winner", c.id),
        a = solver.Hand.solve([...t.cards!, ...t.board!]),
        b = solver.Hand.solve([...t.opponent!, ...t.board!]),
        w = solver.Hand.winners([a, b]);
      expect(t.answer).toBe(
        w.length === 2 ? "Делёж" : w[0] === a ? "Вы" : "Соперник",
      );
      expect(
        compare(
          evaluate(t.solution!).score,
          evaluate([...t.cards!, ...t.board!]).score,
        ),
      ).toBe(0);
    }
});
it("подборка гарантирует сложные случаи и не добавляет невыбранный навык", () => {
  for (let i = 0; i < 20; i++) {
    const best = generateSession(["best"], 5).map((t) => t.scenario);
    for (const family of ["two-trips", "three-pairs", "wheel", "flush"])
      expect(best).toContain(family);
    expect(
      generateSession(["winner"], 5).some((t) => t.answer === "Делёж"),
    ).toBe(true);
    expect(
      generateSession(["combination", "best"], 5).every(
        (t) => t.skill !== "winner",
      ),
    ).toBe(true);
  }
});
