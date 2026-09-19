import { it, expect } from "vitest";
import solver from "pokersolver";
import { preflopTask, preflopFamilies } from "../src/preflopTasks";
import { oddsTask, oddsFamilies } from "../src/mathTasks";
import { deck, equity, validate } from "../src/poker";
import { fresh, record, validProgress } from "../src/progress";
import { generateSimilar, generateSession } from "../src/tasks";
import { mathSlides } from "../src/mathLesson";
import { preflopSlides } from "../src/preflopLesson";
it("новые семейства задач сохраняются и повторяются с той же темой", () => {
  for (const make of [preflopTask, oddsTask])
    for (let i = 0; i < 100; i++) {
      const t = make();
      expect(t.choices).toContain(t.answer);
      expect(new Set(t.choices).size).toBe(t.choices.length);
      expect(
        validProgress(
          JSON.parse(JSON.stringify(record(fresh(), t, false, false))),
        ),
      ).toBe(true);
      expect(generateSimilar(t).scenario).toBe(t.scenario);
    }
  expect(
    new Set(generateSession(["preflop"], 5).map((t) => t.scenario)),
  ).toEqual(new Set(preflopFamilies));
  expect(new Set(generateSession(["odds"], 5).map((t) => t.scenario))).toEqual(
    new Set(oddsFamilies),
  );
  expect(validProgress(fresh())).toBe(true);
});
it("доплаты и минимальные повышения следуют из ставок на столе", () => {
  for (let i = 0; i < 100; i++)
    for (const f of ["call", "reprice", "min-raise"]) {
      const t = preflopTask(f),
        s = t.scene!;
      const levels = [...new Set(Object.values(s.bets))].sort((a, b) => b - a);
      const current = levels[0],
        previous = levels[1];
      expect(Number(t.answer)).toBe(
        f === "min-raise" ? 2 * current - previous : current - s.bets[s.hero],
      );
      expect(s.folded).not.toContain(s.hero);
    }
});
it("цена, итоговый банк и знак EV согласованы независимо от текста объяснения", () => {
  for (let i = 0; i < 100; i++)
    for (const f of oddsFamilies) {
      const t = oddsTask(f),
        s = t.scene!,
        call = s.bets.BB - s.bets.BTN;
      const current =
          s.previousPot + Object.values(s.bets).reduce((a, b) => a + b, 0),
        final = current + call;
      if (f === "call") expect(Number(t.answer)).toBe(call);
      if (f === "final-pot") expect(Number(t.answer)).toBe(final);
      if (f === "threshold")
        expect(Number(t.answer.replace("%", "").replace(",", "."))).toBeCloseTo(
          Number(((call / final) * 100).toFixed(1)),
          8,
        );
      if (f === "decision") {
        const share = Number(t.prompt.match(/эквити — (\d+)%/)![1]);
        const delta = share * final - 100 * call;
        expect(t.answer).toBe(
          delta > 0
            ? "Колл выгоднее"
            : delta < 0
              ? "Пас выгоднее"
              : "Равны по EV",
        );
      }
    }
});
it("учебное эквити 42 из 44 независимо проверено на каждом ривере", () => {
  const slide = mathSlides.find((s) => s.title === "Проверяем все 44 ривера")!;
  const [board, hero, opponent] = slide.hands!.map((h) => h.cards);
  const used = [...board, ...hero, ...opponent];
  validate(used);
  const losses: string[] = [];
  let wins = 0,
    ties = 0;
  for (const river of deck.filter((c) => !used.includes(c))) {
    const a = solver.Hand.solve([...hero, ...board, river]),
      b = solver.Hand.solve([...opponent, ...board, river]);
    const w = solver.Hand.winners([a, b]);
    if (w.length === 2) ties++;
    else if (w[0] === a) wins++;
    else losses.push(river);
  }
  expect(wins).toBe(42);
  expect(ties).toBe(0);
  expect(losses.sort()).toEqual(["Kc", "Kd"]);
  expect(equity(hero, opponent, board)).toMatchObject({
    wins: 42,
    ties: 0,
    total: 44,
  });
});
it("страницы имеют три главы, а карточные сцены не содержат дубликатов", () => {
  for (const slides of [preflopSlides, mathSlides]) {
    expect(new Set(slides.map((s) => s.section)).size).toBe(3);
    for (const s of slides) {
      if (s.scene)
        validate([
          ...s.scene.cards,
          ...s.scene.board,
          ...(s.scene.opponent?.cards ?? []),
        ]);
      if (s.cards) validate(s.cards);
      if (s.hands) validate(s.hands.flatMap((h) => h.cards));
    }
  }
});
