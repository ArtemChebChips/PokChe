const seats = [
  { id: "UTG", name: "Ранняя", x: 160, y: 27 },
  { id: "HJ", name: "Хайджек", x: 266, y: 92 },
  { id: "CO", name: "Катофф", x: 266, y: 207 },
  { id: "BTN", name: "Баттон", x: 160, y: 272 },
  { id: "SB", name: "Малый блайнд", x: 54, y: 207 },
  { id: "BB", name: "Большой блайнд", x: 54, y: 92 },
];
export function PokerTable({ position }: { position: string }) {
  const active =
    position === "preflop" ? "UTG" : position === "postflop" ? "SB" : position;
  return (
    <figure className="position-table">
      <svg
        viewBox="0 0 320 304"
        role="img"
        aria-label={
          "Стол на шесть игроков. По часовой стрелке: UTG, HJ, CO, BTN, SB, BB. Выделено: " +
          (active === "blinds" ? "SB и BB" : active)
        }
      >
        <ellipse
          cx="160"
          cy="150"
          rx="112"
          ry="113"
          fill="#d9ece2"
          stroke="#8ab5a0"
          strokeWidth="3"
        />
        <path
          d="M 142 69 A 80 80 0 0 1 235 148"
          fill="none"
          stroke="#679b83"
          strokeWidth="2"
        />
        <path
          d="m 229 140 6 9 6 -9"
          fill="none"
          stroke="#679b83"
          strokeWidth="2"
        />
        <text x="160" y="146" textAnchor="middle" fill="#47735e" fontSize="14">
          6 игроков
        </text>
        <text x="160" y="166" textAnchor="middle" fill="#47735e" fontSize="11">
          По часовой стрелке
        </text>
        {seats.map((s) => (
          <g key={s.id}>
            <rect
              x={s.x - 51}
              y={s.y - 24}
              width="102"
              height="48"
              rx="14"
              fill={
                s.id === active ||
                (active === "blinds" && ["SB", "BB"].includes(s.id))
                  ? "#226e58"
                  : "#fffef9"
              }
              stroke="#93b7a4"
            />
            <text
              x={s.x}
              y={s.y - 3}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill={
                s.id === active ||
                (active === "blinds" && ["SB", "BB"].includes(s.id))
                  ? "white"
                  : "#244e3c"
              }
            >
              {s.id}
            </text>
            <text
              x={s.x}
              y={s.y + 13}
              textAnchor="middle"
              fontSize="10"
              fill={
                s.id === active ||
                (active === "blinds" && ["SB", "BB"].includes(s.id))
                  ? "white"
                  : "#244e3c"
              }
            >
              {s.name}
            </text>
          </g>
        ))}
        <circle cx="160" cy="226" r="13" fill="#fffef9" stroke="#ba9d5a" />
        <text
          x="160"
          y="231"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#735f2d"
        >
          D
        </text>
      </svg>
    </figure>
  );
}
