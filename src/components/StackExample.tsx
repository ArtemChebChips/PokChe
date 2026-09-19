export type StackState = {
  hero: number;
  opponent: number;
  pot?: number;
  unit: string;
};
export function StackExample({ hero, opponent, pot, unit }: StackState) {
  const max = Math.max(hero, opponent, 1);
  return (
    <figure className="stack-example" aria-label="Стеки игроков">
      {[
        ["Вы", hero],
        ["Соперник", opponent],
      ].map(([label, value]) => (
        <div key={label} className="stack-row">
          <div>
            <span>{label}</span>
            <strong>
              {value} {unit}
            </strong>
          </div>
          <div className="stack-track">
            <span style={{ width: `${(Number(value) / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {pot !== undefined && (
        <figcaption>
          В банке ·{" "}
          <strong>
            {pot} {unit}
          </strong>
        </figcaption>
      )}
    </figure>
  );
}
