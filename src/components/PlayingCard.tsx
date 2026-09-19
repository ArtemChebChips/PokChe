import { suitPaths } from "./Suit";
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
export function CardFace({ card }: { card: string }) {
  const rank = card[0] === "T" ? "10" : card[0];
  const pip = (x: number, y: number, size: number) => (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">
      <path d={suitPaths[card[1]]} fill="currentColor" />
    </svg>
  );
  return (
    <svg
      className="card-face"
      viewBox="0 0 100 140"
      aria-hidden="true"
      focusable="false"
    >
      {positions[card[0]] ? (
        positions[card[0]].map(([x, y], i) => {
          const size = card[0] === "A" ? 34 : 15;
          const cx = 22 + (x === 32 ? 24 : x === 68 ? 76 : x) * 0.56,
            cy = 16 + y * 1.08;
          return (
            <g
              key={i}
              className="card-pip"
              transform={`translate(${cx} ${cy}) rotate(${y > 50 ? 180 : 0})`}
            >
              {pip(-size / 2, -size / 2, size)}
            </g>
          );
        })
      ) : (
        <image
          href={
            import.meta.env.BASE_URL +
            "cards/court-" +
            courtArt[card[0]] +
            ".png"
          }
          x="0"
          y="3"
          width="100"
          height="134"
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      {[false, true].map((bottom) => (
        <g
          key={String(bottom)}
          transform={bottom ? "translate(100 140) rotate(180)" : undefined}
        >
          <rect x="2" y="2" width="21" height="37" rx="3" fill="#fffefa" />
          <text
            x="12.5"
            y="21"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontWeight="700"
            fontSize={rank === "10" ? 19 : 22}
            fill="currentColor"
          >
            {rank}
          </text>
          {pip(5.5, 23, 14)}
        </g>
      ))}
    </svg>
  );
}
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
  // Все детали карты используют одни координаты и масштабируются вместе.
  const content = <CardFace card={card} />;
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
