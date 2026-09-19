import { mindsetSlides } from "./mindsetLesson";
import { planSlides } from "./planLesson";
import { adjustSlides } from "./adjustLesson";
import { advancedSlides } from "./advancedLesson";
import { betsSlides } from "./betsLesson";
import { rangeSlides } from "./rangeLesson";
import type { WeightedHand } from "./rangeMath";
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
  | "planning"
  | "adjustment"
  | "advanced"
  | "betting"
  | "ranges"
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
  linePlanner?: boolean;
  riverLab?: boolean;
  range?: WeightedHand[];
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
  betting: "Добор, блеф и размер",
  ranges: "Диапазоны и эквити",
  planning: "План на две улицы",
  adjustment: "Наблюдения и подстройка",
  advanced: "Блокеры и частоты",
};
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
  {
    id: "bets",
    num: "08",
    title: "Логика ставок",
    subtitle: "Добор, блеф, чек и цена размера",
    skills: ["betting"],
    slides: betsSlides,
    ready: true,
  },
  {
    id: "postflop",
    num: "09",
    title: "Диапазоны на постфлопе",
    subtitle: "Комбинации, веса и эквити",
    skills: ["ranges"],
    slides: rangeSlides,
    ready: true,
  },
  ...[
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
    skills: [
      id === "plan" ? "planning" : id === "adjust" ? "adjustment" : "advanced",
    ] as Skill[],
    slides:
      id === "plan"
        ? planSlides
        : id === "adjust"
          ? adjustSlides
          : advancedSlides,
    ready: true,
  })),
  {
    id: "mindset",
    num: "+",
    title: "Игра вдолгую",
    subtitle: "Дисперсия, тильт, банкролл и разбор",
    skills: [],
    ready: true,
    slides: mindsetSlides,
  },
];
