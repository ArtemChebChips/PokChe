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
    revision: 5,
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
    const skipped = pick([1, 2, 3]);
    scene.folded = order.slice(0, skipped);
    scene.hero = "BTN";
    scene.street = pre ? "Префлоп" : "Флоп · начало торгов";
    scene.board = pre ? [] : ["Qh", "8c", "3s"];
    scene.bets = pre ? { SB: 1, BB: 2 } : {};
    scene.previousPot = pre ? 0 : 12;
    t.context = "Серые места — пас · остальные игроки могут действовать";
    t.prompt = pre
      ? scene.folded.join(", ") + " сделали пас. Кто действует следующим?"
      : "Начинаются торги на флопе. " +
        scene.folded.join(", ") +
        " вышли из раздачи на префлопе. Кто действует первым?";
    options(
      labels[order[skipped]],
      order
        .filter((p) => p !== order[skipped])
        .slice(0, 3)
        .map((p) => labels[p]),
    );
    t.explanation =
      "Пропускаем игроков в пасе. Первый оставшийся в очереди — " +
      labels[order[skipped]] +
      ". Полный порядок: " +
      order.join(" → ") +
      ".";
    t.hint = pre
      ? "После большого блайнда ищите первого игрока, который ещё не сделал пас."
      : "На новой улице начинаем слева от баттона и пропускаем тех, кто выбыл.";
  } else if (family === "street") {
    const variant = pick(["sequence", "flop-checks", "river-checks"]);
    scene.hero = "BTN";
    if (variant === "sequence") {
      scene.street = "Порядок улиц";
      t.prompt =
        "Ставки уравнивают на каждом круге, в игре остаются двое. В каком порядке проходят улицы?";
      options("Префлоп → флоп → тёрн → ривер", [
        "Префлоп → тёрн → флоп → ривер",
        "Флоп → префлоп → тёрн → ривер",
        "Префлоп → флоп → ривер → тёрн",
      ]);
      t.explanation =
        "Сначала префлоп с личными картами, затем флоп из трёх общих, тёрн — четвёртая и ривер — пятая. Между улицами проходят торги.";
    } else {
      const river = variant === "river-checks";
      scene.street = river
        ? "Ривер · оба сделали чек"
        : "Флоп · оба сделали чек";
      scene.board = ["Qh", "8c", "3s", "Kd", "2h"].slice(0, river ? 5 : 3);
      scene.folded = ["UTG", "HJ", "CO", "SB"];
      scene.bets = {};
      scene.previousPot = 12;
      t.prompt =
        "В раздаче вы на BTN и соперник на BB. Оба сделали чек. Что происходит дальше?";
      options(
        river
          ? "Вскрытие: сравниваем лучшие пятёрки"
          : "Открывается тёрн; первым действует BB",
        [
          river
            ? "Открывается ещё одна общая карта"
            : "Открывается тёрн; первым действует BTN",
          "Нужно сразу начинать новую раздачу",
          river ? "Первым забирает банк BTN" : "Сразу открываются тёрн и ривер",
        ],
      );
      t.explanation = river
        ? "После завершения торгов на ривере общих карт больше не открывают. Оставшиеся игроки сравнивают лучшие пятёрки."
        : "Все сделали чек, значит круг завершён. Открывают одну карту тёрна, затем снова торги: BB действует раньше BTN.";
    }
    t.hint =
      "Сначала проверьте, завершены ли торги. Затем вспомните следующую улицу и очередь на ней.";
  } else if (family === "call" || family === "raise") {
    const blind = pick([2, 4, 6]),
      target = blind * pick([2, 3, 4]),
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
    t.prompt = facing
      ? "На флопе BB поставил 6, вы ещё не ставили. Какие действия вам доступны при достаточном стеке?"
      : "На флопе BB сделал чек. Какие действия доступны вам на BTN?";
    options(facing ? "Колл, рейз или пас" : "Чек или первая ставка", [
      facing ? "Чек или первая ставка" : "Обязательный колл",
      "Только рейз",
      "Нужно открыть следующую карту",
    ]);
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
      "Вы сделали пас (fold). Что происходит с фишками, которые вы уже поставили?";
    options("Остаются в банке", [
      "Возвращаются в ваш стек",
      "Возвращается только блайнд",
    ]);
    t.explanation =
      "Пас прекращает ваше участие в раздаче. Уже поставленные фишки остаются в банке.";
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
