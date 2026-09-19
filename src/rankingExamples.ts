export const rankingExamples = [
  {
    label: "Старшая карта",
    cards: ["As", "Kd", "9h", "7c", "3s"],
    category: 0,
  },
  { label: "Пара", cards: ["9s", "9h", "Kc", "7d", "3s"], category: 1 },
  { label: "Две пары", cards: ["Ks", "Kh", "5c", "5d", "As"], category: 2 },
  {
    label: "Тройка: сет или трипс",
    cards: ["7s", "7h", "7c", "Kd", "2s"],
    category: 3,
  },
  { label: "Стрит", cards: ["5s", "6h", "7c", "8d", "9s"], category: 4 },
  { label: "Флеш", cards: ["Ah", "Jh", "8h", "5h", "2h"], category: 5 },
  { label: "Фулл-хаус", cards: ["Ks", "Kh", "Kd", "9c", "9s"], category: 6 },
  { label: "Каре", cards: ["Qs", "Qh", "Qd", "Qc", "As"], category: 7 },
  { label: "Стрит-флеш", cards: ["6s", "7s", "8s", "9s", "Ts"], category: 8 },
  { label: "Флеш-рояль", cards: ["Ts", "Js", "Qs", "Ks", "As"], category: 8 },
];
export const flushComparison = {
  board: ["Ah", "8h", "6h", "3h", "2c"],
  hero: ["Jh", "9c"],
  opponent: ["Th", "7d"],
};
