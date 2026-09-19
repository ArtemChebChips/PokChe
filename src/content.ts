import { boardSlides } from "./boardLesson";
import { preflopSlides } from "./preflopLesson";
import { mathSlides } from "./mathLesson";
import type { PotCalculationState } from "./components/PotCalculation";
import type { FlowScene } from "./flowScene";
import { startingHandsSlides } from "./startingHandsLesson";
import { stackSlides } from "./stackLesson";
import type { StackState } from "./components/StackExample";
import { handFlowSlides } from "./handFlowLesson";
import { combinationSlides } from "./combinationLesson";
export type Skill =
  | "cards"
  | "combination"
  | "best"
  | "winner"
  | "preflop"
  | "order"
  | "stack"
  | "notation"
  | "odds"
  | "spr"
  | "texture"
  | "equity";
export type Slide = {
  potCalculation?: PotCalculationState;
  scene?: FlowScene;
  stacks?: StackState;
  matrix?: string;
  section?: string;
  coach?: string;
  ranking?: boolean;
  coachExample?: "flush";
  tablePosition?: string;
  street?: number;
  hands?: {
    label: string;
    cards: string[];
    highlight?: string[];
    category?: number;
  }[];

  title: string;
  text: string;
  example: string;
  cards?: string[];
  question?: string;
  choices?: string[];
  answer?: string;
  reason?: string;
};
export type Lesson = {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  skills: Skill[];
  slides: Slide[];
  ready: boolean;
};
export const skillNames: Record<Skill, string> = {
  cards: "Старшинство карт",
  combination: "Узнай комбинацию",
  best: "Лучшая пятёрка",
  winner: "Кто забирает банк",
  order: "Ход раздачи",
  stack: "Эффективный стек",
  notation: "Обозначения рук",
  preflop: "Решения на префлопе",
  odds: "Шансы банка",
  spr: "Считай SPR",
  texture: "Доска и дро",
  equity: "Оцени эквити",
};
const slide = (
  title: string,
  text: string,
  example: string,
  question: string,
  choices: string[],
  answer: string,
  reason: string,
  cards?: string[],
): Slide => ({
  title,
  text,
  example,
  question,
  choices,
  answer,
  reason,
  cards,
});
export const lessons: Lesson[] = [
  {
    id: "cards",
    num: "00",
    title: "Знакомство с картами",
    subtitle: "Масти, достоинства и особенный туз",
    skills: ["cards"],
    ready: true,
    slides: [
      {
        title: "Четыре масти",
        text: "В колоде 52 карты и четыре масти: пики, червы, бубны и трефы (крести).",
        example:
          "При сравнении достоинств масти равны. Но в комбинациях масть может быть важна: например, для флеша нужны пять карт одной масти.",
      },
      {
        title: "Карты по старшинству",
        text: "Достоинство — число или буква на карте. Среди числовых карт старше та, у которой число больше: девятка старше пятёрки, десятка старше девятки.",
        example: "",
        cards: ["5s", "9h", "Tc"],
      },
      {
        title: "Валет, дама, король",
        text: "После десятки идут валет (J), дама (Q) и король (K). Дама старше валета, король старше дамы.",
        example: "",
        cards: ["Js", "Qh", "Kc"],
      },
      {
        title: "Туз — самая старшая карта",
        text: "Туз обозначается буквой A. Он старше короля и всех остальных карт.",
        example:
          "В некоторых комбинациях у туза другая роль. Разберём её в уроке о стрите; здесь главное понимать, что туз — самая старшая карта в игре.",
        cards: ["Ks", "Ah"],
      },
      {
        title: "Все карты по старшинству",
        text: "От двойки до туза — от младшей карты к старшей. Читай слева направо, затем переходи к следующему ряду.",
        example:
          "При сравнении по достоинству карты с одинаковым числом или буквой равны: король пик не старше короля червей.",
        cards: [
          "2s",
          "3h",
          "4c",
          "5d",
          "6s",
          "7h",
          "8c",
          "9d",
          "Ts",
          "Jh",
          "Qc",
          "Kd",
          "As",
        ],
      },
    ],
  },
  {
    id: "combinations",
    num: "01",
    title: "Комбинации",
    subtitle: "Лучшая пятёрка, кикеры и делёж",
    skills: ["combination", "best", "winner"],
    ready: true,
    slides: combinationSlides,
  },
  {
    id: "actions",
    num: "02",
    title: "Как идёт раздача",
    subtitle: "Места за столом, общие карты и действия",
    skills: ["order"],
    ready: true,
    slides: handFlowSlides,
  },
  {
    id: "positions",
    num: "03",
    title: "Позиции и стеки",
    subtitle: "Преимущество позиции и эффективный стек",
    skills: ["stack", "spr"],
    ready: true,
    slides: stackSlides,
  },
  {
    id: "ranges",
    num: "04",
    title: "Стартовые руки",
    subtitle: "Пары, suited, offsuit и матрица",
    skills: ["notation"],
    ready: true,
    slides: startingHandsSlides,
  },
  {
    id: "preflop",
    num: "05",
    title: "Решения на префлопе",
    subtitle: "Открытие, 3-бет и цена продолжения",
    skills: ["preflop"],
    slides: preflopSlides,
    ready: true,
  },
  {
    id: "math",
    num: "06",
    title: "Покерная математика",
    subtitle: "Шансы банка, эквити и цена колла",
    skills: ["odds", "equity"],
    ready: true,
    slides: mathSlides,
  },
  {
    id: "board",
    num: "07",
    title: "Читаем доску",
    subtitle: "Текстура, готовые руки и дро",
    skills: ["texture"],
    ready: true,
    slides: boardSlides,
  },
  ...[
    ["bets", "08", "Логика ставок", "Добор, блеф, полублеф и размеры"],
    [
      "postflop",
      "09",
      "Диапазоны на постфлопе",
      "Сужение диапазонов и сравнение силы",
    ],
    [
      "plan",
      "10",
      "План на несколько улиц",
      "Связанные решения от флопа до ривера",
    ],
    [
      "adjust",
      "11",
      "Подстройка под соперника",
      "Наблюдения, ошибки и адаптация",
    ],
    [
      "advanced",
      "12",
      "Продвинутая стратегия",
      "Блокеры, частоты и работа с солвером",
    ],
  ].map(([id, num, title, subtitle]) => ({
    id,
    num,
    title,
    subtitle,
    skills: [] as Skill[],
    slides: [],
    ready: false,
  })),
  {
    id: "mindset",
    num: "+",
    title: "Игра вдолгую",
    subtitle: "Дисперсия, тильт, банкролл и разбор",
    skills: [],
    ready: true,
    slides: [
      slide(
        "Результат не равен качеству",
        "Хорошее решение может проиграть конкретную раздачу. Дисперсия — разброс результатов из-за случайности. Оценивайте условия и логику, а не выпавший ривер.",
        "Сохраняйте сложные раздачи до того, как узнаете результат.",
        "Проигранная раздача доказывает ошибку?",
        ["Нет", "Да"],
        "Нет",
        "Для оценки решения нужен анализ информации, доступной в момент хода.",
      ),
      slide(
        "Пауза — тоже навык",
        "Тильт — эмоциональное состояние, ухудшающее решения. Если хочется немедленно отыграться, остановите сессию. Используйте заранее заданный лимит времени.",
        "Отметьте эмоцию → сделайте паузу → решите, готовы ли продолжать.",
        "Что делать при желании срочно отыграться?",
        ["Взять паузу", "Повысить лимит"],
        "Взять паузу",
        "Повышение ставок не исправляет качество решений.",
      ),
      slide(
        "Отдельный банкролл",
        "Для игры выделяют отдельную сумму, потеря которой не затрагивает обязательные расходы. Универсального безопасного числа бай-инов нет: важны формат, риск и результаты.",
        "Обучение здесь не требует ставок реальными деньгами.",
        "Стоит ли использовать деньги на обязательные расходы?",
        ["Нет", "Да"],
        "Нет",
        "Лимиты времени и суммы определяются до игры.",
      ),
      slide(
        "Разберите одну раздачу",
        "Запишите позиции, эффективный стек, банк и действия с размерами. Сформулируйте вопрос. Проверьте правила и математику, а стратегию — в модели с совпадающими условиями.",
        "Один конкретный вопрос полезнее десятка неподписанных скриншотов.",
        "Можно ли менять доску и оставлять прежний ответ солвера?",
        ["Нет", "Да"],
        "Нет",
        "Новая доска или диапазон требуют нового расчёта.",
      ),
    ],
  },
];
