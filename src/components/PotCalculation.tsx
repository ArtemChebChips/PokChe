import { ChipArt, chipKind } from "./ChipArt";
export type PotCalculationState = { before: number; bet: number };
export function PotCalculation({ before, bet }: PotCalculationState) {
  return (
    <figure className="pot-calculation">
      <div>
        {[
          ["Было в банке", before],
          ["Ставка соперника", bet],
          ["Ваш колл", bet],
        ].map(([label, value]) => (
          <div key={label}>
            <ChipArt kind={chipKind(Number(value))} width={48} height={48} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <figcaption>
        После колла: <strong>{before + 2 * bet} фишек</strong>
      </figcaption>
    </figure>
  );
}
