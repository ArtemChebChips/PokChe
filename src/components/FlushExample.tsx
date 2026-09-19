import { Ivanych } from "./Ivanych";
import { HandExample } from "./HandExample";
import { flushComparison as hand } from "../rankingExamples";
export function FlushExample() {
  return (
    <Ivanych pose="explain" wide>
      <p>Туз общий. Сравним следующую карту флеша.</p>
      <HandExample label="Общие карты" cards={hand.board} />
      <div className="two-players">
        <HandExample label="Игрок 1" cards={hand.hero} highlight={["Jh"]} />
        <HandExample label="Игрок 2" cards={hand.opponent} highlight={["Th"]} />
      </div>
      <p>
        <strong>Побеждает игрок 1.</strong> Тузы равны, а его валет старше
        десятки соперника.
      </p>
    </Ivanych>
  );
}
