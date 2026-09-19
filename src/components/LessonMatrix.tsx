import { useState } from "react";
const ranks = [..."AKQJT98765432"];
export function LessonMatrix({ initial }: { initial: string }) {
  const [selected, setSelected] = useState(initial);
  return (
    <figure className="lesson-matrix">
      <div
        className="mini-matrix"
        role="img"
        aria-label={`Матрица стартовых рук. Выделена ${selected}. Пары на диагонали, одномастные выше, разномастные ниже.`}
      >
        {ranks.flatMap((a, i) =>
          ranks.map((b, j) => {
            const label = i === j ? a + b : i < j ? a + b + "s" : b + a + "o";
            return (
              <span
                key={label}
                className={
                  (i === j ? "matrix-pair " : "") +
                  (label === selected ? "matrix-selected" : "")
                }
                aria-hidden="true"
              >
                {label}
              </span>
            );
          }),
        )}
      </div>
      <div className="matrix-examples">
        {["AA", "AKs", "AKo"].map((label) => (
          <button
            key={label}
            aria-pressed={selected === label}
            onClick={() => setSelected(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <figcaption>
        {selected === "AA"
          ? "AA · пара тузов · диагональ"
          : selected === "AKs"
            ? "AKs · одномастные туз и король · выше диагонали"
            : "AKo · разномастные туз и король · ниже диагонали"}
      </figcaption>
    </figure>
  );
}
