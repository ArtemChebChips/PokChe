import {
  boardTask,
  boardFamilies,
  targetedEquityTask,
  drawCases,
} from "./boardTasks";
import { preflopTask, preflopSession } from "./preflopTasks";
import { oddsTask, oddsFamilies } from "./mathTasks";
import type { StackState } from "./components/StackExample";
import type { FlowScene } from "./flowScene";
import { handFlowTask, handFlowSession } from "./handFlowTasks";
import { combinationTask, combinationSession } from "./combinationTasks";
import { shuffle, pick } from "./random";
export { shuffle } from "./random";
import { deck, ranks, suits, evaluate, compare, spr, handLabel } from "./poker";
import { type Skill, skillNames } from "./content";
export type CardKind = "figures" | "ace" | "equal" | "numbers";
export type Task = {
  scene?: FlowScene;
  stacks?: StackState;
  variant?: CardKind;
  scenario?: string;
  revision?: number;
  solution?: string[];
  opponentSolution?: string[];
  id: string;
  skill: Skill;
  title: string;
  prompt: string;
  cards?: string[];
  board?: string[];
  opponent?: string[];
  choices: string[];
  answer: string;
  explanation: string;
  hint: string;
  details?: string;
  category: "exact";
  selection?: boolean;
  context?: string;
};
export const allSkills = Object.keys(skillNames) as Skill[];
const fmt = (n: number) => Number(n.toFixed(1)).toLocaleString("ru-RU");
export function generate(skill: Skill): Task {
  if (skill === "texture") return boardTask();
  if (skill === "equity") return targetedEquityTask();
  if (skill === "cards")
    return cardTask(pick(["figures", "figures", "figures", "ace", "equal"]));
  if (skill === "combination" || skill === "best" || skill === "winner")
    return combinationTask(skill);
  if (skill === "order") return handFlowTask();
  if (skill === "preflop") return preflopTask();
  if (skill === "odds") return oddsTask();
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
  };
  const options = (answer: string, others: string[]) => {
    t.answer = answer;
    t.choices = shuffle([
      answer,
      ...shuffle([...new Set(others)].filter((x) => x !== answer)).slice(0, 3),
    ]);
  };
  if (skill === "stack" || skill === "spr") {
    const a = pick([20, 30, 40, 60, 80, 100]),
      b = pick([25, 40, 50, 75, 100, 120]),
      pot = pick([5, 10, 20]);
    t.stacks = { hero: a, opponent: b, pot, unit: "BB" };
    t.context = `Один на один · в банке ${pot} BB`;
    t.prompt = `У вас осталось ${a} BB, у соперника ${b} BB. ${skill === "stack" ? "Какой эффективный оставшийся стек?" : "Чему равен SPR?"}`;
    const result = skill === "stack" ? Math.min(a, b) : spr(a, b, pot);
    const unit = skill === "stack" ? " BB" : "";
    options(
      fmt(result) + unit,
      [a + b, a, b, result + 1, result * 2, result / 2].map(
        (x) => fmt(x) + unit,
      ),
    );
    t.hint =
      skill === "stack"
        ? "Возьмите меньший стек."
        : "SPR = меньший оставшийся стек ÷ банк.";
    t.explanation =
      skill === "stack"
        ? `min(${a}, ${b}) = ${result} BB. Больше у короткого стека выиграть нельзя.`
        : `min(${a}, ${b}) ÷ ${pot} = ${fmt(result)}. Здесь используем оставшиеся стеки, а не стартовые.`;
  } else if (skill === "notation") {
    t.cards = shuffle(deck).slice(0, 2);
    const label = handLabel(t.cards),
      base = label.slice(0, 2);
    t.prompt = "Как записать эту стартовую руку?";
    options(label, [
      base + "s",
      base + "o",
      base,
      base[0] + base[0],
      base[1] + base[1],
    ]);
    t.hint = "s — одна масть, o — разные. У пары суффикса нет.";
    t.explanation = `${label}: ${label.length === 2 ? "карманная пара" : label.endsWith("s") ? "одномастная рука (suited)" : "разномастная рука (offsuit)"}. Старшее достоинство пишется первым.`;
    if (Math.random() < 0.4) {
      t.cards = undefined;
      t.prompt = "Что означает запись " + label + "?";
      const kind =
        label.length === 2
          ? "Карманная пара"
          : label.endsWith("s")
            ? "Две карты одной масти"
            : "Две карты разных мастей";
      options(
        kind,
        [
          "Карманная пара",
          "Две карты одной масти",
          "Две карты разных мастей",
          "Готовый флеш",
        ].filter((v) => v !== kind),
      );
      t.hint =
        "Посмотрите на достоинства и последнюю букву. У пары суффикса нет.";
    }
  }
  return t;
}
export function check(
  task: Task,
  answer: string,
  selected: string[] = [],
): boolean {
  if (task.selection) {
    const available = [...(task.cards ?? []), ...(task.board ?? [])];
    if (
      selected.length !== 5 ||
      selected.some((c) => !available.includes(c)) ||
      new Set(selected).size !== 5
    )
      return false;
    return compare(evaluate(selected).score, evaluate(available).score) === 0;
  }
  return task.answer === answer;
}

