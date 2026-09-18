import { useLayoutEffect, useRef } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  BookOpen,
} from "lucide-react";
import { lessons, type Lesson } from "../content";
import type { Progress } from "../progress";

const titles: Record<string, string> = {
  cards: "Карты",
  actions: "Ход раздачи",
  ranges: "Стартовые руки",
};
export function TopicIcon({ lesson }: { lesson: Lesson }) {
  const assets: Record<string, string> = {
    cards: "cards",
    combinations: "combinations",
    actions: "actions",
    positions: "positions",
    ranges: "starting-hands",
  };
  const asset = assets[lesson.id];
  return (
    <span className="topic-icon" aria-hidden="true">
      {asset ? (
        <img
          src={import.meta.env.BASE_URL + "art/topic-" + asset + ".png"}
          alt=""
          width="48"
          height="48"
        />
      ) : (
        <BookOpen size={28} strokeWidth={1.6} />
      )}
    </span>
  );
}

export function Home({
  progress,
  onOpen,
  scrollPosition,
  onScroll,
}: {
  progress: Progress;
  onOpen: (lesson: Lesson, restart?: boolean) => void;
  scrollPosition: number;
  onScroll: (value: number) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (list.current) list.current.scrollTop = scrollPosition;
  }, []);
  const last = lessons.find(
    (l) =>
      l.id === progress.lastLesson &&
      l.ready &&
      !progress.lessons.includes(l.id),
  );
  const next =
    last ??
    lessons.find((l) => l.ready && !progress.lessons.includes(l.id)) ??
    lessons[0];
  const started = progress.reading?.[next.id] !== undefined;
  const finished = lessons.filter(
    (l) => /^\d+$/.test(l.num) && progress.lessons.includes(l.id),
  ).length;
  return (
    <>
      <div className="home-intro">
        <h1>Учимся играть</h1>
        <span>{finished} из 13 модулей прочитано</span>
        <div className="bar">
          <span style={{ width: (finished / 13) * 100 + "%" }} />
        </div>
      </div>
      <section className="current-lesson">
        <div className="current-copy">
          <span className="eyebrow">
            {next.num} · {started ? "ПРОДОЛЖАЕМ" : "СЛЕДУЮЩИЙ УРОК"}
          </span>
          <h2>{titles[next.id] ?? next.title}</h2>
          <p>{next.subtitle}</p>
          <span className="reading-time">
            <Clock3 size={13} /> 5–10 минут
          </span>
        </div>
        <div className="current-art" aria-hidden="true">
          <img
            src={import.meta.env.BASE_URL + "art/lesson-cards-chips.png"}
            alt=""
            width="112"
            height="84"
          />
        </div>
        <button className="primary" onClick={() => onOpen(next)}>
          {started ? "Продолжить урок" : "Начать урок"}
          <ArrowRight size={18} />
        </button>
      </section>
      <div className="route-heading">
        <h2>Уроки</h2>
        <span>Пройденное можно повторить</span>
      </div>
      <div
        className="lesson-scroll"
        ref={list}
        tabIndex={0}
        role="region"
        aria-label="Список уроков"
        onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
      >
        {lessons.map((l) => {
          const done = progress.lessons.includes(l.id);
          return (
            <button
              key={l.id}
              className={
                "route-row " +
                (next.id === l.id ? "current " : "") +
                (!l.ready ? "unavailable" : "")
              }
              onClick={() => onOpen(l, done)}
              disabled={!l.ready}
              aria-label={
                (done ? "Повторить: " : l.ready ? "Открыть: " : "Готовится: ") +
                l.title
              }
            >
              <TopicIcon lesson={l} />
              <span className="route-copy">
                <strong>
                  <span className="route-number">{l.num}</span>
                  {titles[l.id] ?? l.title}
                </strong>
                <small>
                  {l.ready
                    ? l.subtitle
                    : l.id === "preflop"
                      ? "Ожидает проверенных диапазонов"
                      : "Материал готовится"}
                </small>
              </span>
              {done ? (
                <span className="repeat-mark">
                  <CheckCircle2 size={19} />
                  <small>Повторить</small>
                </span>
              ) : (
                <ChevronRight className="route-chevron" size={18} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
