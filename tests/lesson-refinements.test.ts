import { combinationSlides } from "../src/combinationLesson";
import { it, expect } from "vitest";
import solver from "pokersolver";
import { rankingExamples, flushComparison } from "../src/rankingExamples";
import { combinationTask, handCases } from "../src/combinationTasks";
import { check, generateSimilar, generateSession } from "../src/tasks";
import { fresh, record, validProgress } from "../src/progress";
import { evaluate, validate } from "../src/poker";
import { handFlowTask, flowFamilies } from "../src/handFlowTasks";
it("все десять изображений рейтинга и пример сравнения флешей проверены независимо", () => {
  for (const h of rankingExamples)
    expect(solver.Hand.solve(h.cards).rank - 1).toBe(h.category);
  const h = flushComparison,
    a = solver.Hand.solve([...h.hero, ...h.board]),
    b = solver.Hand.solve([...h.opponent, ...h.board]);
  validate([...h.hero, ...h.opponent, ...h.board]);
  expect(a.rank).toBe(6);
  expect(b.rank).toBe(6);
  expect(solver.Hand.winners([a, b])).toEqual([a]);
});
it("новые и старые ошибки выбора пяти карт сохраняются и принимают правильную комбинацию", () => {
  const t = combinationTask("best", "two-trips");
  expect(t.cards).toHaveLength(2);
  expect(t.board).toHaveLength(5);
  expect(check(t, "", t.solution)).toBe(true);
  expect(validProgress(record(fresh(), t, false, false))).toBe(true);
  const legacy = { ...t, board: undefined, cards: [...t.cards!, ...t.board!] };
  expect(validProgress(record(fresh(), legacy, false, false))).toBe(true);
  expect(check(legacy, "", legacy.solution)).toBe(true);
  expect(check(t, "", [...t.solution!.slice(0, 4), t.solution![0]])).toBe(
    false,
  );
});
it("распознавание предлагает пять уникальных вариантов без подсказки названия ответа", () => {
  for (const h of handCases)
    for (let i = 0; i < 5; i++) {
      const t = combinationTask("combination", h.id);
      expect(t.choices).toHaveLength(5);
      expect(new Set(t.choices).size).toBe(5);
      expect(t.choices).toContain(t.answer);
      expect(t.hint).not.toMatch(/Стрит:|Флеш:/);
      expect(t.cards).toHaveLength(2);
      expect(t.board).toHaveLength(5);
    }
});
it("вскрытия варьируют достоинства, не повторяют доску дележа из урока", () => {
  const boards = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const t = combinationTask("winner", "board-tie"),
      r = t
        .board!.map((c) => c[0])
        .sort()
        .join("");
    boards.add(r);
    expect(r).not.toBe("88AKK");
    expect(t.answer).toBe("Делёж");
  }
  expect(boards.size).toBeGreaterThan(1);
});
it("практика хода раздачи покрывает этапы и действия, похожая задача сохраняет тему", () => {
  for (const family of flowFamilies)
    for (let i = 0; i < 10; i++) {
      const t = handFlowTask(family);
      expect(t.choices).toContain(t.answer);
      expect(check(t, t.answer)).toBe(true);
      expect(validProgress(record(fresh(), t, false, false))).toBe(true);
      expect(generateSimilar(t).scenario).toBe(family);
      if (family === "call" || family === "raise") {
        const numbers = t.prompt.match(/\d+/g)!.map(Number);
        expect(Number(t.answer)).toBe(
          (family === "call" ? numbers[1] : numbers[2]) - numbers[0],
        );
      }
    }
  const batch = generateSession(["order"], 5).map((t) => t.scenario);
  expect(batch).toContain("preflop");
  expect(batch).toContain("postflop");
  expect(batch).toContain("street");
});

