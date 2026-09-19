import type { Task } from "./tasks";
import { deck, compare, evaluate, equity } from "./poker";
import { pick, shuffle } from "./random";
export const drawCases = [
  {
    id: "dirty-flush",
    hero: ["Ah", "Kh"],
    villain: ["Qs", "Qd"],
    board: ["2h", "7h", "Qc", "9s"],
    note: "Q♥ даёт сопернику каре, 9♥ — фулл-хаус: не каждый флеш побеждает.",
  },
  {
    id: "combo-draw",
    hero: ["Jh", "Th"],
    villain: ["As", "Ad"],
    board: ["9h", "8h", "2c", "4s"],
    note: "Два аута входят и во флеш, и в стрит: пересечения считаются один раз.",
  },
  {
    id: "overpair",
    hero: ["As", "Ah"],
    villain: ["Ks", "Kh"],
    board: ["2c", "7d", "9h", "Js"],
    note: "Только два оставшихся короля меняют победителя.",
  },
  {
    id: "dominated",
    hero: ["As", "Jh"],
    villain: ["Ac", "Qh"],
    board: ["Ad", "7c", "3s", "2d"],
    note: "Туз общий по достоинству, но кикер соперника старше. Помогают оставшиеся валеты.",
  },
  {
    id: "board-draw",
    hero: ["2c", "3d"],
    villain: ["As", "Ah"],
    board: ["Ts", "Js", "Qs", "Ks"],
    note: "Пятая пика даст сопернику флеш с A♠; свою лучшую пятёрку нужно сравнивать с его рукой.",
  },
  {
    id: "made-straight",
    hero: ["8c", "9d"],
    villain: ["Qs", "Qd"],
    board: ["5h", "6h", "7c", "Qc"],
    note: "Готовый стрит впереди сета, но спаривание доски может перевернуть результат.",
  },
] as const;
const label = (c: string) =>
  c[0].replace("T", "10") + ({ c: "♣", d: "♦", h: "♥", s: "♠" }[c[1]] ?? "");
export function riverGroups(
  hero: string[],
  villain: string[],
  board: string[],
) {
  const used = [...hero, ...villain, ...board];
  const groups = {
    win: [] as string[],
    tie: [] as string[],
    loss: [] as string[],
  };
  for (const r of deck.filter((c) => !used.includes(c))) {
    const v = compare(
      evaluate([...hero, ...board, r]).score,
      evaluate([...villain, ...board, r]).score,
    );
    groups[v > 0 ? "win" : v === 0 ? "tie" : "loss"].push(r);
  }
  return groups;
}
export const boardFamilies = [
  "outs",
  "dirty",
  "overlap",
  "texture",
  "change",
  "backdoor",
];
export function boardTask(family = pick(boardFamilies)): Task {
  const t: Task = {
    id: crypto.randomUUID(),
    skill: "texture",
    scenario: family,
    revision: 2,
    title: "Доска, дро и ауты",
    prompt: "",
    answer: "",
    choices: [],
    explanation: "",
    hint: "Отделите готовую комбинацию от способа усиления.",
    category: "exact",
  };
  const options = (answer: string, others: string[]) => {
    t.answer = answer;
    t.choices = shuffle([...new Set([answer, ...others])]);
  };
  if (["outs", "dirty", "overlap"].includes(family)) {
    const c =
      family === "dirty"
        ? drawCases[0]
        : family === "overlap"
          ? drawCases[1]
          : pick(drawCases.slice(0, 4));
    t.cards = [...c.hero];
    t.opponent = [...c.villain];
    t.board = [...c.board];
    const g = riverGroups(t.cards, t.opponent, t.board);
    t.context = "Тёрн · обе руки известны · одна карта до вскрытия";
    t.prompt = "Сколько риверов дают вам победу без дележа?";
    options(
      String(g.win.length),
      [g.win.length + 2, Math.max(0, g.win.length - 2), g.win.length + 4].map(
        String,
      ),
    );
    t.explanation = `Победных риверов: ${g.win.length} из 44. ${g.win.map(label).join(", ")}. ${c.note}`;
    t.details = `Дележей: ${g.tie.length}. Все 44 ривера проверены по лучшим пятёркам обоих игроков.`;
  } else if (family === "texture") {
    const paired = pick([true, false]);
    t.board = paired ? ["Qs", "Qh", "7c"] : ["Qs", "8h", "7c"];
    t.prompt =
      "Какая готовая комбинация уже возможна у соперника на этом флопе?";
    options(
      paired ? "Фулл-хаус" : "Стрит",
      paired ? ["Флеш", "Стрит", "Стрит-флеш"] : ["Флеш", "Фулл-хаус", "Каре"],
    );
    t.explanation = paired
      ? "Q–7 в руке даёт QQQ77. Три разные масти исключают готовый флеш."
      : "J–10 даёт стрит на 9–8–7.";
    if (!paired) {
      t.board = ["9s", "8h", "7c"];
      t.explanation =
        "J–10 даёт 7–8–9–10–J. Разные масти и отсутствие пары исключают остальные варианты.";
    }
  } else if (family === "change") {
    t.cards = ["Ah", "Kh"];
    t.opponent = ["Qs", "Qd"];
    t.board = ["2h", "7h", "Qc", "9s", "9h"];
    t.prompt = "Пришёл червовый ривер. Кто забирает банк?";
    options("Соперник — фулл-хаус", [
      "Вы — флеш",
      "Делёж",
      "Соперник — только тройка",
    ]);
    t.explanation =
      "Ваш флеш проигрывает QQQ99. Ривер усилил обе руки, но не одинаково.";
  } else {
    t.cards = ["Ah", "Jh"];
    t.board = ["8h", "3c", "2s"];
    t.prompt = "Какие следующие карты дадут вам флеш к риверу?";
    options("Червовый тёрн и червовый ривер", [
      "Любой червовый тёрн, ривер не важен",
      "Любой валет и любая черва",
      "Достаточно одной червы на любой улице",
    ]);
    t.explanation =
      "Сейчас известно три червы среди вашей руки и флопа. Для пяти нужны ещё две: это бэкдор, а не обычное флеш-дро.";
  }
  return t;
}
export function targetedEquityTask(id?: string): Task {
  const c = drawCases.find((c) => c.id === id) ?? pick(drawCases);
  const result = equity([...c.hero], [...c.villain], [...c.board]);
  const answer = Math.round(result.percent / 10) * 10;
  return {
    id: crypto.randomUUID(),
    skill: "equity",
    scenario: c.id,
    revision: 2,
    title: "Оцени эквити",
    cards: [...c.hero],
    opponent: [...c.villain],
    board: [...c.board],
    context: "Тёрн · известная рука соперника · полный перебор",
    prompt:
      "Какова ваша доля банка при вскрытии? Выберите ближайшие десятки процентов.",
    answer: answer + "%",
    choices: shuffle([
      ...new Set([
        answer,
        Math.max(0, answer - 10),
        Math.min(100, answer + 10),
        answer > 50 ? 0 : 100,
      ]),
    ]).map((n) => n + "%"),
    explanation: `Точное эквити: ${result.percent.toFixed(1).replace(".", ",")}%. Побед ${result.wins}, дележей ${result.ties}, всего 44 ривера. ${c.note}`,
    details:
      "Победа даёт 1, делёж — 0,5. Сумма делится на 44. Это доля банка без будущих ставок, а не рекомендация действия.",
    hint: "Учитывайте возможности усиления обеих рук и половину каждого дележа.",
    category: "exact",
  };
}
