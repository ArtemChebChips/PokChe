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
// Общие координаты мест, ставок и дилера: ни одна метка места не закрывает сукно.
const seats = [
  [136, 25],
  [264, 25],
  [375, 145],
  [264, 265],
  [136, 265],
  [25, 145],
];
const betsAt = [
  [125, 80],
  [275, 80],
  [317, 181],
  [255, 184],
  [145, 184],
  [83, 181],
];
const dealerAt = [
  [157, 64],
  [297, 65],
  [334, 107],
  [281, 195],
  [113, 195],
  [66, 107],
];
const art = import.meta.env.BASE_URL + "art/";
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
  const offset = scene ? (tableSeats.indexOf(scene.hero) - 3 + 6) % 6 : 0;
  const bets = scene?.bets ?? (position === "postflop" ? {} : { SB: 1, BB: 2 });
  const previousPot = scene?.previousPot ?? (position === "postflop" ? 12 : 0);
  const pot = previousPot + Object.values(bets).reduce((a, b) => a + b, 0);
  const board =
    scene?.board ?? (position === "postflop" ? ["Qh", "8c", "3s"] : []);
  return (
    <figure className={"position-table" + (scene ? " situation-table" : "")}>
      {scene && (
        <figcaption className="scene-street">{scene.street}</figcaption>
      )}
      <div className="table-surface">
        <svg
          className="table-layout"
          viewBox="0 0 400 290"
          role="img"
          aria-label={`Стол на шесть игроков. Банк: ${scene?.hidePot ? "нужно посчитать" : pot + " фишек"}.`}
        >
          <image
            className="table-art"
            href={art + "poker-table.png"}
            x="0"
            y="-55"
            width="400"
            height="400"
            preserveAspectRatio="xMidYMid meet"
          />
          <g
            className="pot-marker"
            aria-label={`Банк: ${scene?.hidePot ? "?" : pot}`}
          >
            <image
              href={art + "topic-actions.png"}
              x="169"
              y="62"
              width="28"
              height="28"
            />
            <text x="202" y="75" fill="#123f37" fontSize="10">
              Банк
            </text>
            <text x="202" y="91" fill="#123f37" fontWeight="700" fontSize="16">
              {scene?.hidePot ? "?" : pot}
            </text>
          </g>
          {seats.map(([x, y], i) => {
            const id = tableSeats[(i + offset) % 6],
              hero = scene?.hero === id,
              folded = scene?.folded.includes(id);
            const selected =
              id === active ||
              (active === "blinds" && ["SB", "BB"].includes(id));
            const dark = !folded && (selected || hero);
            const [bx, by] = betsAt[i],
              [dx, dy] = dealerAt[i];
            const bet = bets[id] ?? 0;
            return (
              <g key={id}>
                <g
                  className="seat-marker"
                  data-seat={id}
                  data-folded={folded || undefined}
                >
                  <title>
                    {names[id]}
                    {hero ? " · вы" : ""}
                    {folded ? " · пас" : " · в игре"}
                  </title>
                  <circle
                    cx={x}
                    cy={y}
                    r="23"
                    fill={folded ? "#e8eae3" : dark ? "#226e58" : "#fffef9"}
                    stroke={hero ? "#b99b4e" : folded ? "#cad1c9" : "#8bb19b"}
                    strokeWidth={hero ? 2.5 : 1.3}
                  />
                  <text
                    x={x}
                    y={y - 1}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill={dark ? "white" : folded ? "#7a857d" : "#244e3c"}
                  >
                    {id}
                  </text>
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fontSize="8"
                    fill={dark ? "white" : "#687b6d"}
                  >
                    {folded ? "пас" : hero ? "вы" : "в игре"}
                  </text>
                </g>
                {bet > 0 && (
                  <g
                    className="seat-bet"
                    data-seat={id}
                    aria-label={`${id}: поставлено ${bet}`}
                  >
                    <image
                      href={art + "topic-actions.png"}
                      x={bx - 12}
                      y={by - 14}
                      width="24"
                      height="24"
                    />
                    <text
                      x={bx + 16}
                      y={by + 4}
                      fill="#173e32"
                      stroke="#fff9ec"
                      strokeWidth="3"
                      paintOrder="stroke"
                      fontWeight="700"
                      fontSize="13"
                    >
                      {bet}
                    </text>
                  </g>
                )}
                {id === "BTN" && (
                  <g className="dealer-marker" aria-label="Кнопка дилера">
                    <circle
                      cx={dx}
                      cy={dy}
                      r="10"
                      fill="#fffef9"
                      stroke="#ba9d5a"
                      strokeWidth="1.5"
                    />
                    <text
                      x={dx}
                      y={dy + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
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
        {board.length > 0 && (
          <div className="scene-board" aria-label="Общие карты">
            {board.map((c) => (
              <Card key={c} card={c} />
            ))}
          </div>
        )}
      </div>
      {!scene && (
        <figcaption className="seat-caption">
          {active === "blinds"
            ? "SB — малый блайнд · BB — большой блайнд"
            : `${active} — ${names[active] ?? ""}`}
          <span>
            {position === "postflop"
              ? "Все шестеро в игре · ставки префлопа уже в банке"
              : "Блайнды 1 / 2 · все шестеро в игре"}
          </span>
        </figcaption>
      )}
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
                Вы · {scene.hero}
                {scene.folded.includes(scene.hero) ? " · пас" : ""}
              </span>
              <Cards cards={scene.cards} />
            </div>
          </div>
          <figcaption className="scene-note">
            Суммы в фишках · банк включает ставки на столе
          </figcaption>
        </>
      )}
    </figure>
  );
}
