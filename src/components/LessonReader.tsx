import { Suit } from "./Suit";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Lesson } from "../content";
import type { Progress } from "../progress";
import { Cards } from "./PlayingCard";
import { Sava } from "./Sava";

export function LessonReader({
  lesson,
  step,
  progress,
  onStep,
  onBack,
  onComplete,
  onTrain,
  onFormat,
  loading,
}: {
  lesson: Lesson;
  step: number;
  progress: Progress;
  onStep: (step: number) => void;
  onBack: () => void;
  onComplete: () => void;
  onTrain: () => void;
  onFormat: (format: Progress["format"]) => void;
  loading: boolean;
}) {
  const [finished, setFinished] = useState(false);
  const slide = lesson.slides[step],
    last = step === lesson.slides.length - 1;
  if (finished)
    return (
      <div className="lesson-complete">
        <CheckCircle2 size={36} />
        <h1>Урок пройден</h1>
        <p>{lesson.title}</p>
        <p>
          {lesson.skills.length
            ? "Переходи к практике: можно решить одну задачу или продолжать дальше."
            : "К этому уроку всегда можно вернуться."}
        </p>

        {lesson.skills.length > 0 && (
          <button className="primary" onClick={onTrain} disabled={loading}>
            Тренироваться
            <ArrowRight size={18} />
          </button>
        )}
        <button className="secondary" onClick={onBack}>
          К списку уроков
        </button>
        <button
          className="text-button"
          onClick={() => {
            setFinished(false);
            onStep(0);
          }}
        >
          Перечитать урок
        </button>
      </div>
    );
  return (
    <article className="reader">
      <div className="reader-toolbar">
        <button className="back" onClick={onBack}>
          <ArrowLeft size={18} /> Уроки
        </button>
        <span>
          {step + 1} / {lesson.slides.length}
        </span>
      </div>
      <div
        className="reader-steps"
        aria-label={"Шаг " + (step + 1) + " из " + lesson.slides.length}
      >
        {lesson.slides.map((_, i) => (
          <span key={i} className={i <= step ? "read" : ""} />
        ))}
      </div>
      <span className="eyebrow reader-topic">
        {lesson.num} · {lesson.title}
      </span>
      <h1>{slide.title}</h1>
      <p className="lesson-text">{slide.text}</p>
      <div
        className={
          "example " +
          (lesson.id === "cards" && step === 4 ? "rank-ladder" : "")
        }
      >
        {slide.cards && <Cards cards={slide.cards} />}
        {lesson.id === "cards" && step === 0 && (
          <div className="suit-guide">
            {[
              ["s", "Пики"],
              ["h", "Червы"],
              ["d", "Бубны"],
              ["c", "Трефы (крести)"],
            ].map(([s, n], i) => (
              <div key={s}>
                <strong className={i === 1 || i === 2 ? "red" : ""}>
                  <Suit suit={s} />
                </strong>
                <span>{n}</span>
              </div>
            ))}
          </div>
        )}
        {lesson.id === "cards" && step === 2 && (
          <div className="rank-labels">
            <span>Валет</span>
            <span>Дама</span>
            <span>Король</span>
          </div>
        )}
        <p>{slide.example}</p>
      </div>
      {lesson.id === "cards" && step === 2 && (
        <Sava pose="explain">
          <p>
            Совет: запомни тройку J → Q → K. Именно эти буквы чаще путают в
            начале.
          </p>
        </Sava>
      )}
      {lesson.id === "formats" && last && (
        <div className="format-picker">
          <p>Ваше направление</p>
          <div className="toggle">
            <button
              className={progress.format === "cash" ? "active" : ""}
              onClick={() => onFormat("cash")}
            >
              Кэш
            </button>
            <button
              className={progress.format === "tournament" ? "active" : ""}
              onClick={() => onFormat("tournament")}
            >
              Турниры
            </button>
          </div>
          <p className="muted">
            {progress.format === "cash"
              ? "Ориентир: 6-max, 100 BB. Сейчас доступны общие навыки."
              : "Общие навыки доступны сейчас. Турнирная стратегия появится отдельным этапом."}
          </p>
        </div>
      )}
      <div className="reader-controls">
        <button
          className="secondary"
          disabled={step === 0}
          onClick={() => onStep(step - 1)}
        >
          <ArrowLeft size={18} /> Назад
        </button>
        <button
          className="primary"
          onClick={() => {
            if (last) {
              onComplete();
              setFinished(true);
            } else onStep(step + 1);
          }}
        >
          {last ? "Завершить чтение" : "Далее"}
          <ArrowRight size={18} />
        </button>
      </div>
      {step > 0 && (
        <button className="restart-reading" onClick={() => onStep(0)}>
          <RotateCcw size={13} /> С начала урока
        </button>
      )}
    </article>
  );
}
