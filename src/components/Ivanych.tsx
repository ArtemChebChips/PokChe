import type { ReactNode } from "react";
export type IvanychPose =
  "welcome" | "explain" | "thinking" | "try-again" | "celebrate" | "cheers";
export function Ivanych({
  pose,
  children,
  advice = false,
  wide = false,
}: {
  pose: IvanychPose;
  children: ReactNode;
  advice?: boolean;
  wide?: boolean;
}) {
  return (
    <aside className={"sava-panel" + (wide ? " sava-wide" : "")}>
      <img
        src={import.meta.env.BASE_URL + "sava/sava-" + pose + ".png"}
        width="320"
        height="320"
        alt=""
      />
      <div className="sava-copy">
        <span className="sava-name">
          {advice ? "Иваныч советует:" : "Иваныч:"}
        </span>
        {children}
      </div>
    </aside>
  );
}
