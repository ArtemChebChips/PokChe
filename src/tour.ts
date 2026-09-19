export const tourKey = "river.tour.v1";
export const tourSteps = [
  {
    title: "Здорово, я Иваныч",
    text: "Раньше торговал акциями, теперь играю в покер. Пежо попросил найти второй источник дохода. Давай покажу, что тут к чему.",
    tab: "learn",
    target: "welcome",
    pose: "welcome",
    place: "bottom",
    side: "left",
  },
  {
    title: "Начнём с основ?",
    text: "Если ты новичок, проходи уроки по порядку: от карт к более сложным решениям. Здесь всегда можно продолжить с того места, где остановился.",
    tab: "learn",
    target: "lesson",
    pose: "point-up-right",
    place: "bottom",
    side: "left",
  },
  {
    title: "Уже знаком с покером?",
    text: "Выбирай интересующую тему прямо в списке. Уроки идут от простого к сложному, но замков здесь нет. Сначала объяснение, потом практика — без экзамена на входе.",
    tab: "learn",
    target: "topics",
    pose: "point-up-left",
    place: "top",
    side: "right",
  },
  {
    title: "Проверим на практике",
    text: "В тренажёрах выбирай отдельный навык или смешанную тренировку. Здесь можно ошибаться без риска для кошелька. Я проверил: канистру покупать не придётся.",
    tab: "train",
    target: "train",
    pose: "point-down",
    place: "bottom",
    side: "left",
  },
  {
    title: "Ошибся? Есть второй заход",
    text: "Ошибки сохраняются для повторения. В разборе есть объяснение и похожая задача.",
    tab: "train",
    target: "review",
    pose: "point-up-right",
    place: "bottom",
    side: "left",
  },
  {
    title: "Смотрим на результаты",
    text: "Здесь — пройденные уроки и точность ответов. Прочитал и освоил — разные вещи. Я люблю, когда график идёт вверх. Кроме расхода масла: там уже всё достаточно успешно.",
    tab: "progress",
    target: "progress",
    pose: "point-down",
    place: "top",
    side: "right",
  },
  {
    title: "Всё остаётся под рукой",
    text: "Здесь настройки приложения, справка о кэше и турнирах и повтор этой экскурсии. С приложением разобраться проще, чем с лампочками на приборке моего Пежо.",
    tab: "learn",
    target: "settings",
    pose: "point-up-right",
    place: "bottom",
    side: "right",
  },
  {
    title: "Ну всё, поехали",
    text: "Уроки и тренажёры — твои. Ни рубля не потратил, а умнее стал. А я пока масло долью. На Мерседес само не накопится. Особенно если уже купил Пежо.",
    tab: "learn",
    target: "finish",
    pose: "oil",
    place: "bottom",
    side: "left",
  },
] as const;
export function needsTour() {
  try {
    return localStorage.getItem(tourKey) !== "done";
  } catch {
    return false;
  }
}
export function rememberTour() {
  try {
    localStorage.setItem(tourKey, "done");
  } catch {
    /* Экскурсия закрывается даже при недоступном хранилище. */
  }
}
