import type { ReactNode } from "react";
export type SavaPose =
  "welcome" | "explain" | "thinking" | "try-again" | "celebrate";
export function Sava({
  pose,
  children,
}: {
  pose: SavaPose;
  children: ReactNode;
}) {
  return (
    <aside className="sava-panel">
      <img
        src={import.meta.env.BASE_URL + "sava/sava-" + pose + ".png"}
        width="320"
        height="320"
        alt=""
      />
      <div className="sava-copy">
        <span className="sava-name">Сава</span>
        {children}
      </div>
    </aside>
  );
}
