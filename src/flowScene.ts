export type FlowScene = {
  street: string;
  hero: string;
  cards: string[];
  board: string[];
  bets: Record<string, number>;
  previousPot: number;
  folded: string[];
  active?: string;
  hidePot?: boolean;
  opponent?: { seat: string; cards: string[] };
};
export const tableSeats = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
