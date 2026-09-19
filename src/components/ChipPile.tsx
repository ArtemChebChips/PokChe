import { ChipArt, chipKind } from "./ChipArt";
// Стопка показывает масштаб; точное количество всегда указано рядом.
export function ChipPile({ amount }: { amount: number }) {
  return (
    <div className="chip-pile" aria-hidden="true">
      {amount > 0 && <ChipArt kind={chipKind(amount)} width={90} height={68} />}
    </div>
  );
}
