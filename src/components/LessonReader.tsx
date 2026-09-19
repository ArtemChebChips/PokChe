import { PokerTable } from "./PokerTable";
import { StreetCards } from "./StreetCards";
import { rankingExamples } from "../rankingExamples";
import { FlushExample } from "./FlushExample";
import { HandExample } from "./HandExample";
import { Suit } from "./Suit";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Lesson } from "../content";
import type { Progress } from "../progress";
import { Cards } from "./PlayingCard";
import { Ivanych } from "./Ivanych";

export function LessonReader({
  lesson,
  step,
  progress,
  onStep,
  onBack,
  onNextLesson,
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
  onNextLesson?: () => void;
  onComplete: () => void;
  onTrain: () => void;
  onFormat: (format: Progress["format"]) => void;
  loading: boolean;
}) {
  const [finished, setFinished] = useState(false);
  const sections = [
    ...new Set(
      lesson.slides.map((s) => s.section).filter((s): s is string => !!s),
    ),
  ];
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
            ? "Можно порешать задачи на эту тему или перейти к следующему уроку."
            : "К этому уроку всегда можно вернуться."}
        </p>

        {lesson.skills.length > 0 && (
          <button className="primary" onClick={onTrain} disabled={loading}>
            Тренироваться
            <ArrowRight size={18} />
          </button>
        )}
        {onNextLesson && (
          <button className="secondary" onClick={onNextLesson}>
            Следующий урок
            <ArrowRight size={18} />
          </button>
        )}
        <button className="text-button" onClick={onBack}>
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
      <nav
        className={
          "chapter-progress" +
          (lesson.id === "combinations" ? " chapter-tabs" : "")
        }
        aria-label="Главы урока"
      >
        {(sections.length ? sections : [""]).map((section, chapter) => {
          const indices = lesson.slides
            .map((s, i) => (!sections.length || s.section === section ? i : -1))
            .filter((i) => i >= 0);
          return (
            <div
              className="chapter"
              key={section}
              style={{ flexGrow: indices.length }}
            >
              {sections.length > 0 && (
                <button
                  aria-label={"Глава " + (chapter + 1) + ": " + section}
                  aria-current={slide.section === section ? "step" : undefined}
                  style={
                    lesson.id === "combinations"
                      ? {
                          left: `calc((100% - ${(indices.length - 1) * 3}px) / ${indices.length * 2})`,
                        }
                      : undefined
                  }
                  onClick={() => onStep(indices[0])}
                >
                  <span className="chapter-number">{chapter + 1}</span>
                </button>
              )}
              <div
                className="reader-steps"
                aria-label={"Шаг " + (step + 1) + " из " + lesson.slides.length}
              >
                {indices.map((i) => (
                  <span key={i} className={i <= step ? "read" : ""} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
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
        {slide.tablePosition && <PokerTable position={slide.tablePosition} />}
        {slide.street !== undefined && <StreetCards count={slide.street} />}
        {slide.cards && <Cards cards={slide.cards} />}
        {slide.hands?.map((h, i) => (
          <HandExample key={i} {...h} />
        ))}
        {slide.ranking && (
          <ol className="ranking-list">
            {rankingExamples.map((h, i) => (
              <li key={h.label}>
                <span>{i + 1}</span>
                <HandExample {...h} />
              </li>
            ))}
          </ol>
        )}
        {lesson.id === "cards" && step === 0 && (
          <div className="suit-guide">
            {[
              ["s", "Пики"],
              ["h", "Червы"],
              ["d", "Бубны"],
              ["c", "Трефы"],
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
        {slide.example && <p>{slide.example}</p>}
      </div>
      {slide.coachExample === "flush" && <FlushExample />}
      {slide.coach && (
        <Ivanych pose="explain" advice>
          <p>{slide.coach}</p>
        </Ivanych>
      )}
      {lesson.id === "cards" && step === 2 && (
        <Ivanych pose="explain" advice>
          <p>
            Запомни тройку J → Q → K. Именно эти буквы чаще путают в начале.
          </p>
        </Ivanych>
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
