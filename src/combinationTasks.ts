import { evaluate, compare, names, suits, validate } from "./poker";
import { shuffle, pick } from "./random";
import { skillNames } from "./content";
import type { Task } from "./tasks";
export const handCases = [
  {
    id: "royal",
    cards: "Ts Js Qs Ks As 4h 2d",
    category: 8,
    why: "Пять старших карт одной масти — флеш-рояль.",
  },
  {
    id: "high",
    cards: "As Kd 9h 7c 4s 3d 2c",
    category: 0,
    why: "Нет пары, пяти подряд или пяти одной масти. Сравниваются пять старших карт.",
  },
  {
    id: "pair",
    cards: "As Ah Kd 9c 7s 4d 2c",
    category: 1,
    why: "Два туза образуют пару. К ней добавляются три старших кикера.",
  },
  {
    id: "two-pairs",
    cards: "Ks Kh 8d 8c As 4h 2c",
    category: 2,
    why: "Две пары — короли и восьмёрки. Пятая карта — туз-кикер.",
  },
  {
    id: "trips",
    cards: "Qs Qh Qd Ac 8s 5h 2c",
    category: 3,
    why: "Три дамы и два старших кикера. Для фулл-хауса нужна ещё пара.",
  },
  {
    id: "straight",
    cards: "5s 6h 7c 8d 9s Kh 2c",
    category: 4,
    why: "Пять разных достоинств подряд, от пятёрки до девятки.",
  },
  {
    id: "wheel",
    cards: "As 2h 3c 4d 5s Kh 9c",
    category: 4,
    why: "A–2–3–4–5 — младший стрит. Здесь туз играет роль единицы, старшая карта стрита — пятёрка.",
  },
  {
    id: "no-wrap",
    cards: "Ks Ah 2c 3d 4s 8h 9c",
    category: 0,
    why: "K–A–2–3–4 не стрит. Туз может стоять только в начале A–2–3–4–5 или в конце 10–J–Q–K–A.",
  },
  {
    id: "flush",
    cards: "Ah Jh 8h 5h 2h Kc Qd",
    category: 5,
    why: "Пять червей образуют флеш. Карты разных достоинств не обязаны идти подряд.",
  },
  {
    id: "full-house",
    cards: "Ks Kh Kd 9s 9h 4c 2d",
    category: 6,
    why: "Три короля и две девятки — фулл-хаус.",
  },
  {
    id: "two-trips",
    cards: "Ks Kh Kd Qs Qh Qd 2c",
    category: 6,
    why: "Из двух троек берём старшую тройку королей и любую пару дам. Лишняя дама не входит в пятёрку.",
  },
  {
    id: "three-pairs",
    cards: "As Ah Ks Kh Qs Qh 2c",
    category: 2,
    why: "Третьей пары в комбинации нет: две пары тузов и королей плюс одна дама-кикер.",
  },
  {
    id: "quads",
    cards: "9s 9h 9d 9c As Kh 2d",
    category: 7,
    why: "Четыре девятки — каре. Из оставшихся карт берём старший кикер, туза.",
  },
  {
    id: "straight-flush",
    cards: "5h 6h 7h 8h 9h Ks 2d",
    category: 8,
    why: "Пять последовательных карт одной масти — стрит-флеш.",
  },
];
export const winnerCases = [
  {
    id: "board-tie",
    hero: "8s 3h",
    villain: "6c 2d",
    board: "Qs Qh 7c 7d Ks",
    why: "У обоих играет доска: две пары и общий кикер. Личные карты не улучшают эти пять карт.",
  },
  {
    id: "royal-board",
    hero: "2c 2h",
    villain: "9d 8d",
    board: "As Ks Qs Js Ts",
    why: "Флеш-рояль на общей доске — максимальная пятёрка для обоих. Личная пара не даёт преимущества.",
  },
  {
    id: "kicker",
    hero: "Qs Jc",
    villain: "Qd Tc",
    board: "Qh 8d 6s 4c 2h",
    why: "Пары равны. Кикеры сравниваем от старшего к младшему: решает первая различающаяся карта.",
  },
  {
    id: "two-pair-kicker",
    hero: "Ks 3h",
    villain: "Tc 2d",
    board: "Js Jh 6c 6d 4s",
    why: "Две пары одинаковы. Побеждает рука со старшим кикером — пятой картой.",
  },
  {
    id: "full-house-order",
    hero: "Ks Kh",
    villain: "Qs Qh",
    board: "Kd Qd 9c 9h 2s",
    why: "Фулл-хаусы сначала сравниваются по трём одинаковым картам. Побеждает рука, у которой они старше.",
  },
  {
    id: "flush-over-straight",
    hero: "Ah 2h",
    villain: "9c Ts",
    board: "5h 6h 7h 8d Kc",
    why: "У одной руки пять карт одной масти, у другой — стрит. Флеш старше стрита.",
  },
];
function remap(cards: string[], map: string[]) {
  return cards.map((c) => c[0] + map[suits.indexOf(c[1])]);
}
// Меняем достоинства с сохранением учебного смысла; проверяем категории и исход.
function variedRanks(cards: string[], counts: number[]) {
  const ranks = "23456789TJQKA";
  const used = [...new Set(cards.map((c) => c[0]))].sort(
    (a, b) => ranks.indexOf(a) - ranks.indexOf(b),
  );
  const hands = (all: string[]) => [
    evaluate([...all.slice(0, counts[0]), ...all.slice(counts[0] + counts[1])]),
    evaluate([
      ...all.slice(counts[0], counts[0] + counts[1]),
      ...all.slice(counts[0] + counts[1]),
    ]),
  ];
  const original = hands(cards);
  for (let attempt = 0; attempt < 40; attempt++) {
    const next = shuffle([...ranks])
      .slice(0, used.length)
      .sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b));
    const mapped = cards.map((c) => next[used.indexOf(c[0])] + c[1]);
    const result = hands(mapped);
    if (
      mapped
        .slice(4)
        .map((c) => c[0])
        .sort()
        .join("") === "88AKK"
    )
      continue;
    if (
      result.every((h, i) => h.score[0] === original[i].score[0]) &&
      compare(result[0].score, result[1].score) ===
        compare(original[0].score, original[1].score)
    )
      return mapped;
  }
  return cards;
}
export type CombinationSkill = "combination" | "best" | "winner";
export function combinationTask(
  skill: CombinationSkill,
  family?: string,
): Task {
  const t: Task = {
    id: crypto.randomUUID(),
    skill,
    title: skillNames[skill],
    prompt: "",
    choices: [],
    answer: "",
    explanation: "",
    hint: "",
    category: "exact",
    revision: 3,
  };
  if (skill === "combination" || skill === "best") {
    const scenario = handCases.find((c) => c.id === family) ?? pick(handCases),
      map = shuffle([...suits]);
    t.scenario = scenario.id;
    const dealt = shuffle(remap(scenario.cards.split(" "), map));
    t.board = dealt.slice(0, 5);
    t.cards = dealt.slice(5);
    const result = evaluate(dealt);
    const displayName =
      result.score[0] === 3
        ? t.cards[0][0] === t.cards[1][0] &&
          result.best.filter((c) => c[0] === t.cards![0][0]).length === 3
          ? "Сет"
          : "Тройка"
        : result.score[0] === 8 && result.score[1] === 14
          ? "Флеш-рояль"
          : result.name;
    if (result.score[0] !== scenario.category)
      throw Error("Invalid teaching case");
    t.answer = displayName;
    t.choices = shuffle([
      displayName,
      ...shuffle(names.filter((n) => n !== result.name)).slice(0, 4),
    ]);
    t.selection = skill === "best";
    t.prompt = t.selection
      ? "Выберите пять карт, которые дают самую сильную комбинацию."
      : "Какая лучшая комбинация в этих семи картах?";
    t.hint =
      "Проверьте каждый вариант ответа: найдутся ли нужные для него пять карт среди общих и личных? Если подходят несколько комбинаций, выбирайте старшую. Не обязательно использовать обе личные карты.";
    t.explanation =
      "Лучшая комбинация: " +
      displayName.toLowerCase() +
      ". " +
      scenario.why.replace("червей", "карт одной масти");
    t.solution = result.best;
  } else if (skill === "winner") {
    const scenario =
        winnerCases.find((c) => c.id === family) ?? pick(winnerCases),
      map = shuffle([...suits]);
    const source = [
      ...scenario.hero.split(" "),
      ...scenario.villain.split(" "),
      ...scenario.board.split(" "),
    ];
    const dealt = remap(
      scenario.id === "royal-board" ? source : variedRanks(source, [2, 2]),
      map,
    );
    let hero = dealt.slice(0, 2),
      villain = dealt.slice(2, 4);
    if (Math.random() < 0.5) [hero, villain] = [villain, hero];
    t.cards = hero;
    t.opponent = villain;
    t.board = dealt.slice(4);
    t.scenario = scenario.id;
    validate([...hero, ...villain, ...t.board]);
    const a = evaluate([...hero, ...t.board]),
      b = evaluate([...villain, ...t.board]),
      result = compare(a.score, b.score);
    t.answer = result === 0 ? "Делёж" : result > 0 ? "Вы" : "Соперник";
    t.choices = ["Вы", "Делёж", "Соперник"];
    t.prompt = "Вскрытие. Кому достанется банк?";
    t.hint =
      "Сравните лучшие пятёрки: вид комбинации, её достоинства, затем кикеры.";
    t.explanation =
      "У вас: " +
      a.name.toLowerCase() +
      ". У соперника: " +
      b.name.toLowerCase() +
      ". " +
      scenario.why.replace("червей", "карт одной масти");
    t.solution = a.best;
    t.opponentSolution = b.best;
  }
  return t;
}

export function combinationSession(skill: CombinationSkill): Task[] {
  if (skill === "combination")
    return shuffle([
      "wheel",
      "flush",
      pick(["two-trips", "full-house"]),
      pick(["quads", "straight-flush", "royal"]),
      pick(["high", "pair", "two-pairs", "trips", "no-wrap"]),
    ]).map((id) => combinationTask(skill, id));
  if (skill === "best")
    return shuffle([
      "two-trips",
      "three-pairs",
      "wheel",
      "flush",
      pick(["quads", "straight-flush", "royal", "pair"]),
    ]).map((id) => combinationTask(skill, id));
  return shuffle([
    pick(["board-tie", "royal-board"]),
    "kicker",
    "two-pair-kicker",
    "full-house-order",
    "flush-over-straight",
  ]).map((id) => combinationTask("winner", id));
}
