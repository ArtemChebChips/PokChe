import type { Skill } from "./content";
import type { Task } from "./tasks";
import { validate } from "./poker";
export type Attempt = {
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
  "cards",
  "combination",
  "best",
  "winner",
  "order",
  "stack",
  "notation",
  "odds",
  "spr",
  "texture",
  "equity",
];
function validTask(t: Task): boolean {
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
        typeof a.correct === "boolean" &&
        typeof a.assisted === "boolean" &&
        typeof a.at === "string" &&
        Number.isFinite(Date.parse(a.at)),
    ) &&
    Array.isArray(v.mistakes) &&
    v.mistakes.every(validTask)
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
      { skill: task.skill, correct, assisted, at: new Date().toISOString() },
    ].slice(-5000),
    days: [...new Set([...p.days, day])],
    mistakes: correct
      ? p.mistakes.filter((t) => t.id !== task.id)
      : [...p.mistakes.filter((t) => t.id !== task.id), task].slice(-200),
  };
}
export function mastery(p: Progress, skill: Skill) {
  const a = p.attempts
    .filter((x) => x.skill === skill && !x.assisted)
    .slice(-10);
  return {
    total: a.length,
    accuracy: a.length
      ? Math.round((a.filter((x) => x.correct).length / a.length) * 100)
      : 0,
    mastered: a.length >= 10 && a.filter((x) => x.correct).length >= 8,
  };
}