const rankNames: Record<string, string> = {
  J: "валет",
  Q: "дама",
  K: "король",
  A: "туз",
  T: "десятка",
};
export function cardTask(kind: CardKind, pair?: string[]): Task {
  const rs =
    pair ??
    (kind === "figures"
      ? pick([
          ["J", "Q"],
          ["J", "K"],
          ["Q", "K"],
        ])
      : kind === "ace"
        ? ["A", pick(["J", "Q", "K", "9"])]
        : kind === "equal"
          ? Array(2).fill(pick(["J", "Q", "K", "A"]))
          : shuffle([..."23456789T"]).slice(0, 2));
  const ss = shuffle([...suits]),
    cards = shuffle(rs.map((r, i) => r + ss[i]));
  const diff = ranks.indexOf(cards[0][0]) - ranks.indexOf(cards[1][0]);
  const higher = diff > 0 ? cards[0][0] : cards[1][0],
    lower = diff > 0 ? cards[1][0] : cards[0][0];
  return {
    id: crypto.randomUUID(),
    skill: "cards",
    variant: kind,
    title: skillNames.cards,
    prompt: "Какая карта старше по достоинству?",
    cards,
    choices: ["Левая", "Равны", "Правая"],
    answer: diff === 0 ? "Равны" : diff > 0 ? "Левая" : "Правая",
    category: "exact",
    hint: "Валет J → дама Q → король K → туз A. Масти равны.",
    explanation:
      diff === 0
        ? "Достоинства одинаковые. В таком сравнении масть не даёт преимущества: карты равны."
        : (rankNames[higher] ?? higher).charAt(0).toUpperCase() +
          (rankNames[higher] ?? higher).slice(1) +
          " старше, чем " +
          (rankNames[lower] ?? lower) +
          ". Порядок: 2–3–4–5–6–7–8–9–10–J–Q–K–A.",
  };
}
export function generateSession(skills: Skill[], count: number): Task[] {
  if (!skills.length || !Number.isInteger(count) || count < 1 || count > 20)
    throw Error("Invalid session");
  if (skills.length === 1 && skills[0] === "texture")
    return shuffle(boardFamilies)
      .slice(0, count)
      .map((f) => boardTask(f));
  if (skills.length === 1 && skills[0] === "equity")
    return shuffle([...drawCases])
      .slice(0, count)
      .map((c) => targetedEquityTask(c.id));
  if (skills.length === 1 && skills[0] === "preflop" && count === 5)
    return preflopSession();
  if (skills.length === 1 && skills[0] === "odds" && count === 5)
    return shuffle([...oddsFamilies.map((f) => oddsTask(f)), oddsTask()]);
  if (skills.length === 1 && skills[0] === "order" && count === 5)
    return handFlowSession();
  if (skills.length === 1 && skills[0] === "cards" && count === 5)
    return shuffle([
      ...shuffle([
        ["J", "Q"],
        ["J", "K"],
        ["Q", "K"],
      ]).map((pair) => cardTask("figures", pair)),
      cardTask("ace"),
      cardTask(pick(["equal", "numbers"])),
    ]);
  if (
    count === 5 &&
    skills.every((s) => s === "combination" || s === "best" || s === "winner")
  ) {
    if (skills.length === 1)
      return combinationSession(skills[0] as "combination" | "best" | "winner");
    if (
      skills.includes("combination") &&
      skills.includes("best") &&
      skills.includes("winner")
    )
      return shuffle([
        combinationTask("combination", "wheel"),
        combinationTask("combination", "flush"),
        combinationTask("best", "two-trips"),
        combinationTask("best", "three-pairs"),
        combinationTask("winner", Math.random() < 0.5 ? "kicker" : "board-tie"),
      ]);
  }
  return Array.from({ length: count }, (_, i) =>
    generate(skills[i % skills.length]),
  );
}
export function generateSimilar(task: Task): Task {
  if (task.skill === "texture") return boardTask(task.scenario);
  if (task.skill === "equity") return targetedEquityTask(task.scenario);
  if (task.skill === "preflop") return preflopTask(task.scenario);
  if (task.skill === "odds") return oddsTask(task.scenario);
  if (task.skill === "order") return handFlowTask(task.scenario);
  if (
    task.skill === "combination" ||
    task.skill === "best" ||
    task.skill === "winner"
  )
    return combinationTask(task.skill, task.scenario);
  if (task.skill !== "cards") return generate(task.skill);
  const next = cardTask(
    task.variant ?? "figures",
    task.cards?.map((c) => c[0]),
  );
  if (next.cards!.join() === task.cards?.join()) {
    const used = new Set(next.cards!.map((c) => c[1]));
    const alternative = [...suits].find((s) => !used.has(s))!;
    next.cards![0] = next.cards![0][0] + alternative;
  }
  return next;
}
