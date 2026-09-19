import { Ivanych } from "./Ivanych";
import { HandExample } from "./HandExample";
import { flushComparison as hand } from "../rankingExamples";
export function FlushExample() {
  return (
    <Ivanych pose="explain" wide>
      <p>
        Туз на столе общий. Он даёт старшую карту флеша обоим игрокам. Тогда
        смотрим следующую карту.
      </p>
      <HandExample label="Общие карты" cards={hand.board} />
      <div className="two-players">
        <HandExample label="Игрок 1" cards={hand.hero} highlight={["Jh"]} />
        <HandExample label="Игрок 2" cards={hand.opponent} highlight={["Th"]} />
      </div>
      <p>
        <strong>Побеждает игрок 1.</strong> У него A–J–8–6–3, у игрока 2 —
        A–10–8–6–3. Тузы равны, а валет старше десятки.
      </p>
    </Ivanych>
  );
}
