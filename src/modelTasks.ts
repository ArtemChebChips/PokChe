import type { Task } from "./tasks";
import { pick, shuffle } from "./random";
import { bluffEV, handCombos, rangeEquity, percent } from "./rangeMath";
export const modelFamilies = {
  betting: ["bluff", "threshold", "value", "size"],
  ranges: ["combos", "blocked", "update", "equity"],
};
export function modelTask(
  skill: "betting" | "ranges",
  family = pick(modelFamilies[skill]),
): Task {
  const t: Task = {
    id: crypto.randomUUID(),
    skill,
    scenario: family,
    revision: 1,
    model: "Учебная модель",
    title: skill === "betting" ? "Ставка и её результат" : "Думаем диапазонами",
    prompt: "",
    answer: "",
    choices: [],
    explanation: "",
    hint: "Используйте только условия задачи. Реакция реального игрока может отличаться.",
    category: "exact",
  };
  const opts = (a: string, others: string[]) => {
    t.answer = a;
    t.choices = shuffle([...new Set([a, ...others])]);
  };
  if (skill === "betting") {
    const pot = pick([40, 60, 100]),
      bet = pot * pick([0.5, 1]),
      fold = pick([0.2, 0.4, 0.6]);
    t.scene = {
      street: "Ривер · вы выбираете ставку",
      hero: "BTN",
      cards: ["Jh", "Th"],
      board: ["Ks", "8h", "3c", "2d", "9s"],
      previousPot: pot,
      bets: {},
      folded: ["UTG", "HJ", "CO", "SB"],
    };
    t.context = "Один на один · без комиссии · фишки";
    if (family === "bluff") {
      const ev = bluffEV(pot, bet, fold);
      t.prompt = `Блеф ${bet} в банк ${pot}. Соперник пасует в ${percent(fold * 100)}, иначе уравнивает и всегда побеждает. Чек даёт EV 0; рейза нет. Какой ход выгоднее?`;
      opts(ev > 1e-8 ? "Блеф" : ev < -1e-8 ? "Чек" : "Равноценны", [
        "Блеф",
        "Чек",
        "Равноценны",
      ]);
      t.explanation = `EV блефа = ${fold} × ${pot} − ${1 - fold} × ${bet} = ${Number(ev.toFixed(2))} фишек. EV чека = 0. Не путайте средний результат с исходом одной раздачи.`;
    } else if (family === "threshold") {
      const n = (bet / (pot + bet)) * 100;
      t.prompt = `Чистый блеф ${bet} в ${pot}: при колле всегда проигрываем. Какая минимальная частота паса даст EV не ниже нуля?`;
      opts(percent(n), [percent((bet / (pot + 2 * bet)) * 100), "100%", "10%"]);
      t.explanation = `Риск ${bet}, возможный выигрыш ${pot}. Порог ${bet} ÷ (${pot} + ${bet}) = ${percent(n)}. Для положительного EV частота должна быть выше порога.`;
    } else if (family === "value") {
      const win = pick([0.25, 0.5, 0.75]),
        extra = (2 * win - 1) * bet;
      t.scene.cards = ["Ah", "Kd"];
      t.prompt = `На этом ривере ваша рука выигрывает против ${percent(win * 100)} заданного диапазона, дележей нет. Соперник всегда уравнивает ставку ${bet}, никогда не рейзит. После чека — вскрытие. Сколько ставка добавляет к EV чека?`;
      opts(String(extra), [
        String(-extra),
        String(bet),
        String(bet * win),
        "0",
      ]);
      t.explanation = `При победе ставка приносит дополнительные ${bet}, при проигрыше столько же теряется: (${win} − ${1 - win}) × ${bet} = ${extra}. Прежний банк одинаков в обеих линиях.`;
    } else {
      const small = pot / 2,
        large = pot;
      const f1 = 0.4,
        f2 = pick([0.4, 0.5, 0.7]);
      const e1 = bluffEV(pot, small, f1),
        e2 = bluffEV(pot, large, f2);
      t.prompt = `Чистый блеф на ривере: на ${small} соперник пасует в 40%, на ${large} — в ${percent(f2 * 100)}. При колле всегда проигрываем, рейза нет. У какого размера выше EV?`;
      opts(
        e1 > e2
          ? `Ставка ${small}`
          : e2 > e1
            ? `Ставка ${large}`
            : "EV одинаков",
        [`Ставка ${small}`, `Ставка ${large}`, "EV одинаков"],
      );
      t.explanation = `Малый размер: EV ${Number(e1.toFixed(2))}. Большой: EV ${Number(e2.toFixed(2))}. Реакция на каждый размер задана отдельно.`;
    }
  } else if (family === "combos" || family === "blocked") {
    const label = pick(["AA", "AKs", "AKo"]);
    t.cards = family === "blocked" ? ["As", "7d"] : undefined;
    const n = handCombos(label, t.cards).length;
    t.prompt = `Сколько конкретных комбинаций ${label} возможно у соперника${t.cards ? ", если ваши карты уже известны" : " до открытия любых карт"}?`;
    opts(
      String(n),
      ["3", "4", "6", "9", "12", "16"]
        .filter((x) => x !== String(n))
        .slice(0, 3),
    );
    t.explanation = `Остаётся ${n} комбинаций. Считаем реальные пары карт, исключая известные, а не одну клетку матрицы.`;
  } else if (family === "update") {
    const value = pick([4, 6, 8]),
      bluffs = 4,
      frequency = pick([0.25, 0.5]);
    const result = (value / (value + bluffs * frequency)) * 100;
    t.prompt = `Исходно ${value} сильных и ${bluffs} слабых равновероятных комбинаций. Сильные ставят всегда, слабые — в ${percent(frequency * 100)}. Какая доля сильных рук после ставки?`;
    opts(percent(result), [
      percent((value / (value + bluffs)) * 100),
      "50%",
      "100%",
    ]);
    t.explanation = `Веса после ставки: ${value} × 1 и ${bluffs} × ${frequency}. Доля сильных: ${value} ÷ ${value + bluffs * frequency} = ${percent(result)}.`;
  } else {
    t.cards = ["As", "Ah"];
    t.board = ["2c", "7d", "9h", "Js"];
    t.range = [
      { cards: ["Ks", "Kh"], weight: pick([1, 3]) },
      { cards: ["Jc", "Jd"], weight: 1 },
    ];
    const e = rangeEquity(t.cards, t.board, t.range);
    const nearest = Math.round(e / 10) * 10;
    t.prompt =
      "Оцените эквити против всего заданного диапазона на тёрне. Выберите ближайшие десятки процентов.";
    opts(nearest + "%", [
      Math.max(0, nearest - 20) + "%",
      Math.min(100, nearest + 20) + "%",
      "100%",
    ]);
    t.explanation = `Полный перебор каждого ривера против каждой руки с её весом: ${percent(e)}. Высокое эквити против королей не компенсирует автоматически сет валетов.`;
    t.hint =
      "Сначала оцените каждую руку отдельно, затем учтите её долю в наборе.";
  }
  return t;
}