it("фулл-хаусы на одной доске сначала сравниваются по тройке, затем по паре", () => {
  const hands = combinationSlides.find(
    (s) => s.title === "Как сравнить фулл-хаусы",
  )!.hands!;
  const [board, hero, opponent] = hands.map((h) => h.cards);
  validate([...board, ...hero, ...opponent]);
  const a = solver.Hand.solve([...board, ...hero]),
    b = solver.Hand.solve([...board, ...opponent]);
  expect(evaluate([...board, ...hero]).score.slice(0, 3)).toEqual([6, 10, 14]);
  expect(evaluate([...board, ...opponent]).score.slice(0, 3)).toEqual([
    6, 11, 10,
  ]);
  expect(solver.Hand.winners([a, b])).toEqual([b]);
  const c = solver.Hand.solve(["Ts", "Th", "Td", "As", "Ac"]),
    d = solver.Hand.solve(["Ts", "Th", "Td", "Ks", "Kc"]);
  expect(solver.Hand.winners([c, d])).toEqual([c]);
});

it("игровые сцены: колл и рейз совпадают со ставками, вскрытия проверяет независимый решатель", () => {
  for (let i = 0; i < 50; i++) {
    for (const family of flowFamilies) {
      const task = handFlowTask(family),
        scene = task.scene!;
      validate([
        ...scene.cards,
        ...scene.board,
        ...(scene.opponent?.cards ?? []),
      ]);
      expect(scene.cards).toHaveLength(2);
      expect(scene.previousPot).toBeGreaterThanOrEqual(0);
      if (family === "call")
        expect(Number(task.answer)).toBe(scene.bets.UTG - scene.bets.BB);
      if (family === "raise")
        expect(Number(task.answer)).toBe(2 * (scene.bets.UTG - scene.bets.BB));
      if (family === "blind") {
        expect(scene.hidePot).toBe(true);
        expect(Number(task.answer)).toBe(scene.bets.SB + scene.bets.BB);
      }
      if (family === "showdown") {
        const hero = solver.Hand.solve([...scene.cards, ...scene.board]);
        const opponent = solver.Hand.solve([
          ...scene.opponent!.cards,
          ...scene.board,
        ]);
        const winners = solver.Hand.winners([hero, opponent]);
        expect(task.answer).toBe(
          winners.length === 2
            ? "Делёж"
            : winners[0] === hero
              ? "Вы"
              : "Соперник",
        );
      }
    }
  }
});

it("сцена повторения ошибок сохраняется и повреждённая сцена отклоняется", () => {
  const task = handFlowTask("showdown");
  const saved = JSON.parse(JSON.stringify(record(fresh(), task, false, false)));
  expect(validProgress(saved)).toBe(true);
  saved.mistakes[0].scene.board[0] = saved.mistakes[0].scene.cards[0];
  expect(validProgress(saved)).toBe(false);
  saved.mistakes[0].scene = null;
  expect(validProgress(saved)).toBe(false);
});

it("очередь учитывает пас, а вопросы об улицах требуют следующего действия", () => {
  for (let i = 0; i < 50; i++) {
    for (const family of ["preflop", "postflop"]) {
      const t = handFlowTask(family);
      const order =
        family === "preflop"
          ? ["UTG", "HJ", "CO", "BTN", "SB", "BB"]
          : ["SB", "BB", "UTG", "HJ", "CO", "BTN"];
      const first = order.find((p) => !t.scene!.folded.includes(p))!;
      expect(t.answer.startsWith(first + " —")).toBe(true);
      expect(t.scene!.folded.length).toBeGreaterThan(0);
    }
    const t = handFlowTask("street");
    expect(t.prompt).not.toContain("сколько общих карт");
    expect(t.choices).toHaveLength(4);
    expect(new Set(t.choices).size).toBe(4);
    if (t.scene!.board.length === 5) expect(t.answer).toContain("Вскрытие");
    if (t.scene!.board.length === 3)
      expect(t.answer).toContain("тёрн; первым действует BB");
  }
});
