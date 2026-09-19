import { evaluate, compare, names, suits, validate } from "./poker";
import { shuffle, pick } from "./random";
import { skillNames } from "./content";
import type { Task } from "./tasks";
export const handCases = [
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
    hero: "9s 3h",
    villain: "7c 2d",
    board: "Ks Kh 8c 8d As",
    why: "У обоих играет доска: две пары и туз-кикер. Личные девятка и семёрка не становятся шестыми кикерами.",
  },
  {
    id: "royal-board",
    hero: "2c 2h",
    villain: "9d 8d",
    board: "As Ks Qs Js Ts",
    why: "Роял-флеш на общей доске — максимальная пятёрка для обоих. Личная пара не даёт преимущества.",
  },
  {
    id: "kicker",
    hero: "As Kc",
    villain: "Ad Qc",
    board: "Ah 9d 7s 4c 2h",
    why: "Пары тузов равны. Первый отличающийся кикер — король против дамы; король старше.",
  },
  {
    id: "two-pair-kicker",
    hero: "As 3h",
    villain: "Qc 2d",
    board: "Ks Kh 8c 8d 4s",
    why: "У обоих две пары королей и восьмёрок. Решает пятая карта: туз против дамы.",
  },
  {
    id: "full-house-order",
    hero: "Ks Kh",
    villain: "Qs Qh",
    board: "Kd Qd 9c 9h 2s",
    why: "Фулл-хаусы сначала сравниваются по тройке: короли старше дам. Пара девяток у обоих.",
  },
  {
    id: "flush-over-straight",
    hero: "Ah 2h",
    villain: "9c Ts",
    board: "5h 6h 7h 8d Kc",
    why: "У одной руки пять червей, у другой стрит до десятки. Флеш старше стрита.",
  },
];
function remap(cards: string[], map: string[]) {
  return cards.map((c) => c[0] + map[suits.indexOf(c[1])]);
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
    revision: 2,
  };
  if (skill === "combination" || skill === "best") {
    const scenario = handCases.find((c) => c.id === family) ?? pick(handCases),
      map = shuffle([...suits]);
    t.scenario = scenario.id;
    t.cards = shuffle(remap(scenario.cards.split(" "), map));
    const result = evaluate(t.cards);
    if (result.score[0] !== scenario.category)
      throw Error("Invalid teaching case");
    t.answer = result.name;
    t.choices = shuffle([
      result.name,
      ...shuffle(names.filter((n) => n !== result.name)).slice(0, 3),
    ]);
    t.selection = skill === "best";
    t.prompt = t.selection
      ? "Выберите лучшую пятёрку из семи карт."
      : "Какая лучшая комбинация в этих семи картах?";
    t.hint =
      "Выберите ровно пять карт. Стрит: пять подряд. Флеш: пять одной масти.";
    t.explanation =
      "Лучшая комбинация: " +
      result.name.toLowerCase() +
      ". " +
      scenario.why.replace("червей", "карт одной масти");
    t.solution = result.best;
  } else if (skill === "winner") {
    const scenario =
        winnerCases.find((c) => c.id === family) ?? pick(winnerCases),
      map = shuffle([...suits]);
    let hero = remap(scenario.hero.split(" "), map),
      villain = remap(scenario.villain.split(" "), map);
    if (Math.random() < 0.5) [hero, villain] = [villain, hero];
    t.cards = hero;
    t.opponent = villain;
    t.board = remap(scenario.board.split(" "), map);
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
      pick(["quads", "straight-flush"]),
      pick(["high", "pair", "two-pairs", "trips", "no-wrap"]),
    ]).map((id) => combinationTask(skill, id));
  if (skill === "best")
    return shuffle([
      "two-trips",
      "three-pairs",
      "wheel",
      "flush",
      pick(["quads", "straight-flush", "pair"]),
    ]).map((id) => combinationTask(skill, id));
  return shuffle([
    pick(["board-tie", "royal-board"]),
    "kicker",
    "two-pair-kicker",
    "full-house-order",
    "flush-over-straight",
  ]).map((id) => combinationTask("winner", id));
}
