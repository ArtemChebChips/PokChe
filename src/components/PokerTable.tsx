import { tableSeats, type FlowScene } from "../flowScene";
import { Card, Cards } from "./PlayingCard";
const names: Record<string, string> = {
  UTG: "У Т Г",
  HJ: "Хайджек",
  CO: "Катофф",
  BTN: "Баттон",
  SB: "Малый блайнд",
  BB: "Большой блайнд",
};
const locations = [
  [94, 30],
  [266, 30],
  [315, 166],
  [266, 302],
  [94, 302],
  [45, 166],
];
export function PokerTable({
  position = "",
  scene,
}: {
  position?: string;
  scene?: FlowScene;
}) {
  const active =
    scene?.active ??
    (position === "preflop"
      ? "UTG"
      : position === "postflop"
        ? "SB"
        : position);
  // Место пользователя всегда снизу справа; порядок по часовой стрелке сохраняется.
  const offset = scene ? (tableSeats.indexOf(scene.hero) - 3 + 6) % 6 : 0;
  const pot = scene
    ? scene.previousPot + Object.values(scene.bets).reduce((a, b) => a + b, 0)
    : 0;
  return (
    <figure className={"position-table" + (scene ? " situation-table" : "")}>
      {scene && (
        <figcaption className="scene-street">{scene.street}</figcaption>
      )}
      <div className="table-surface">
        <svg
          viewBox="0 0 360 338"
          role="img"
          aria-label={
            scene
              ? `Стол. Вы на ${scene.hero}. Банк со ставками: ${scene.hidePot ? "нужно посчитать" : pot + " фишек"}.`
              : "Стол на шесть игроков. По часовой стрелке: UTG, HJ, CO, BTN, SB, BB."
          }
        >
          <image
            href={import.meta.env.BASE_URL + "art/poker-table.png"}
            x="16"
            y="14"
            width="328"
            height="310"
            preserveAspectRatio="xMidYMid meet"
          />
          {!scene && (
            <text
              x="180"
              y="172"
              textAnchor="middle"
              fill="#103e42"
              fontSize="13"
              fontWeight="700"
            >
              По часовой стрелке ↻
            </text>
          )}
          {scene && (
            <g>
              <rect
                x="113"
                y="113"
                width="134"
                height="35"
                rx="12"
                fill="#fff9ec"
              />
              <text
                x="180"
                y="128"
                textAnchor="middle"
                fill="#244e3c"
                fontSize="10"
              >
                Банк со ставками
              </text>
              <text
                x="180"
                y="142"
                textAnchor="middle"
                fill="#244e3c"
                fontSize="13"
                fontWeight="700"
              >
                {scene.hidePot ? "?" : pot + " фишек"}
              </text>
            </g>
          )}
          {locations.map(([x, y], i) => {
            const id = tableSeats[(i + offset) % 6],
              hero = scene?.hero === id;
            const folded = scene?.folded.includes(id);
            const selected =
              id === active ||
              (active === "blinds" && ["SB", "BB"].includes(id));
            const bet = scene?.bets[id] ?? 0;
            return (
              <g key={id}>
                <rect
                  x={x - 43}
                  y={y - 22}
                  width="86"
                  height="44"
                  rx="12"
                  fill={selected || hero ? "#226e58" : "#fffef9"}
                  stroke={hero ? "#b99b4e" : "#93b7a4"}
                  strokeWidth={hero ? 2 : 1}
                />
                <text
                  x={x}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill={selected || hero ? "white" : "#244e3c"}
                >
                  {hero ? "Вы · " : ""}
                  {id}
                </text>
                <text
                  x={x}
                  y={y + 11}
                  textAnchor="middle"
                  fontSize="9"
                  fill={selected || hero ? "white" : "#244e3c"}
                >
                  {folded ? "Пас" : names[id]}
                </text>
                {scene && bet > 0 && (
                  <g
                    transform={`translate(${x < 70 ? x + 62 : x > 290 ? x - 62 : x} ${y < 100 ? y + 41 : y > 250 ? y - 41 : y + 55})`}
                  >
                    <rect
                      x="-21"
                      y="-10"
                      width="42"
                      height="20"
                      rx="10"
                      fill="#fff9ec"
                      stroke="#b99b4e"
                    />
                    <circle
                      cx="-12"
                      cy="0"
                      r="5"
                      fill="#d6b35f"
                      stroke="#947734"
                    />
                    <text
                      x="5"
                      y="4"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#244e3c"
                    >
                      {bet}
                    </text>
                  </g>
                )}
                {id === "BTN" && (
                  <g>
                    <circle
                      cx={x + 37}
                      cy={y - 23}
                      r="10"
                      fill="#fffef9"
                      stroke="#ba9d5a"
                    />
                    <text
                      x={x + 37}
                      y={y - 19}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#735f2d"
                    >
                      D
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        {scene && (
          <div className="scene-board">
            {scene.board.length ? (
              scene.board.map((c) => <Card key={c} card={c} />)
            ) : (
              <span>Общих карт пока нет</span>
            )}
          </div>
        )}
      </div>
      {scene && (
        <>
          <div className="scene-hands">
            {scene.opponent && (
              <div>
                <span>Соперник · {scene.opponent.seat}</span>
                <Cards cards={scene.opponent.cards} />
              </div>
            )}
            <div
              className={
                scene.folded.includes(scene.hero) ? "scene-folded" : ""
              }
            >
              <span>
                Ваши карты · {scene.hero}
                {scene.folded.includes(scene.hero) ? " · пас" : ""}
              </span>
              <Cards cards={scene.cards} />
            </div>
          </div>
          <p className="scene-note">
            Числа у мест — поставлено на текущем круге. Банк включает эти
            ставки.
          </p>
        </>
      )}
    </figure>
  );
}
