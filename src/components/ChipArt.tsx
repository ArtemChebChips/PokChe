// ViewBox убирает прозрачные поля при показе; исходные PNG сохранены без изменений.
const bounds = {
  "chip-single": [177, 212, 159, 88],
  "chips-small": [176, 192, 160, 128],
  "chips-medium": [176, 161, 160, 190],
  "chips-large": [95, 117, 321, 278],
  "chips-pot": [38, 144, 436, 225],
  "dealer-button": [20, 20, 216, 216],
};
export function chipKind(amount: number) {
  return amount <= 1
    ? "chip-single"
    : amount <= 10
      ? "chips-small"
      : amount <= 40
        ? "chips-medium"
        : "chips-large";
}
export function ChipArt({
  kind,
  width = 72,
  height = 64,
  x,
  y,
}: {
  kind: keyof typeof bounds;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}) {
  const size = kind === "dealer-button" ? 256 : 512;
  return (
    <svg
      className="chip-art"
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox={bounds[kind].join(" ")}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <image
        href={import.meta.env.BASE_URL + "art/table-chips/" + kind + ".png"}
        width={size}
        height={size}
      />
    </svg>
  );
}
