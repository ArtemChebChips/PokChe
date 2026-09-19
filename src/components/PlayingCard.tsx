import { Suit } from "./Suit";
export const symbols: Record<string, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};
const suits: Record<string, string> = {
  s: "пики",
  h: "червы",
  d: "бубны",
  c: "трефы (крести)",
};
const ranks: Record<string, string> = {
  A: "Туз",
  K: "Король",
  Q: "Дама",
  J: "Валет",
  T: "Десятка",
};
const courtArt: Record<string, string> = { J: "jack", Q: "queen", K: "king" };
const positions: Record<string, [number, number][]> = {
  A: [[50, 50]],
  "2": [
    [50, 24],
    [50, 76],
  ],
  "3": [
    [50, 24],
    [50, 50],
    [50, 76],
  ],
  "4": [
    [32, 24],
    [68, 24],
    [32, 76],
    [68, 76],
  ],
  "5": [
    [32, 24],
    [68, 24],
    [50, 50],
    [32, 76],
    [68, 76],
  ],
  "6": [
    [32, 24],
    [68, 24],
    [32, 50],
    [68, 50],
    [32, 76],
    [68, 76],
  ],
  "7": [
    [32, 24],
    [68, 24],
    [50, 37],
    [32, 50],
    [68, 50],
    [32, 76],
    [68, 76],
  ],
  "8": [
    [32, 24],
    [68, 24],
    [50, 37],
    [32, 50],
    [68, 50],
    [50, 63],
    [32, 76],
    [68, 76],
  ],
  "9": [
    [32, 22],
    [68, 22],
    [32, 40],
    [68, 40],
    [50, 50],
    [32, 60],
    [68, 60],
    [32, 78],
    [68, 78],
  ],
  T: [
    [32, 22],
    [68, 22],
    [50, 31],
    [32, 40],
    [68, 40],
    [32, 60],
    [68, 60],
    [50, 69],
    [32, 78],
    [68, 78],
  ],
};
export function Card({
  card,
  active = false,
  onClick,
}: {
  card: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const rank = card[0] === "T" ? "10" : card[0];
  const content = (
    <>
      <span className="card-index top">
        <b>{rank}</b>
        <i>
          <Suit suit={card[1]} />
        </i>
      </span>
      <span
        className={"card-center " + (positions[card[0]] ? "" : "court-art")}
        aria-hidden="true"
      >
        {positions[card[0]] ? (
          positions[card[0]].map(([x, y], i) => (
            <i
              key={i}
              className={card[0] === "A" ? "ace-pip" : ""}
              style={{
                left: (x === 32 ? 24 : x === 68 ? 76 : x) + "%",
                top: y + "%",
                transform:
                  "translate(-50%,-50%)" + (y > 50 ? " rotate(180deg)" : ""),
              }}
            >
              <Suit suit={card[1]} />
            </i>
          ))
        ) : (
          <img
            src={
              import.meta.env.BASE_URL +
              "cards/court-" +
              courtArt[card[0]] +
              ".png"
            }
            alt=""
            width="512"
            height="640"
            draggable={false}
          />
        )}
      </span>
      <span className="card-index bottom" aria-hidden="true">
        <b>{rank}</b>
        <i>
          <Suit suit={card[1]} />
        </i>
      </span>
    </>
  );
  const cls =
    "card " +
    ("hd".includes(card[1]) ? "red " : "") +
    (active ? "selected" : "");
  const label = (ranks[card[0]] ?? rank) + " " + suits[card[1]];
  return onClick ? (
    <button
      aria-label={label}
      aria-pressed={active}
      data-card={card}
      className={cls}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <span role="img" aria-label={label} data-card={card} className={cls}>
      {content}
    </span>
  );
}
export function Cards({ cards }: { cards: string[] }) {
  return (
    <div className="cards">
      {cards.map((c) => (
        <Card key={c} card={c} />
      ))}
    </div>
  );
}

export function CardBack() {
  return (
    <span className="card card-back" role="img" aria-label="Закрытая карта">
      <img
        src={import.meta.env.BASE_URL + "cards/card-back.svg"}
        alt=""
        width="480"
        height="672"
        draggable={false}
      />
    </span>
  );
}
