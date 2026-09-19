export const suitPaths: Record<string, string> = {
  h: "M12 21C9 18 2 13 2 7.5C2 1.8 9 1 12 6C15 1 22 1.8 22 7.5C22 13 15 18 12 21Z",
  d: "M12 1L22 12L12 23L2 12Z",
  s: "M12 1C9 5 2 9 2 14C2 19 8 21 11 16C11 19 9 21 8 23H16C15 21 13 19 13 16C16 21 22 19 22 14C22 9 15 5 12 1Z",
  c: "M12 1C6 1 6 7 9 9C3 6 0 12 3 16C5 19 9 19 11 16C11 19 9 21 8 23H16C15 21 13 19 13 16C15 19 19 19 21 16C24 12 21 6 15 9C18 7 18 1 12 1Z",
};
export function Suit({ suit }: { suit: string }) {
  return (
    <svg
      className="suit-symbol"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={suitPaths[suit]} fill="currentColor" />
    </svg>
  );
}
