import { Card } from "./PlayingCard";
export function HandExample({
  label,
  cards,
  highlight,
}: {
  label: string;
  cards: string[];
  highlight?: string[];
}) {
  return (
    <figure className="hand-example">
      <figcaption>{label}</figcaption>
      <div
        className={
          "teaching-hand " +
          (cards.length > 5 ? "seven" : cards.length === 5 ? "five" : "few")
        }
      >
        {cards.map((c) => (
          <span
            key={c}
            className={
              highlight
                ? highlight.includes(c)
                  ? "key-card"
                  : "unused-card"
                : ""
            }
          >
            <Card card={c} />
          </span>
        ))}
      </div>
    </figure>
  );
}
