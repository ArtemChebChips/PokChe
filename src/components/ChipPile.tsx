// Готовый рисунок обозначает запас фишек; точное значение всегда в подписи.
export function ChipPile({ amount }: { amount: number }) {
  const groups = amount <= 0 ? 0 : amount <= 30 ? 1 : amount <= 70 ? 2 : 3;
  return (
    <div className="chip-pile" aria-hidden="true">
      {Array.from({ length: groups }, (_, i) => (
        <img
          key={i}
          src={import.meta.env.BASE_URL + "art/topic-actions.png"}
          alt=""
          width="72"
          height="72"
          style={{ left: `${i * 22}px`, zIndex: 3 - i }}
        />
      ))}
    </div>
  );
}
