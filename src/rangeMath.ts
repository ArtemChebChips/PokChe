import { combinations, deck, equity, handLabel, validate } from "./poker";
export type WeightedHand = { cards: string[]; weight: number };
export function normalizeRange(
  range: WeightedHand[],
  known: string[] = [],
): WeightedHand[] {
  validate(known);
  const seen = new Set<string>();
  const legal = range.filter((h) => {
    validate(h.cards, 2, 2);
    const key = [...h.cards].sort().join("");
    if (seen.has(key) || !Number.isFinite(h.weight) || h.weight < 0)
      throw Error("Недопустимый диапазон");
    seen.add(key);
    return h.weight > 0 && !h.cards.some((c) => known.includes(c));
  });
  const total = legal.reduce((s, h) => s + h.weight, 0);
  if (!Number.isFinite(total) || total <= 0) throw Error("Пустой диапазон");
  return legal.map((h) => ({ cards: [...h.cards], weight: h.weight / total }));
}
export function rangeEquity(
  hero: string[],
  board: string[],
  range: WeightedHand[],
) {
  validate([...hero, ...board]);
  if (hero.length !== 2 || ![3, 4, 5].includes(board.length))
    throw Error("Неверная ситуация");
  return normalizeRange(range, [...hero, ...board]).reduce(
    (s, h) => s + h.weight * equity(hero, h.cards, board).percent,
    0,
  );
}
export function handCombos(label: string, known: string[] = []) {
  validate(known);
  return combinations(
    deck.filter((c) => !known.includes(c)),
    2,
  ).filter((h) => handLabel(h) === label);
}
export function bluffEV(pot: number, bet: number, fold: number) {
  if (
    !Number.isFinite(pot) ||
    pot <= 0 ||
    !Number.isFinite(bet) ||
    bet <= 0 ||
    !Number.isFinite(fold) ||
    fold < 0 ||
    fold > 1
  )
    throw Error("Неверная модель блефа");
  return fold * pot - (1 - fold) * bet;
}
export function callEV(
  potBeforeBet: number,
  bet: number,
  equityFraction: number,
) {
  if (
    !Number.isFinite(potBeforeBet) ||
    potBeforeBet <= 0 ||
    !Number.isFinite(bet) ||
    bet <= 0 ||
    !Number.isFinite(equityFraction) ||
    equityFraction < 0 ||
    equityFraction > 1
  )
    throw Error("Неверная модель колла");
  return equityFraction * (potBeforeBet + 2 * bet) - bet;
}
export const percent = (n: number) =>
  Number(n.toFixed(1)).toLocaleString("ru-RU") + "%";
