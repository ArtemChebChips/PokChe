import type { CSSProperties } from "react";
export function CorrectBurst() {
  return (
    <div className="correct-burst" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <i
          key={i}
          style={
            {
              "--x": Math.cos((i * Math.PI) / 8) * 135 + "px",
              "--y": Math.sin((i * Math.PI) / 8) * 85 - 35 + "px",
              "--spin": i * 71 + "deg",
              "--color": ["#218d76", "#e7bc57", "#da7160", "#83c5aa"][i % 4],
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
