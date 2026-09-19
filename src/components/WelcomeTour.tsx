import { useEffect, useRef } from "react";
import { tourSteps } from "../tour";
export function WelcomeTour({
  step,
  onStep,
  onFinish,
}: {
  step: number;
  onStep: (n: number) => void;
  onFinish: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextButton.current?.focus({ preventScroll: true });
  }, [step]);
  const s = tourSteps[step],
    last = step === tourSteps.length - 1;
  return (
    <section
      role="dialog"
      aria-modal="true"
      ref={dialog}
      className={`tour-dialog tour-${s.place}`}
      aria-label="Экскурсия с Иванычем"
      aria-describedby="tour-text"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onFinish();
          return;
        }
        if (e.key !== "Tab") return;
        const buttons = Array.from(
          dialog.current!.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        );
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
    >
      <div key={step} className={`tour-scene tour-side-${s.side}`}>
        <img
          className="tour-actor"
          src={import.meta.env.BASE_URL + `sava/sava-${s.pose}.png`}
          alt=""
          width="1254"
          height="1254"
        />
        <section className="tour-bubble">
          <div className="tour-meta">
            <span>
              Иваныч · {step + 1} / {tourSteps.length}
            </span>
            <button onClick={onFinish} aria-label="Пропустить экскурсию">
              Пропустить
            </button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <h2>{s.title}</h2>
            <p id="tour-text">{s.text}</p>
          </div>
          <div className="tour-controls">
            <button
              className="secondary"
              disabled={step === 0}
              onClick={() => onStep(step - 1)}
            >
              Назад
            </button>
            <button
              className="primary"
              ref={nextButton}
              onClick={() => (last ? onFinish() : onStep(step + 1))}
            >
              {last ? "Поехали" : step === 0 ? "Покажи" : "Дальше"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
