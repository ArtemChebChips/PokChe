import type { Task } from "./tasks";
import { pick, shuffle } from "./random";
export const oddsFamilies = ["call", "final-pot", "threshold", "decision"];
const fmt = (n: number) => Number(n.toFixed(1)).toLocaleString("ru-RU");
export function oddsTask(family = pick(oddsFamilies)): Task {
  const before = pick([20, 40, 60]),
    bet = pick([10, 20, 30]),
    paid = family === "call" ? bet / 2 : 0,
    call = bet - paid,
    final = before + 2 * bet;
  const t: Task = {
    id: crypto.randomUUID(),
    skill: "odds",
    title: "Шансы банка",
    scenario: family,
    revision: 2,
    prompt: "",
    answer: "",
    choices: [],
    hint: "",
    explanation: "",
    category: "exact",
    context: "Один на один · все суммы в фишках · без комиссии",
    scene: {
      street: "Тёрн · ваш ход",
      hero: "BTN",
      cards: ["As", "Jh"],
      board: ["Qh", "8c", "3s", "4d"],
      previousPot: before,
      bets: { BTN: paid, BB: bet },
      folded: ["UTG", "HJ", "CO", "SB"],
    },
  };
  const options = (a: string, other: string[]) => {
    t.answer = a;
    t.choices = shuffle([...new Set([a, ...other])]);
  };
  if (family === "call") {
    t.prompt = `На этой улице вы поставили ${paid}, BB повысил до ${bet}. Сколько добавить для колла?`;
    options(String(call), [String(bet), String(bet + paid), String(before)]);
    t.explanation = `${bet} − ${paid} = ${call}. Уже вложенные ${paid} повторно не платим.`;
    t.hint = "Текущая ставка минус ваши вложения на этой улице.";
  } else if (family === "final-pot") {
    t.prompt = `В банке было ${before}. BB поставил ${bet}, вы ещё не ставили. Какой банк будет после вашего колла?`;
    options(String(final), [
      String(before + bet),
      String(before),
      String(final + bet),
    ]);
    t.explanation = `${before} + ${bet} + ${bet} = ${final}. Ставку BB учитываем один раз, ваш колл тоже добавляем.`;
    t.hint = "К текущему банку на столе добавьте только свой колл.";
  } else {
    t.context =
      "Один на один · олл-ин соперника · можете уравнять · без комиссии и будущих ставок";
    t.scene!.street = "Тёрн · BB поставил олл-ин";
    const threshold = (bet / final) * 100;
    if (family === "threshold") {
      t.prompt = `До ставки было ${before}, соперник поставил ${bet}. Вам добавить ${bet}. Какой порог эквити для колла? Округлите до десятых процента.`;
      options(fmt(threshold) + "%", [
        fmt((bet / (before + bet)) * 100) + "%",
        fmt(threshold + 10) + "%",
        fmt(threshold / 2) + "%",
      ]);
      t.explanation = `${bet} ÷ (${before} + ${bet} + ${bet}) × 100 = ${fmt(threshold)}%. Знаменатель — банк после колла.`;
      t.hint = "Разделите цену колла на итоговый банк, а не на текущий.";
    } else {
      const share = pick([10, 25, 40, 60]),
        delta = share * final - bet * 100;
      t.prompt = `До ставки было ${before}, олл-ин ${bet}, колл ${bet}. По условию ваше эквити — ${share}%. Как колл соотносится с пасом по EV?`;
      options(
        delta > 0
          ? "Колл выгоднее"
          : delta < 0
            ? "Пас выгоднее"
            : "Равны по EV",
        ["Колл выгоднее", "Пас выгоднее", "Равны по EV"],
      );
      t.explanation = `Порог ${fmt(threshold)}%. EV колла относительно паса: ${share / 100} × ${final} − ${bet} = ${fmt(delta / 100)} фишек. Эквити задано условием; из изображённых личных карт его само по себе не узнать.`;
      t.hint =
        "Сравните заданное эквити с ценой колла. При точном равенстве результаты равны по EV.";
    }
  }
  return t;
}
