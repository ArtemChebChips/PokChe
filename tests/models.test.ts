import { describe, it, expect } from "vitest";
import solver from "pokersolver";
import { deck } from "../src/poker";
import {
  rangeEquity,
  normalizeRange,
  handCombos,
  bluffEV,
  callEV,
} from "../src/rangeMath";
import { modelTask, modelFamilies } from "../src/modelTasks";
import { fresh, record, validProgress } from "../src/progress";
import { check, generateSession } from "../src/tasks";
describe("Учебные модели", () => {
  it("EV через выплаты повторений", () => {
    expect(bluffEV(100, 50, 0.4)).toBe(10);
    expect(callEV(100, 50, 0.3)).toBe(10);
    expect(() => bluffEV(100, 50, 2)).toThrow();
  });
  it("комбинации и блокировка известным тузом", () => {
    expect(["AA", "AKs", "AKo"].map((h) => handCombos(h).length)).toEqual([
      6, 4, 12,
    ]);
    expect(
      ["AA", "AKs", "AKo"].map((h) => handCombos(h, ["As", "7d"]).length),
    ).toEqual([3, 3, 9]);
  });
  it("фильтрация и нормировка диапазона", () => {
    expect(
      normalizeRange(
        [
          { cards: ["As", "Ah"], weight: 1 },
          { cards: ["Ks", "Kh"], weight: 2 },
        ],
        ["As"],
      ),
    ).toEqual([{ cards: ["Ks", "Kh"], weight: 1 }]);
    expect(() =>
      normalizeRange([{ cards: ["As", "Ah"], weight: 0 }]),
    ).toThrow();
    expect(() =>
      normalizeRange([
        { cards: ["As", "Ah"], weight: 1 },
        { cards: ["Ah", "As"], weight: 1 },
      ]),
    ).toThrow();
  });
  it("эквити диапазона независимо по всем риверам", () => {
    const h = ["As", "Ah"],
      board = ["2c", "7d", "9h", "Js"],
      range = [
        { cards: ["Ks", "Kh"], weight: 3 },
        { cards: ["Jc", "Jd"], weight: 1 },
      ];
    let score = 0;
    for (const v of range) {
      let points = 0;
      for (const r of deck.filter(
        (c) => ![...h, ...board, ...v.cards].includes(c),
      )) {
        const a = solver.Hand.solve([...h, ...board, r]),
          b = solver.Hand.solve([...v.cards, ...board, r]);
        const w = solver.Hand.winners([a, b]);
        points += w.length === 2 ? 0.5 : w[0] === a ? 1 : 0;
      }
      score += (((v.weight / 4) * points) / 44) * 100;
    }
    expect(rangeEquity(h, board, range)).toBeCloseTo(score, 10);
  });
  it("семейства, альтернативы и старые сохранения", () => {
    for (const skill of ["betting", "ranges"] as const) {
      expect(
        new Set(generateSession([skill], 5).map((t) => t.scenario)).size,
      ).toBe(4);
      for (const f of modelFamilies[skill])
        for (let i = 0; i < 5; i++) {
          const t = modelTask(skill, f);
          expect(check(t, t.answer)).toBe(true);
          expect(validProgress(record(fresh(), t, false, false))).toBe(true);
        }
    }
    const t = modelTask("betting", "bluff");
    t.acceptedAnswers = t.choices.slice(0, 2);
    t.answer = t.acceptedAnswers[0];
    expect(check(t, t.acceptedAnswers[1])).toBe(true);
    expect(validProgress(record(fresh(), t, false, false))).toBe(true);
  });
});
