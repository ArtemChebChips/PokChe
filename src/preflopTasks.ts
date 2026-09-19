import type { Task } from "./tasks";
import { pick, shuffle } from "./random";
export const preflopFamilies = [
  "label",
  "call",
  "min-raise",
  "bb-option",
  "reprice",
];
export function preflopTask(family = pick(preflopFamilies)): Task {
  const bb = pick([2, 4, 6]),
    open = bb * pick([2, 3, 4]),
    raised = open * 3;
  const t: Task = {
    id: crypto.randomUUID(),
    skill: "preflop",
    title: "Решения на префлопе",
    scenario: family,
    revision: 1,
    prompt: "",
    answer: "",
    choices: [],
    explanation: "",
    hint: "",
    category: "exact",
    context: `Безлимитный холдем · блайнды ${bb / 2} / ${bb} · без анте · полные повышения`,
    scene: {
      street: "Префлоп",
      hero: "BB",
      cards: ["As", "Jh"],
      board: [],
      previousPot: 0,
      bets: { SB: bb / 2, BB: bb, UTG: open },
      folded: ["HJ", "CO", "BTN", "SB"],
    },
  };
  const scene = t.scene!;
  const options = (answer: string, others: string[]) => {
    t.answer = answer;
    t.choices = shuffle([...new Set([answer, ...others])]);
  };
  if (family === "label") {
    const kind = pick(["limp", "open", "three-bet"]);
    scene.hero = kind === "three-bet" ? "BTN" : "UTG";
    scene.folded = kind === "three-bet" ? ["HJ", "CO"] : [];
    scene.bets = { SB: bb / 2, BB: bb, UTG: kind === "limp" ? bb : open };
    if (kind === "three-bet") scene.bets.BTN = raised;
    t.prompt =
      kind === "limp"
        ? `UTG первым вошёл в банк, уравняв ${bb}. Как называется это действие?`
        : kind === "open"
          ? `До UTG никто не повышал. Он поставил ${open}. Как называется его действие?`
          : `UTG открыл до ${open}, BTN повысил до ${raised}. Как называется повышение BTN?`;
    options(
      kind === "limp" ? "Лимп" : kind === "open" ? "Открытие рейзом" : "3-бет",
      ["Лимп", "Открытие рейзом", "3-бет", "Чек"],
    );
    t.explanation =
      kind === "limp"
        ? "UTG уравнял большой блайнд без повышения: это лимп."
        : kind === "open"
          ? "Это первое повышение на префлопе — открытие рейзом."
          : "Это повышение после открытия — 3-бет. Название задаёт порядок повышений, а не множитель размера.";
    t.hint =
      "Было ли повышение до этого действия? Или игрок только уравнял большой блайнд?";
  } else if (family === "bb-option") {
    scene.bets.UTG = bb;
    t.prompt = `UTG уравнял ${bb}, остальные сделали пас. Вы на BB, никто не повышал. Как увидеть флоп без доплаты?`;
    options("Сделать чек", [
      "Добавить ещё один BB",
      "Сделать минимальный рейз",
      "Чек запрещён",
    ]);
    t.explanation =
      "Ваш большой блайнд уже равен ставке лимпера. Чек закрывает этот круг без доплаты; вы также могли бы повысить, но это стоило бы дополнительных фишек.";
    t.hint = "Сравните вашу уже поставленную сумму с текущей ставкой.";
  } else {
    const second =
      family === "reprice" || (family === "min-raise" && Math.random() < 0.5);
    const target = second ? raised : open,
      previous = second ? open : bb;
    if (second) {
      scene.bets.BTN = raised;
      scene.folded = ["HJ", "CO", "SB"];
    }
    if (family === "reprice") {
      scene.hero = "UTG";
      scene.folded.push("BB");
    }
    const paid = scene.bets[scene.hero] ?? 0;
    if (family === "min-raise") {
      t.prompt = second
        ? `UTG повысил с ${bb} до ${open}, BTN — до ${raised}. До какой суммы возможен ваш минимальный полный рейз?`
        : `UTG повысил с ${bb} до ${open}. До какой суммы возможен ваш минимальный полный рейз?`;
      const minimum = target + (target - previous);
      options(
        String(minimum),
        [String(target), String(target * 2), String(minimum + bb)].filter(
          (x) => x !== String(minimum),
        ),
      );
      t.explanation = `Последнее полное повышение: ${target} − ${previous} = ${target - previous}. Прибавляем столько же к ставке ${target}: минимум до ${minimum}. Это итоговая ставка, не сумма доплаты.`;
      t.hint =
        "Найдите величину последнего повышения и прибавьте её к текущей ставке.";
    } else {
      t.prompt =
        family === "reprice"
          ? `Вы открыли до ${open}, BTN повысил до ${raised}. Остальные вышли. Сколько вам добавить для колла?`
          : `Вы на BB уже поставили ${bb}, UTG открыл до ${open}. Остальные вышли. Сколько добавить для колла?`;
      options(String(target - paid), [
        String(target),
        String(target + paid),
        String(target - paid + bb),
      ]);
      t.explanation = `Текущая ставка ${target}, вы уже вложили ${paid}. Добавить: ${target} − ${paid} = ${target - paid}.`;
      t.hint = "Не платите заново ту часть, которую уже вложили на префлопе.";
    }
  }
  return t;
}
export function preflopSession() {
  return shuffle(preflopFamilies.map((f) => preflopTask(f)));
}
