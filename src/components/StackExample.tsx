import { ChipArt } from "./ChipArt";
import { ChipPile } from "./ChipPile";
export type StackState = {
  hero: number;
  opponent: number;
  pot?: number;
  unit: string;
};
export function StackExample({ hero, opponent, pot, unit }: StackState) {
  return (
    <figure className="stack-example" aria-label="Стеки игроков">
      {pot !== undefined && (
        <div className="stack-bank">
          <ChipArt kind="chips-pot" width={42} height={30} />
          <span>
            В банке{" "}
            <strong>
              {pot} {unit}
            </strong>
          </span>
        </div>
      )}
      <div className="stack-players">
        {[
          ["Вы", hero],
          ["Соперник", opponent],
        ].map(([label, value]) => (
          <div className="stack-player" key={label}>
            <span>{label}</span>
            <ChipPile amount={Number(value)} />
            <strong>
              {value} {unit}
            </strong>
          </div>
        ))}
      </div>
      <figcaption>Перед игроками — оставшиеся стеки</figcaption>
    </figure>
  );
}
