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
  "showdown",
  "last-player",
];
const labels: Record<string, string> = {
  UTG: "UTG — У Т Г",
  HJ: "HJ — хайджек",
  CO: "CO — катофф",
  BTN: "BTN — баттон",
  SB: "SB — малый блайнд",
  BB: "BB — большой блайнд",
};
export function handFlowTask(family = pick(flowFamilies)): Task {
  const t: Task = {
    id: crypto.randomUUID(),
    skill: "order",
    title: "Ход раздачи",
    scenario: family,
    revision: 4,
    prompt: "",
    choices: [],
    answer: "",
    explanation: "",
    hint: "",
    category: "exact",
    scene: {
      street: "Префлоп",
      hero: "BB",
      cards: ["As", "Jh"],
      board: [],
      bets: { SB: 1, BB: 2 },
      previousPot: 0,
      folded: [],
    },
  };
  const scene = t.scene!;
  const options = (answer: string, choices: string[]) => {
    t.answer = answer;
    t.choices = shuffle([...new Set([answer, ...choices])]);
  };
  if (family === "preflop" || family === "postflop") {
    const pre = family === "preflop",
      order = pre ? preflopOrder : postflopOrder;
    const index = Math.floor(Math.random() * 6) - 1;
    scene.street = pre
      ? "Префлоп · очередь действий"
      : "Флоп · очередь действий";
    scene.board = pre ? [] : ["Qh", "8c", "3s"];
    scene.bets = pre ? { SB: 1, BB: 2 } : {};
    scene.previousPot = pre ? 0 : 12;
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
    scene.street = street;
    scene.board = ["Qh", "8c", "3s", "Kd", "2h"].slice(0, count);
    scene.bets = count ? {} : { SB: 1, BB: 2 };
    scene.previousPot = count ? 12 : 0;
    t.prompt = street + ": сколько общих карт уже открыто?";
    options(String(count), ["0", "3", "4", "5"]);
    t.explanation =
      "Префлоп — 0 общих карт, флоп — 3, тёрн — 4, ривер — 5. Личные карты в это число не входят.";
    t.hint = "Вспомните порядок открытия: сначала три вместе, затем по одной.";
  } else if (family === "call" || family === "raise") {
    const blind = pick([2, 4, 6]),
      target = blind * 3,
      minimum = target + (target - blind);
    scene.bets = { SB: blind / 2, BB: blind, UTG: target };
    scene.folded = ["HJ", "CO", "BTN", "SB"];
    scene.active = "BB";
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
    scene.street = "Флоп · ваш ход";
    scene.hero = "BTN";
    scene.board = ["Qh", "8c", "3s"];
    scene.bets = facing ? { BB: 6 } : {};
    scene.previousPot = 12;
    scene.folded = ["UTG", "HJ", "CO", "SB"];
    t.prompt = facing
      ? "На флопе соперник поставил 6 фишек. Вы ещё не ставили. Можно ли сделать чек?"
      : "На флопе перед вами все сделали чек. Можно ли тоже сделать чек?";
    options(facing ? "Нет" : "Да", ["Да", "Нет"]);
    t.explanation = facing
      ? "Есть неуравненная ставка. Можно сбросить, уравнять или допустимо повысить. Чек недоступен."
      : "Нет ставки к уравниванию. Чек передаёт ход без вложения фишек.";
    t.hint = "Проверьте, есть ли сумма, которую нужно уравнять.";
  } else if (family === "showdown") {
    const split = Math.random() < 0.5;
    scene.street = "Вскрытие · ставки завершены";
    scene.hero = "BTN";
    scene.cards = split ? ["Qs", "3h"] : ["As", "Jh"];
    scene.board = split
      ? ["Ks", "Kh", "8c", "8d", "Ad"]
      : ["Ah", "9c", "5s", "3d", "2h"];
    scene.opponent = { seat: "BB", cards: split ? ["7c", "2d"] : ["Ac", "Th"] };
    scene.bets = {};
    scene.previousPot = pick([20, 40, 60]);
    scene.folded = ["UTG", "HJ", "CO", "SB"];
    const opponentWins = !split && Math.random() < 0.5;
    if (opponentWins)
      [scene.cards, scene.opponent.cards] = [scene.opponent.cards, scene.cards];
    t.prompt = "Все ставки уравнены. Кто забирает банк?";
    options(split ? "Делёж" : opponentWins ? "Соперник" : "Вы", [
      "Вы",
      "Соперник",
      "Делёж",
    ]);
    t.explanation = split
      ? "У обоих играют общие K–K–8–8–A. Личные карты не улучшают пятёрку: банк делится поровну."
      : "У обоих пара тузов. Ваш валет старше десятки соперника: выигрывает ваша пятёрка A–A–J–9–5.";
    if (opponentWins)
      t.explanation =
        "У обоих пара тузов, но валет соперника старше вашей десятки. Побеждает его пятёрка A–A–J–9–5.";
    t.hint =
      "Составьте лучшие пять карт для каждого игрока. Затем сравните их по порядку.";
  } else if (family === "last-player") {
    scene.street = "Флоп · соперник сбросил карты";
    scene.hero = "BTN";
    scene.board = ["Qh", "8c", "3s"];
    scene.bets = { BTN: 6 };
    scene.previousPot = 12;
    scene.folded = ["UTG", "HJ", "CO", "SB", "BB"];
    t.prompt =
      "Вы поставили 6, последний соперник сделал пас. Нужно ли собирать комбинацию, чтобы забрать банк?";
    options("Нет, вы уже выиграли", [
      "Да, нужна хотя бы пара",
      "Нужно дождаться ривера",
    ]);
    t.explanation =
      "Все соперники сбросили карты: вы выигрываете прежний банк 12 без вскрытия. Ваша неуравненная ставка 6 возвращается вам. Всего со стола к вам поступает 18 фишек.";
    t.hint = "Сколько участников ещё борются за банк?";
  } else if (family === "fold") {
    scene.folded = ["BB"];
    scene.bets = { SB: 1, BB: 2, UTG: 6 };
    scene.street = "Префлоп · вы сделали пас";
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
    scene.bets = { SB: small, BB: big };
    scene.hidePot = true;
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
    handFlowTask(pick(["check", "fold", "blind", "showdown", "last-player"])),
  ]);
}
