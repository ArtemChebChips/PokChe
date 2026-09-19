import { useState } from "react";
import { PokerTable } from "./PokerTable";
export function LinePlanner() {
  const [bet, setBet] = useState(4);
  const pot = 8 + 2 * bet,
    stack = 20 - bet;
  return (
    <section className="line-planner" aria-label="Изменить размер ставки">
      <p>Было: банк 8 · у каждого по 20 фишек</p>
      <div className="line-options">
        {[2, 4, 8].map((n) => (
          <button
            key={n}
            aria-pressed={bet === n}
            className={bet === n ? "active" : ""}
            onClick={() => setBet(n)}
          >
            Ставка {n}
          </button>
        ))}
      </div>
      <PokerTable
        scene={{
          street: "Тёрн · соперник уравнял",
          hero: "BTN",
          cards: ["As", "Qd"],
          board: ["Qh", "8c", "3s", "2d"],
          bets: { BTN: bet, BB: bet },
          previousPot: 8,
          folded: ["UTG", "HJ", "CO", "SB"],
        }}
      />
      <p aria-live="polite">
        Остатки: по <strong>{stack}</strong>. Следующий олл-ин —{" "}
        <strong>
          {Number(((stack / pot) * 100).toFixed(1)).toLocaleString("ru-RU")}%
          банка
        </strong>
        .
      </p>
      <small>Реакция «колл» задана. Размер не является рекомендацией.</small>
    </section>
  );
}
