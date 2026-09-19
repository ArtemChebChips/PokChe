import { Cards } from "./PlayingCard";
import type { WeightedHand } from "../rangeMath";
export function RangeExample({ range }: { range: WeightedHand[] }) {
  const total = range.reduce((s, h) => s + h.weight, 0);
  return (
    <figure className="range-example">
      <figcaption>Заданный диапазон соперника</figcaption>
      {range.map((h) => (
        <div key={h.cards.join("")}>
          <Cards cards={h.cards} />
          <span>
            Вес {h.weight.toLocaleString("ru-RU")}
            <strong>
              {total
                ? Number(((h.weight / total) * 100).toFixed(1)).toLocaleString(
                    "ru-RU",
                  )
                : 0}
              % набора
            </strong>
          </span>
        </div>
      ))}
    </figure>
  );
}
