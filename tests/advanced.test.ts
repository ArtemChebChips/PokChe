import { describe, it, expect } from "vitest";
import solver from "pokersolver";
import pack from "../src/data/river-models.json";
import {
  planningTask,
  adjustmentTask,
  advancedTask,
  wilson,
  adjustmentFamilies,
  advancedFamilies,
} from "../src/advancedTasks";
import { fresh, record, validProgress, mastery } from "../src/progress";
import { generateSession, generateSimilar, check } from "../src/tasks";

describe("Расчётные модели MVP", () => {
  it("реальные карты пяти моделей соответствуют полярным выплатам", () => {
    for (const r of pack.scenarios) {
      const value = solver.Hand.solve([...r.valueHand, ...r.board]);
      const bluff = solver.Hand.solve([...r.bluffHand, ...r.board]);
      const catcher = solver.Hand.solve([...r.defenderHand, ...r.board]);
      expect(solver.Hand.winners([value, catcher])).toEqual([value]);
      expect(solver.Hand.winners([bluff, catcher])).toEqual([catcher]);
      expect(
        new Set([...r.valueHand, ...r.bluffHand, ...r.defenderHand, ...r.board])
          .size,
      ).toBe(11);
    }
  });
  it("LP-пакет согласован с безразличием обоих игроков", () => {
    for (const r of pack.scenarios) {
      expect(r.gap).toBeLessThan(1e-7);
      expect(r.valueBet).toBeCloseTo(1, 9);
      const bluffMass = (1 - r.valueWeight) * r.bluffBet;
      const bluffShare = bluffMass / (r.valueWeight * r.valueBet + bluffMass);
      expect(bluffShare * (r.pot + 2 * r.bet) - r.bet).toBeCloseTo(0, 8);
      expect((1 - r.defenderCall) * r.pot - r.defenderCall * r.bet).toBeCloseTo(
        0,
        8,
      );
      expect(r.bluffEV).toBeCloseTo(0, 8);
      expect(r.valueEV).toBeGreaterThan(r.pot);
    }
  });
  it("интервалы независимо сверены scipy.stats.binomtest(method=wilson)", () => {
    const refs = [
      [3, 5, 0.23072428127601297, 0.8823792257673521],
      [6, 10, 0.3126737697336583, 0.8318196702937639],
      [60, 100, 0.5020025867910618, 0.6905987135675411],
      [0, 5, 0, 0.43448246478317476],
      [5, 5, 0.5655175352168251, 1],
    ];
    for (const [k, n, lo, hi] of refs) {
      const actual = wilson(k, n);
      expect(actual[0]).toBeCloseTo(lo, 12);
      expect(actual[1]).toBeCloseTo(hi, 12);
    }
    expect(() => wilson(1, 0)).toThrow();
    expect(() => wilson(6, 5)).toThrow();
  });
  it("раздача переносит банк, карты и допустимый олл-ин на ривер", () => {
    for (let i = 0; i < 30; i++) {
      const t = planningTask(),
        r = t.nextTask!,
        a = t.scene!,
        b = r.scene!;
      const bet = a.bets.BTN;
      expect(Number(t.answer)).toBe(a.previousPot + bet * 2);
      expect(b.previousPot).toBe(Number(t.answer));
      expect(b.board.slice(0, 4)).toEqual(a.board);
      expect(b.cards).toEqual(a.cards);
      const stack = Number(t.context!.match(/по (\d+) фишек/)![1]);
      expect(b.bets.BB).toBe(stack - bet);
      expect(parseFloat(r.answer.replace(",", "."))).toBeCloseTo(
        (b.bets.BB / (b.previousPot + 2 * b.bets.BB)) * 100,
        0,
      );
      expect(validProgress(record(fresh(), t, false, false))).toBe(true);
      expect(generateSimilar(r).scenario).toBe("river-price");
    }
  });
  it("альтернативы, семейства и повторения валидны", () => {
    for (const [skill, fs, fn] of [
      ["adjustment", adjustmentFamilies, adjustmentTask],
      ["advanced", advancedFamilies, advancedTask],
    ] as const) {
      expect(
        new Set(generateSession([skill], 5).map((t) => t.scenario)).size,
      ).toBe(fs.length);
      for (const f of fs)
        for (let i = 0; i < 10; i++) {
          const t = fn(f);
          expect(check(t, t.answer)).toBe(true);
          for (const a of t.acceptedAnswers ?? [])
            expect(check(t, a)).toBe(true);
          expect(validProgress(record(fresh(), t, false, false))).toBe(true);
          expect(generateSimilar(t).scenario).toBe(f);
        }
    }
  });
  it("освоение требует разных задач, а старый прогресс остаётся валиден", () => {
    let p = fresh();
    const t = advancedTask("blocker");
    for (let i = 0; i < 10; i++) p = record(p, t, true, false);
    expect(mastery(p, "advanced").mastered).toBe(false);
    for (let i = 0; i < 10; i++)
      p = record(p, advancedTask(advancedFamilies[i % 5]), true, false);
    expect(mastery(p, "advanced").mastered).toBe(true);
    expect(
      validProgress({
        ...fresh(),
        attempts: [
          {
            skill: "stack",
            correct: true,
            assisted: false,
            at: new Date().toISOString(),
          },
        ],
      }),
    ).toBe(true);
  });
  it("испорченное продолжение не загружается", () => {
    const t = planningTask();
    t.nextTask!.answer = "нет такого ответа";
    expect(validProgress(record(fresh(), t, false, false))).toBe(false);
  });
});
