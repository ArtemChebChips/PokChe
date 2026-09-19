import { useState } from "react";
import pack from "../data/river-models.json";
export function RiverLab() {
  const [index, setIndex] = useState(1);
  const r = pack.scenarios[index];
  const pct = (n: number) =>
    Number((n * 100).toFixed(1)).toLocaleString("ru-RU") + "%";
  return (
    <section className="river-lab">
      <label>
        Банк 100 · размер ставки{" "}
        <select
          aria-label="Размер в модели ривера"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {pack.scenarios.map((r, i) => (
            <option value={i} key={r.id}>
              {r.bet}
            </option>
          ))}
        </select>
      </label>
      <p>
        В исходном диапазоне ставящего {pct(r.valueWeight)} сильных рук,
        остальные — блефы. Сильная рука всегда побеждает блеф-кетчер, блеф
        всегда проигрывает.
      </p>
      <dl>
        <dt>Ставка с сильной рукой</dt>
        <dd>{pct(r.valueBet)}</dd>
        <dt>Ставка с блефом</dt>
        <dd>{pct(r.bluffBet)}</dd>
        <dt>Колл защитника</dt>
        <dd>{pct(r.defenderCall)}</dd>
      </dl>
      <small>
        Рассчитанная конечная игра: чек/ставка → пас/колл, без рейзов и
        комиссии. Это не полный чарт холдема.
      </small>
    </section>
  );
}
