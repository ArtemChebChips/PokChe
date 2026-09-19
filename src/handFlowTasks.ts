import type { Task } from "./tasks";
import { pick, shuffle } from "./random";
import { preflopOrder, postflopOrder } from "./poker";
export const flowFamilies = [
  "preflop",
  "postflop",
  "street",
  "call",
  "raise",
  "check",
  "fold",
  "blind",
];
const labels: Record<string, string> = {
  UTG: "UTG — Under the Gun",
  HJ: "HJ — Hijack",
  CO: "CO — Cutoff",
  BTN: "BTN — Button",
  SB: "SB — малый блайнд",
  BB: "BB — большой блайнд",
};
export function handFlowTask(family = pick(flowFamilies)): Task {
  const t: Task = {
    id: crypto.randomUUID(),
    skill: "order",
    title: "Ход раздачи",
    scenario: family,
    revision: 3,
    prompt: "",
    choices: [],
    answer: "",
    explanation: "",
    hint: "",
    category: "exact",
  };
  const options = (answer: string, choices: string[]) => {
    t.answer = answer;
    t.choices = shuffle([...new Set([answer, ...choices])]);
  };
  if (family === "preflop" || family === "postflop") {
    const pre = family === "preflop",
      order = pre ? preflopOrder : postflopOrder;
    const index = Math.floor(Math.random() * 6) - 1;
    t.context = "6-max · все шесть игроков в раздаче, никто не в олл-ине";
    t.prompt =
      (pre ? "Префлоп" : "Флоп") +
      ": " +
      (index < 0
        ? "кто действует первым?"
        : "кто действует сразу после " +
          labels[order[index]] +
          " в первом круге решений?");
    options(
      labels[order[index + 1]],
      shuffle(order.filter((p) => p !== order[index + 1]))
        .slice(0, 3)
        .map((p) => labels[p]),
    );
    t.explanation =
      "Очередь: " +
      order.map((p) => labels[p]).join(" → ") +
      ". После повышения уже ходившие игроки тоже могут получить ход снова.";
    t.hint = pre
      ? "Найдите большой блайнд. Первый ход — у следующего места по часовой стрелке."
      : "На флопе очередь начинается слева от баттона. Выбывших и игроков в олл-ине пропускают.";
  } else if (family === "street") {
    const [street, count] = pick([
      ["Префлоп", 0],
      ["Флоп", 3],
      ["Тёрн", 4],
      ["Ривер", 5],
    ] as const);
    t.prompt = street + ": сколько общих карт уже открыто?";
    options(String(count), ["0", "3", "4", "5"]);
    t.explanation =
      "Префлоп — 0 общих карт, флоп — 3, тёрн — 4, ривер — 5. Личные карты в это число не входят.";
    t.hint = "Вспомните порядок открытия: сначала три вместе, затем по одной.";
  } else if (family === "call" || family === "raise") {
    const blind = pick([2, 4, 6]),
      target = blind * 3,
      minimum = target + (target - blind);
    t.context = "Префлоп · вы на большом блайнде · фишек достаточно";
    const call = family === "call",
      total = call ? target : minimum,
      add = total - blind;
    t.prompt =
      "Вы уже поставили " +
      blind +
      " фишки. Соперник повысил до " +
      target +
      ". Сколько нужно добавить " +
      (call ? "для колла?" : "для рейза до " + minimum + "?");
    options(String(add), [String(total), String(total + blind), String(blind)]);
    t.explanation =
      "Ваша итоговая ставка " +
      total +
      ", уже поставлено " +
      blind +
      ". Добавить: " +
      total +
      " − " +
      blind +
      " = " +
      add +
      " фишек.";
    t.hint =
      "Считайте только недостающие фишки. Уже поставленный блайнд входит в вашу ставку.";
  } else if (family === "check") {
    const facing = Math.random() < 0.5;
    t.prompt = facing
      ? "На флопе соперник поставил 6 фишек. Вы ещё не ставили. Можно ли сделать чек?"
      : "На флопе перед вами все сделали чек. Можно ли тоже сделать чек?";
    options(facing ? "Нет" : "Да", ["Да", "Нет"]);
    t.explanation = facing
      ? "Есть неуравненная ставка. Можно сбросить, уравнять или допустимо повысить. Чек недоступен."
      : "Нет ставки к уравниванию. Чек передаёт ход без вложения фишек.";
    t.hint = "Проверьте, есть ли сумма, которую нужно уравнять.";
  } else if (family === "fold") {
    t.prompt =
      "Вы сделали фолд. Что происходит с фишками, которые вы уже поставили?";
    options("Остаются в банке", [
      "Возвращаются в ваш стек",
      "Возвращается только блайнд",
    ]);
    t.explanation =
      "Фолд прекращает ваше участие в раздаче. Уже поставленные фишки остаются в банке.";
    t.hint = "Сброс карт не отменяет предыдущие ставки.";
  } else {
    const small = pick([1, 2, 5]),
      big = small * 2;
    t.prompt =
      "Без анте. Малый блайнд — " +
      small +
      ", большой — " +
      big +
      ". Сколько фишек в банке до первого решения?";
    options(String(small + big), [String(big), "0", String(big * 2)]);
    t.explanation =
      "Обе обязательные ставки уже в банке: " +
      small +
      " + " +
      big +
      " = " +
      (small + big) +
      ".";
    t.hint = "Блайнды делают ставки до получения карт. Учтите обе.";
  }
  return t;
}
export function handFlowSession() {
  return shuffle([
    handFlowTask("preflop"),
    handFlowTask("postflop"),
    handFlowTask("street"),
    handFlowTask(pick(["call", "raise"])),
    handFlowTask(pick(["check", "fold", "blind"])),
  ]);
}
