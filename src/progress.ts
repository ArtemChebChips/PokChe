import { tableSeats } from "./flowScene";
import type { Skill } from "./content";
import type { Task } from "./tasks";
import { validate } from "./poker";
export type Attempt = {
  taskId?: string;
  scenario?: string;
  skill: Skill;
  correct: boolean;
  at: string;
  assisted: boolean;
};
export type Progress = {
  version: 1;
  lessons: string[];
  attempts: Attempt[];
  mistakes: Task[];
  format: "cash" | "tournament";
  days: string[];
  reading?: Record<string, number>;
  lastLesson?: string;
};
export const storageKey = "river.progress.v1";
export const fresh = (): Progress => ({
  version: 1,
  lessons: [],
  attempts: [],
  mistakes: [],
  format: "cash",
  days: [],
});
const skills = [
  "planning",
  "adjustment",
  "advanced",
  "betting",
  "ranges",
  "cards",
  "combination",
  "best",
  "winner",
  "order",
  "stack",
  "notation",
  "preflop",
  "odds",
  "spr",
  "texture",
  "equity",
];
function validTask(t: Task, depth = 0): boolean {
  if (depth > 2) return false;
  if (t?.nextTask !== undefined && !validTask(t.nextTask, depth + 1))
    return false;
  if (
    !t ||
    typeof t.id !== "string" ||
    !skills.includes(t.skill) ||
    typeof t.title !== "string" ||
    typeof t.prompt !== "string" ||
    typeof t.answer !== "string" ||
    typeof t.hint !== "string" ||
    typeof t.explanation !== "string" ||
    t.category !== "exact" ||
    !Array.isArray(t.choices) ||
    !t.choices.every((c) => typeof c === "string") ||
    !t.choices.includes(t.answer)
  )
    return false;
  if (
    ![t.cards, t.board, t.opponent].every(
      (c) =>
        c === undefined ||
        (Array.isArray(c) && c.every((x) => typeof x === "string")),
    )
  )
    return false;
  try {
    validate([...(t.cards ?? []), ...(t.board ?? []), ...(t.opponent ?? [])]);
  } catch {
    return false;
  }
  if (t.model !== undefined && typeof t.model !== "string") return false;
  if (
    t.acceptedAnswers !== undefined &&
    (!Array.isArray(t.acceptedAnswers) ||
      !t.acceptedAnswers.length ||
      !t.acceptedAnswers.includes(t.answer) ||
      !t.acceptedAnswers.every(
        (a) => typeof a === "string" && t.choices.includes(a),
      ))
  )
    return false;
  if (t.range !== undefined) {
    if (
      !Array.isArray(t.range) ||
      !t.range.length ||
      !t.range.some((h) => h.weight > 0)
    )
      return false;
    const seen = new Set<string>();
    for (const h of t.range) {
      if (
        !h ||
        !Number.isFinite(h.weight) ||
        h.weight < 0 ||
        !Array.isArray(h.cards) ||
        h.cards.length !== 2
      )
        return false;
      try {
        validate([...(t.cards ?? []), ...(t.board ?? []), ...h.cards]);
      } catch {
        return false;
      }
      const k = [...h.cards].sort().join("");
      if (seen.has(k)) return false;
      seen.add(k);
    }
  }
  if (t.scene !== undefined) {
    const scene = t.scene;
    if (
      !scene ||
      typeof scene.street !== "string" ||
      !tableSeats.includes(scene.hero) ||
      !Array.isArray(scene.cards) ||
      scene.cards.length !== 2 ||
      !Array.isArray(scene.board) ||
      ![0, 3, 4, 5].includes(scene.board.length) ||
      !Array.isArray(scene.folded) ||
      !scene.folded.every((s) => tableSeats.includes(s)) ||
      !scene.bets ||
      typeof scene.bets !== "object" ||
      Array.isArray(scene.bets) ||
      !Object.entries(scene.bets).every(
        ([seat, amount]) =>
          tableSeats.includes(seat) && Number.isFinite(amount) && amount >= 0,
      ) ||
      !Number.isFinite(scene.previousPot) ||
      scene.previousPot < 0 ||
      (scene.opponent !== undefined &&
        (!scene.opponent ||
          !tableSeats.includes(scene.opponent.seat) ||
          !Array.isArray(scene.opponent.cards) ||
          scene.opponent.cards.length !== 2))
    )
      return false;
    try {
      validate([
        ...scene.cards,
        ...scene.board,
        ...(scene.opponent?.cards ?? []),
      ]);
    } catch {
      return false;
    }
  }
  if (
    t.stacks !== undefined &&
    (!t.stacks ||
      typeof t.stacks.unit !== "string" ||
      ![t.stacks.hero, t.stacks.opponent, t.stacks.pot ?? 0].every(
        (n) => Number.isFinite(n) && n >= 0,
      ))
  )
    return false;
  for (const solution of [t.solution, t.opponentSolution]) {
    if (solution !== undefined) {
      if (!Array.isArray(solution) || solution.length !== 5) return false;
      try {
        validate(solution, 5, 5);
      } catch {
        return false;
      }
    }
  }
  if (
    t.selection &&
    (t.skill !== "best" ||
      (t.cards?.length ?? 0) + (t.board?.length ?? 0) !== 7)
  )
    return false;
  return true;
}
export function validProgress(p: unknown): p is Progress {
  if (!p || typeof p !== "object") return false;
  const v = p as Progress;
  return (
    (v.reading === undefined ||
      (!!v.reading &&
        typeof v.reading === "object" &&
        !Array.isArray(v.reading) &&
        Object.values(v.reading).every(
          (n) => Number.isInteger(n) && n >= 0,
        ))) &&
    (v.lastLesson === undefined || typeof v.lastLesson === "string") &&
    v.version === 1 &&
    Array.isArray(v.lessons) &&
    v.lessons.every((x) => typeof x === "string") &&
    Array.isArray(v.days) &&
    v.days.every((x) => typeof x === "string") &&
    (v.format === "cash" || v.format === "tournament") &&
    Array.isArray(v.attempts) &&
    v.attempts.every(
      (a) =>
        a &&
        skills.includes(a.skill) &&
        (a.taskId === undefined || typeof a.taskId === "string") &&
        (a.scenario === undefined || typeof a.scenario === "string") &&
        typeof a.correct === "boolean" &&
        typeof a.assisted === "boolean" &&
        typeof a.at === "string" &&
        Number.isFinite(Date.parse(a.at)),
    ) &&
    Array.isArray(v.mistakes) &&
    v.mistakes.every((t) => validTask(t))
  );
}
export function loadProgress(): { progress: Progress; error: string } {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { progress: fresh(), error: "" };
    const parsed = JSON.parse(raw);
    if (!validProgress(parsed)) throw Error();
    return { progress: parsed, error: "" };
  } catch {
    return {
      progress: fresh(),
      error:
        "Не удалось прочитать сохранение. Новые результаты пока не записываются поверх него. Восстановите резервную копию в настройках.",
    };
  }
}
export function record(
  p: Progress,
  task: Task,
  correct: boolean,
  assisted: boolean,
): Progress {
  const day = new Date().toLocaleDateString("sv-SE");
  return {
    ...p,
    attempts: [
      ...p.attempts,
      {
        skill: task.skill,
        taskId: task.id,
        scenario: task.scenario,
        correct,
        assisted,
        at: new Date().toISOString(),
      },
    ].slice(-5000),
    days: [...new Set([...p.days, day])],
    mistakes: correct
      ? p.mistakes.filter((t) => t.id !== task.id)
      : [...p.mistakes.filter((t) => t.id !== task.id), task].slice(-200),
  };
}
export function mastery(p: Progress, skill: Skill) {
  const needed: Partial<Record<Skill, number>> = {
    texture: 3,
    equity: 3,
    betting: 3,
    ranges: 3,
    planning: 2,
    adjustment: 3,
    advanced: 3,
  };
  const distinct = needed[skill] ?? 0;
  const seen = new Set<string>();
  const a = p.attempts
    .filter((x) => x.skill === skill && !x.assisted)
    .slice()
    .reverse()
    .filter((x) => {
      if (!distinct) return true;
      if (!x.taskId || seen.has(x.taskId)) return false;
      seen.add(x.taskId);
      return true;
    })
    .slice(0, 10);
  const diversity = new Set(
    a.filter((x) => x.correct && x.scenario).map((x) => x.scenario),
  ).size;
  return {
    total: a.length,
    diversity,
    requiredDiversity: distinct,
    accuracy: a.length
      ? Math.round((a.filter((x) => x.correct).length / a.length) * 100)
      : 0,
    mastered:
      a.length >= 10 &&
      a.filter((x) => x.correct).length >= 8 &&
      diversity >= distinct,
  };
}
