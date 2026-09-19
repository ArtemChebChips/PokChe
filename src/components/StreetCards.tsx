import { Card } from "./PlayingCard";
import { HandExample } from "./HandExample";
const board = ["Qh", "8c", "3s", "Kd", "2h"];
export function StreetCards({ count }: { count: number }) {
  return (
    <div className="street-cards">
      <p className="street-caption">
        {count === 3
          ? "Флоп · первые три карты"
          : count === 4
            ? "Тёрн · четвёртая карта"
            : "Ривер · пятая карта"}
      </p>
      <div className="street-board">
        {board.map((card, i) =>
          i < count ? (
            <span
              key={card}
              className={
                count === 3 || i === count - 1
                  ? "key-card street-new"
                  : "street-previous"
              }
            >
              <Card card={card} />
            </span>
          ) : (
            <span
              key={card}
              className="empty-card"
              aria-label={i === 3 ? "Место для тёрна" : "Место для ривера"}
            >
              {i === 3 ? "Тёрн" : "Ривер"}
            </span>
          ),
        )}
      </div>
      <HandExample label="Ваши личные карты" cards={["As", "Jh"]} />
    </div>
  );
}
