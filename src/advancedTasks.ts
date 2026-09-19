import type { Task } from "./tasks";
import { pick, shuffle } from "./random";
import { bluffEV, callEV, handCombos, percent } from "./rangeMath";
import pack from "./data/river-models.json" with { type: "json" };
export function wilson(successes: number, total: number): [number, number] {
  if (
    !Number.isInteger(total) ||
    total <= 0 ||
    !Number.isInteger(successes) ||
    successes < 0 ||
    successes > total
  )
    throw Error("Неверная выборка");
  const z = 1.959963984540054,
    p = successes / total,
    d = 1 + (z * z) / total;
  const middle = (p + (z * z) / (2 * total)) / d,
    half =
      (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) /
      d;
  return [Math.max(0, middle - half), Math.min(1, middle + half)];
}
const base = (
  skill: "planning" | "adjustment" | "advanced",
  scenario: string,
): Task => ({
  id: crypto.randomUUID(),
  skill,
  scenario,
  revision: 1,
  model: "Учебная модель",
  title:
    skill === "planning"
      ? "План на две улицы"
      : skill === "adjustment"
        ? "Наблюдения и подстройка"
        : "Блокеры и частоты",
  prompt: "",
  answer: "",
  choices: [],
  explanation: "",
  hint: "Проверьте условия: какие реакции заданы и что остаётся неизвестным?",
  category: "exact",
});
const options = (t: Task, a: string, others: string[]) => {
  t.answer = a;
  t.choices = shuffle([...new Set([a, ...others])]);
};
export function planningTask(): Task {
  const t = base("planning", "two-streets"),
    pot = pick([8, 12, 16]),
    stack = pick([20, 24, 30]),
    bet = pick([2, 4, 6]),
    after = pot + 2 * bet,
    left = stack - bet;
  t.context = `В начале тёрна банк ${pot}, у обоих по ${stack} фишек. Вы поставили ${bet}, соперник уравнял. Комиссии нет.`;
  t.scene = {
    street: "Тёрн · решение 1 из 2",
    hero: "BTN",
    cards: ["As", "Qd"],
    board: ["Qh", "8c", "3s", "2d"],
    previousPot: pot,
    bets: { BTN: bet, BB: bet },
    folded: ["UTG", "HJ", "CO", "SB"],
    hidePot: true,
  };
  t.prompt = "Какой банк перейдёт на ривер?";
  options(t, String(after), [
    String(pot + bet),
    String(pot),
    String(after + bet),
  ]);
  t.explanation = `${pot} + ${bet} + ${bet} = ${after}. У каждого осталось ${stack} − ${bet} = ${left}. Следующий шаг продолжит эту же раздачу.`;
  const follow = base("planning", "river-price");
  follow.scene = {
    ...t.scene,
    street: "Ривер · решение 2 из 2",
    board: [...t.scene.board, "9h"],
    previousPot: after,
    bets: { BB: left },
    hidePot: false,
  };
  follow.context = `На тёрне оба вложили по ${bet}. На ривере у обоих осталось по ${left}. Соперник поставил всё. Без комиссии.`;
  follow.prompt =
    "Какое эквити нужно для безубыточного колла? Выберите ближайший процент из предложенных.";
  const price = (left / (after + 2 * left)) * 100;
  options(follow, percent(price), [
    percent((left / (after + left)) * 100),
    "50%",
    "100%",
  ]);
  follow.explanation = `Добавить ${left}; после колла банк ${after} + ${left} + ${left} = ${after + 2 * left}. Порог ${percent(price)}. Это цена, а не оценка силы вашей руки.`;
  t.nextTask = follow;
  return t;
}
export const adjustmentFamilies = [
  "known-fold",
  "bluff-catch",
  "sample",
  "opportunities",
];
export function adjustmentTask(family = pick(adjustmentFamilies)): Task {
  const t = base("adjustment", family);
  if (family === "known-fold") {
    const f = pick([0.2, 0.4, 0.6]),
      e = bluffEV(100, 50, f);
    t.prompt = `В заданной модели соперник пасует на ставку 50 в банк 100 ровно в ${percent(f * 100)}. Иначе уравнивает и побеждает. Чек даёт EV 0, рейза нет. Какое решение лучше?`;
    options(t, e > 0 ? "Блеф" : "Чек", ["Блеф", "Чек", "EV одинаков"]);
    t.explanation = `EV блефа = ${f} × 100 − ${1 - f} × 50 = ${e}. Частота задана моделью, а не оценена по нескольким наблюдениям.`;
  } else if (family === "bluff-catch") {
    const bluffs = pick([0.1, 0.2, 0.4]),
      e = callEV(100, 50, bluffs);
    t.prompt = `Ривер: ставка 50 в банк 100. В заданном диапазоне ставки ${percent(bluffs * 100)} блефов, которые вы бьёте; остальные руки вас бьют. Дележей, комиссии и рейза нет. Колл или пас?`;
    options(t, e > 0 ? "Колл" : "Пас", ["Колл", "Пас", "EV одинаков"]);
    t.explanation = `Цена колла 25%. Эквити вашего блеф-кетчера ${percent(bluffs * 100)}. EV колла ${e} относительно паса.`;
  } else if (family === "sample") {
    const n = pick([5, 10, 100]),
      k = n * 0.6,
      [lo, hi] = wilson(k, n);
    t.model = "Статистическая оценка";
    t.prompt = `Соперник сбросил ${k} из ${n} раз в одинаковых независимых условиях. 95%-й интервал Уилсона: ${percent(lo * 100)}–${percent(hi * 100)}. Порог окупаемости блефа — 33,3%. Какой вывод по заданному критерию?`;
    const a =
      lo > 1 / 3
        ? "Весь интервал выше порога"
        : hi < 1 / 3
          ? "Весь интервал ниже порога"
          : "Интервал пересекает порог";
    options(t, a, [
      "Весь интервал выше порога",
      "Весь интервал ниже порога",
      "Интервал пересекает порог",
    ]);
    t.explanation = `Точечная оценка везде 60%, но ${n} наблюдений дают свой интервал. ${a}. Интервал метода не гарантирует частоту следующего действия и предполагает неизменность условий.`;
  } else {
    t.prompt =
      "За 100 рук игрок только 5 раз столкнулся с 3-бетом и 3 раза сбросил. Как правильно записать частоту паса на 3-бет?";
    options(t, "3 из 5 возможностей · 60%", [
      "3 из 100 рук · 3%",
      "5 из 100 рук · 5%",
      "60 из 100 возможностей",
    ]);
    t.explanation =
      "Знаменатель — число возможностей ответить на 3-бет. Всего их пять; оценка 60% пока основана на очень малой выборке.";
  }
  return t;
}
export const advancedFamilies = [
  "blocker",
  "mdf",
  "bluff-share",
  "action",
  "frequency",
];
export function advancedTask(family = pick(advancedFamilies)): Task {
  const t = base("advanced", family),
    r = pick(pack.scenarios);
  if (family === "blocker") {
    t.cards = ["As", "7d"];
    t.prompt =
      "У вас A♠7♦. Сколько комбинаций AA и AKs вместе остаётся у соперника до флопа?";
    const n =
      handCombos("AA", t.cards).length + handCombos("AKs", t.cards).length;
    options(t, String(n), ["10", "7", "3"]);
    t.explanation =
      "AA: три пары из оставшихся тузов. AKs: три масти без пик. Итого шесть. Стратегический эффект зависит от действий этих рук.";
  } else if (family === "mdf" || family === "bluff-share") {
    const mdf = 100 / (100 + r.bet),
      share = r.bet / (100 + 2 * r.bet);
    t.prompt =
      family === "mdf"
        ? `В простой модели ривера ставка ${r.bet} в банк 100. Какой ориентир минимальной защиты против чистого блефа?`
        : `Риверная полярная модель: ставка ${r.bet} в банк 100. Все блефы проигрывают блеф-кетчеру, всё вэлью побеждает; рейзов и комиссии нет. Какова равновесная доля блефов среди всех ставок?`;
    options(t, percent((family === "mdf" ? mdf : share) * 100), [
      percent((r.bet / (100 + r.bet)) * 100),
      "100%",
      "10%",
    ]);
    t.explanation =
      family === "mdf"
        ? `100 ÷ (100 + ${r.bet}) = ${percent(mdf * 100)}. Это ориентир ограниченной модели, а не обязательная защита любого реального диапазона.`
        : `${r.bet} ÷ (100 + 2 × ${r.bet}) = ${percent(share * 100)}. Доля блефов среди всех ставок отличается от отношения блефов к вэлью.`;
  } else {
    t.model = "Рассчитанная модель ривера";
    const bluff = family === "frequency" || pick([true, false]);
    t.scene = {
      street: "Ривер · ограниченная игра",
      hero: "BTN",
      cards: bluff ? r.bluffHand : r.valueHand,
      board: r.board,
      previousPot: r.pot,
      bets: {},
      folded: ["UTG", "HJ", "CO", "SB"],
    };
    t.context = `Банк ${r.pot}, разрешены чек и ставка ${r.bet}. Соперник имеет K♣K♦ и выбирает только пас/колл. Без комиссии; стеки достаточны.`;
    if (family === "action") {
      const ev = bluff ? r.bluffEV : r.valueEV,
        check = bluff ? 0 : r.pot;
      t.prompt = `В рассчитанной модели соперник коллирует в ${percent(r.defenderCall * 100)}. Выберите любое действие с лучшим EV. При равенстве принимаются оба.`;
      options(t, "Ставка", ["Чек"]);
      if (Math.abs(ev - check) < 1e-7) t.acceptedAnswers = ["Ставка", "Чек"];
      t.explanation = `EV ставки ${Number(ev.toFixed(3))}, EV чека ${check} фишек. ${t.acceptedAnswers ? "Оба действия равноценны; частоты тренируются отдельно." : "Ставка выше по EV при заданном ответе соперника."}`;
    } else {
      t.prompt = `До действия сильная рука составляет ${percent(r.valueWeight * 100)} диапазона, остальное — блеф. Все сильные руки ставят. С какой частотой нужно ставить с блефом в этой равновесной модели?`;
      options(t, percent(r.bluffBet * 100), [
        "100%",
        "0%",
        percent(r.defenderCall * 100),
      ]);
      t.explanation = `Частота ставки с блефом ${percent(r.bluffBet * 100)}. Это доля действий именно с блефом, а не доля блефов во всём диапазоне ставки.`;
    }
    t.details = `Набор ${r.id}, версия ${pack.version}. ${pack.solver}. Игра чек/ставка — пас/колл. Два уровня точности дали совпадающий результат; частоты дополнительно сверены аналитически. Это не база всех постфлоп-ситуаций.`;
  }
  return t;
}

