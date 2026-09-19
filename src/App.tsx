import { WelcomeTour } from "./components/WelcomeTour";
import { tourSteps, needsTour, rememberTour } from "./tour";
import { RangeExample } from "./components/RangeExample";
import { StackExample } from "./components/StackExample";
import { PokerTable } from "./components/PokerTable";
import { HandExample } from "./components/HandExample";
import { CorrectBurst } from "./components/CorrectBurst";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Grid2X2,
  Lightbulb,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  WifiOff,
  X,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { lessons, skillNames, type Lesson, type Skill } from "./content";
import { allSkills, check, shuffle, type Task } from "./tasks";
import {
  loadProgress,
  mastery,
  record,
  storageKey,
  validProgress,
  type Progress,
} from "./progress";
import { sourceReview } from "./strategy";
import { glossary } from "./glossary";
import { Home } from "./components/Home";
import { Card, Cards } from "./components/PlayingCard";
import { LessonReader } from "./components/LessonReader";
import { Ivanych } from "./components/Ivanych";
import { Logo } from "./components/Logo";

function Bar({ value }: { value: number }) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
type Session = {
  skills: Skill[];
  tasks: Task[];
  index: number;
  results: boolean[];
  review: boolean;
};

export default function App() {
  const [initial] = useState(loadProgress);
  const [tourStep, setTourStep] = useState<number | null>(() =>
    needsTour() ? 0 : null,
  );
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [storageBlocked, setStorageBlocked] = useState(!!initial.error);
  const [tab, setTab] = useState<"learn" | "train" | "progress">("learn");
  const [screen, setScreen] = useState<
    | "main"
    | "lesson"
    | "session"
    | "summary"
    | "settings"
    | "matrix"
    | "formats"
  >("main");
  useEffect(() => {
    if (tourStep === null) return;
    const current = tourSteps[tourStep];
    setTab(current.tab);
    setScreen(current.target === "settings" ? "settings" : "main");
  }, [tourStep]);
  function finishTour() {
    rememberTour();
    setTourStep(null);
    setScreen("main");
    setTab("learn");
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(".brand")?.focus(),
    );
  }
  const [lesson, setLesson] = useState<Lesson>(lessons[0]);
  const [step, setStep] = useState(0);
  const homeScroll = useRef(0);
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [graded, setGraded] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const worker = useRef<Worker | null>(null);
  const [quit, setQuit] = useState(false);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      setError(
        "Не удалось подготовить офлайн-режим. Откройте приложение по HTTPS и повторите загрузку.",
      );
    },
  });
  const [cached, setCached] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .getRegistration()
        .then((r) => setCached(!!r?.active))
        .catch(() => setCached(false));
  }, []);
  useEffect(() => {
    if (storageBlocked) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
      setStorageError("");
    } catch {
      setStorageError(
        "Не удалось сохранить прогресс на устройстве. Экспортируйте копию в настройках.",
      );
    }
  }, [progress, storageBlocked]);
  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      worker.current?.terminate();
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen, tab, step, session?.index]);
  const completedLessons = lessons.filter(
    (l) => l.ready && progress.lessons.includes(l.id),
  ).length;
  const solved = progress.attempts.length;
  const today = new Date().toLocaleDateString("sv-SE");
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [screen, tab, step, session?.index]);
  const task = session?.tasks[session.index];
  function openLesson(l: Lesson, restart = false) {
    const next = restart
      ? 0
      : Math.min(progress.reading?.[l.id] ?? 0, l.slides.length - 1);
    setLesson(l);
    setStep(next);
    setProgress((p) => ({
      ...p,
      lastLesson: l.id,
      reading: { ...p.reading, [l.id]: next },
    }));
    setScreen("lesson");
  }
  function readStep(next: number) {
    setStep(next);
    setProgress((p) => ({
      ...p,
      lastLesson: lesson.id,
      reading: { ...p.reading, [lesson.id]: next },
    }));
  }
  function resetAnswer() {
    setAnswer("");
    setSelected([]);
    setGraded(null);
    setHint(false);
  }
  function start(skills: Skill[] = allSkills, review = false) {
    setError("");
    resetAnswer();
    if (review) {
      const tasks = progress.mistakes;
      if (!tasks.length) return;
      setSession({ tasks, skills: [], index: 0, results: [], review: true });
      setScreen("session");
      return;
    }
    setLoading(true);
    worker.current?.terminate();
    const w = new Worker(new URL("./training.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onmessage = (event: MessageEvent<{ tasks?: Task[]; error?: string }>) => {
      setLoading(false);
      w.terminate();
      if (event.data.error || !event.data.tasks) {
        setError("Не удалось создать задачи. Попробуйте ещё раз.");
        return;
      }
      setSession({
        tasks: event.data.tasks,
        skills,
        index: 0,
        results: [],
        review: false,
      });
      setScreen("session");
    };
    w.onerror = () => {
      setLoading(false);
      setError("Не удалось загрузить тренажёр. Перезагрузите приложение.");
      w.terminate();
    };
    w.postMessage({ skills: shuffle(skills), count: 5 });
  }
  function similar() {
    if (!task || !session || loading) return;
    setLoading(true);
    const w = new Worker(new URL("./training.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onmessage = (e: MessageEvent<{ tasks?: Task[]; error?: string }>) => {
      setLoading(false);
      w.terminate();
      if (!e.data.tasks?.length) {
        setError("Не удалось подготовить похожую задачу.");
        return;
      }
      const tasks = [...session.tasks];
      tasks.splice(session.index + 1, 0, e.data.tasks[0]);
      setSession({ ...session, tasks, index: session.index + 1 });
      resetAnswer();
    };
    w.onerror = () => {
      setLoading(false);
      setError("Не удалось подготовить похожую задачу.");
      w.terminate();
    };
    w.postMessage({ skills: [task.skill], count: 1, similarTo: task });
  }
  function submit() {
    if (!task || !session || graded !== null) return;
    const correct = check(task, answer, selected);
    setGraded(correct);
    setProgress((p) => record(p, task, correct, hint));
    setSession({ ...session, results: [...session.results, correct] });
  }
  function next() {
    if (!session || loading) return;
    if (task?.nextTask) {
      const tasks = [...session.tasks];
      tasks.splice(session.index + 1, 0, task.nextTask);
      setSession({ ...session, tasks, index: session.index + 1 });
      resetAnswer();
      return;
    }
    if (session.index < session.tasks.length - 1) {
      setSession({ ...session, index: session.index + 1 });
      resetAnswer();
      return;
    }
    if (session.review) {
      setScreen("summary");
      return;
    }
    setLoading(true);
    setError("");
    const w = new Worker(new URL("./training.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onmessage = (e: MessageEvent<{ tasks?: Task[]; error?: string }>) => {
      setLoading(false);
      w.terminate();
      if (!e.data.tasks?.length) {
        setError(
          "Не удалось подготовить следующую задачу. Попробуйте ещё раз.",
        );
        return;
      }
      setSession({
        ...session,
        tasks: [...session.tasks, ...e.data.tasks],
        index: session.index + 1,
      });
      resetAnswer();
    };
    w.onerror = () => {
      setLoading(false);
      w.terminate();
      setError("Не удалось загрузить следующую задачу.");
    };
    w.postMessage({
      skills: shuffle(session.skills),
      count: 5,
    });
  }
  const nextLesson = lessons
    .slice(lessons.findIndex((l) => l.id === lesson.id) + 1)
    .find((l) => l.ready);
  function finishLesson() {
    setProgress((p) => ({
      ...p,
      lessons: [...new Set([...p.lessons, lesson.id])],
    }));
  }
  const back = () => {
    if (screen === "session" && graded === null) setQuit(true);
    else setScreen("main");
  };
  function exportProgress() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `river-progress-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importProgress(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw Error();
      const parsed = JSON.parse(await file.text());
      if (!validProgress(parsed)) throw Error();
      setProgress(parsed);
      setStorageBlocked(false);
      setError("Резервная копия восстановлена.");
    } catch {
      setError(
        "Файл не похож на резервную копию PokChe. Текущий прогресс сохранён.",
      );
    }
  }
  return (
    <div
      className="app"
      data-tour={tourStep === null ? undefined : tourSteps[tourStep].target}
    >
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            if (screen === "session") setQuit(true);
            else setScreen("main");
          }}
          aria-label="PokChe — на главную"
        >
          <Logo />
          PokChe
        </button>
        <button
          className="icon-button"
          aria-label="Настройки и установка"
          onClick={() => {
            if (screen === "session") setQuit(true);
            else setScreen("settings");
          }}
        >
          <Settings2 size={21} />
        </button>
      </header>
      {!online && (
        <div className="status-note">
          <WifiOff size={15} /> Без интернета · прогресс на устройстве
        </div>
      )}
      {storageError && (
        <div className="notice" role="alert">
          {storageError}
        </div>
      )}
      {error && (
        <div className="notice" role="status">
          {error}
          <button onClick={() => setError("")} aria-label="Закрыть уведомление">
            <X size={16} />
          </button>
        </div>
      )}
      {needRefresh && screen === "main" && (
        <div className="notice">
          Есть обновление{" "}
          <button onClick={() => updateServiceWorker(true)}>Обновить</button>
        </div>
      )}
      <main
        ref={mainRef}
        className={
          screen === "main" && tab === "learn" ? "main-home" : "main-content"
        }
      >
        {screen === "main" && tab === "learn" && (
          <Home
            progress={progress}
            onOpen={openLesson}
            scrollPosition={homeScroll.current}
            onScroll={(v) => {
              homeScroll.current = v;
            }}
          />
        )}
        {screen === "main" && tab === "train" && (
          <>
            <h1>Тренажёры</h1>
            <p className="lead">
              Выбери навык. Решай по одной задаче и заканчивай, когда захочешь.
            </p>
            <button
              className="feature-action"
              onClick={() => start()}
              disabled={loading}
            >
              <span className="feature-icon">
                <Sparkles />
              </span>
              <span>
                <strong>Смешанная тренировка</strong>
                <small>Разные навыки · в своём темпе</small>
              </span>
              <ArrowRight />
            </button>
            <button
              className="review-action"
              disabled={!progress.mistakes.length || loading}
              onClick={() => start([], true)}
            >
              <RotateCcw size={21} />
              <span>
                <strong>Повторить ошибки</strong>
                <small>
                  {progress.mistakes.length
                    ? `${progress.mistakes.length} задач ждут разбора`
                    : "Пока нет ошибок для повторения"}
                </small>
              </span>
              <ChevronRight size={19} />
            </button>
            <div className="section-heading">
              <h2>Выберите навык</h2>
              <span>{allSkills.length} тренажёров</span>
            </div>
            <div className="skill-list">
              {allSkills.map((s, i) => (
                <button key={s} disabled={loading} onClick={() => start([s])}>
                  <span className="skill-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{skillNames[s]}</strong>
                    <small>
                      {["betting", "ranges", "planning", "advanced"].includes(s)
                        ? "Заданные условия · проверяемый расчёт"
                        : s === "adjustment"
                          ? "Частоты · данные и неопределённость"
                          : s === "equity"
                            ? "Конкретная рука · полный перебор"
                            : s === "spr"
                              ? "Оставшийся стек ÷ банк"
                              : "Точный ответ · без лимита задач"}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
            <button
              className="review-action"
              onClick={() => setScreen("matrix")}
            >
              <Grid2X2 size={21} />
              <span>
                <strong>Матрица стартовых рук</strong>
                <small>Исследуйте 169 типов рук</small>
              </span>
              <ChevronRight size={18} />
            </button>
            <details className="info-box">
              <summary>О моделях и источниках</summary>
              <p>{sourceReview.reason}</p>
              <p>
                Сейчас доступны точные расчёты и пять ограниченных моделей
                ривера. Полные чарты открытий и ответы на 3-бет требуют
                проверенного набора с совпадающими условиями. Турнирная ветка
                пока в программе развития.
              </p>
              <a href={sourceReview.url} target="_blank" rel="noreferrer">
                Посмотреть источник ↗
              </a>
            </details>
          </>
        )}
        {screen === "main" && tab === "progress" && (
          <>
            <h1>Мой прогресс</h1>
            <p className="lead">Пройденные уроки и результаты практики.</p>
            <div className="stats">
              <div>
                <strong>{solved}</strong>
                <span>решено задач</span>
              </div>
              <div>
                <strong>
                  {solved
                    ? Math.round(
                        (progress.attempts.filter((a) => a.correct).length /
                          solved) *
                          100,
                      )
                    : 0}
                  <small>%</small>
                </strong>
                <span>верных ответов</span>
              </div>
              <div>
                <strong>{progress.days.length}</strong>
                <span>дней практики</span>
              </div>
            </div>
            <section className="progress-card">
              <div className="section-heading">
                <h2>Уроки изучены</h2>
                <strong>
                  {completedLessons}/{lessons.filter((l) => l.ready).length}
                </strong>
              </div>
              <Bar
                value={
                  (completedLessons / lessons.filter((l) => l.ready).length) *
                  100
                }
              />
              <p>Урок завершён и навык освоен — разные достижения.</p>
            </section>
            <div className="section-heading">
              <h2>Ваши навыки</h2>
              <span>Последние 10 ответов</span>
            </div>
            <div className="mastery-list">
              {allSkills.map((s) => {
                const m = mastery(progress, s);
                return (
                  <button key={s} onClick={() => start([s])} disabled={loading}>
                    <div>
                      <strong>{skillNames[s]}</strong>
                      <span>
                        {m.mastered ? (
                          <CheckCircle2 size={17} />
                        ) : m.total ? (
                          `${m.accuracy}%`
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                    <Bar value={m.total ? m.accuracy : 0} />
                    <small>
                      {m.mastered
                        ? "Освоен"
                        : m.total
                          ? `${m.total}/10 ответов без подсказки${m.requiredDiversity ? ` · типы задач ${Math.min(m.diversity, m.requiredDiversity)}/${m.requiredDiversity}` : ""}`
                          : "Ещё не тренировались"}
                    </small>
                  </button>
                );
              })}
            </div>
            <p className="muted">
              Освоен: минимум 8 верных из последних 10 ответов без подсказки.
              Для тем 07–12 нужны разные типы задач; повтор той же сохранённой
              задачи не увеличивает счётчик. Это учебный ориентир.
            </p>
            <button
              className="primary"
              disabled={!progress.mistakes.length || loading}
              onClick={() => start([], true)}
            >
              Повторить ошибки · {progress.mistakes.length}
              <RotateCcw size={18} />
            </button>
          </>
        )}
        {screen === "lesson" && (
          <LessonReader
            key={lesson.id}
            lesson={lesson}
            step={step}
            onStep={readStep}
            onBack={back}
            onNextLesson={
              nextLesson ? () => openLesson(nextLesson, true) : undefined
            }
            onComplete={finishLesson}
            onTrain={() => start(lesson.skills)}
            loading={loading}
          />
        )}
        {screen === "session" && task && session && (
          <>
            <div className="session-heading">
              <button
                className="icon-button"
                aria-label="Выйти из тренировки"
                onClick={back}
              >
                <X size={21} />
              </button>
              <span>{session.review ? "Повторение ошибок" : "Практика"}</span>
              <strong>Задание {session.index + 1}</strong>
            </div>
            <p className="practice-count">
              Решено: {session.results.length} · Верно:{" "}
              {session.results.filter(Boolean).length}
            </p>
            <div className="task-type">
              <ShieldCheck size={14} />{" "}
              {task.model
                ? task.model
                : task.skill === "equity"
                  ? "Точный расчёт · оценка округлена"
                  : "Точный ответ"}
            </div>
            <h1 className="task-title">{task.title}</h1>
            {task.context && <p className="context">{task.context}</p>}
            {task.stacks && <StackExample {...task.stacks} />}
            {task.scene && <PokerTable scene={task.scene} />}
            {(task.cards || task.board) && (
              <section
                className={
                  "table " + (task.skill === "cards" ? "comparison-table" : "")
                }
              >
                <div className="table-label">
                  {task.opponent
                    ? "ВСКРЫТИЕ / ИЗВЕСТНЫЕ РУКИ"
                    : "УЧЕБНАЯ СИТУАЦИЯ"}
                </div>
                {task.opponent && (
                  <div className="hand">
                    <span>Соперник</span>
                    <Cards cards={task.opponent} />
                  </div>
                )}
                {(task.board ||
                  (task.cards?.length === 7 && !task.opponent)) && (
                  <div className="board">
                    <span>Общие карты</span>
                    <div
                      className={
                        "cards board-cards " +
                        (task.selection ? "select-cards" : "")
                      }
                    >
                      {(task.board ?? task.cards!.slice(0, 5)).map((c) => (
                        <Card
                          key={c}
                          card={c}
                          active={selected.includes(c)}
                          onClick={
                            task.selection && graded === null
                              ? () =>
                                  setSelected((p) =>
                                    p.includes(c)
                                      ? p.filter((x) => x !== c)
                                      : p.length < 5
                                        ? [...p, c]
                                        : p,
                                  )
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
                {task.cards && (
                  <div className="hand">
                    <span>
                      {task.board || task.opponent || task.cards.length === 7
                        ? "Ваши личные карты"
                        : "Карты"}
                    </span>
                    <div
                      className={
                        "cards " + (task.selection ? "select-cards" : "")
                      }
                    >
                      {(task.cards.length === 7 && !task.board && !task.opponent
                        ? task.cards.slice(5)
                        : task.cards
                      ).map((c) => (
                        <Card
                          key={c}
                          card={c}
                          active={selected.includes(c)}
                          onClick={
                            task.selection && graded === null
                              ? () =>
                                  setSelected((p) =>
                                    p.includes(c)
                                      ? p.filter((x) => x !== c)
                                      : p.length < 5
                                        ? [...p, c]
                                        : p,
                                  )
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
            {task.range && <RangeExample range={task.range} />}
            <h2 className="prompt">{task.prompt}</h2>
            <details className="task-glossary" key={task.id}>
              <summary>Объяснить термины</summary>
              <p>{glossary[task.skill]}</p>
            </details>
            {task.selection ? (
              <p className="muted">
                Выбрано {selected.length} из 5. Любая равноценная лучшая пятёрка
                принимается.
              </p>
            ) : (
              <div className="choices">
                {task.choices.map((c) => (
                  <button
                    key={c}
                    disabled={graded !== null}
                    aria-pressed={answer === c}
                    onClick={() => setAnswer(c)}
                    className={`${answer === c ? "chosen" : ""} ${graded !== null && (task.acceptedAnswers ?? [task.answer]).includes(c) ? "correct" : ""} ${graded === false && answer === c ? "wrong" : ""}`}
                  >
                    {c}
                    {graded !== null &&
                    (task.acceptedAnswers ?? [task.answer]).includes(c) ? (
                      <Check size={20} />
                    ) : (
                      <span className="radio" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {graded === null ? (
              <>
                <button className="hint" onClick={() => setHint(true)}>
                  <Lightbulb size={17} /> Нужна подсказка
                </button>
                {hint && (
                  <Ivanych pose="thinking">
                    <p>{task.hint}</p>
                  </Ivanych>
                )}
                <button
                  className="primary"
                  disabled={task.selection ? selected.length !== 5 : !answer}
                  onClick={submit}
                >
                  Проверить ответ <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <div
                  className={`feedback ${graded ? "success" : "retry"}`}
                  role="status"
                >
                  <strong>
                    {graded ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Lightbulb size={20} />
                    )}{" "}
                    {graded
                      ? "Верно. Так держать!"
                      : "Ошибка — повод разобраться"}
                  </strong>
                  {graded && <CorrectBurst key={task.id} />}
                  <p>
                    {task.explanation.charAt(0).toUpperCase() +
                      task.explanation.slice(1)}
                  </p>
                  {task.solution && (
                    <HandExample
                      label={
                        task.opponent
                          ? "Ваша комбинация из пяти карт"
                          : "Лучшая комбинация из пяти карт"
                      }
                      cards={task.solution}
                    />
                  )}
                  {task.opponentSolution && (
                    <HandExample
                      label="Пятёрка соперника"
                      cards={task.opponentSolution}
                    />
                  )}
                  {task.details && (
                    <details>
                      <summary>Подробнее о проверке</summary>
                      <p>{task.details}</p>
                    </details>
                  )}
                  {!graded && (
                    <>
                      <small>Задача сохранена в повторениях.</small>
                      <button
                        className="text-button"
                        disabled={loading}
                        onClick={similar}
                      >
                        Решить похожую задачу
                      </button>
                    </>
                  )}
                </div>
                <button className="primary" onClick={next} disabled={loading}>
                  {session.review &&
                  session.index === session.tasks.length - 1 &&
                  !task.nextTask
                    ? "Закончить повторение"
                    : task.nextTask
                      ? "Следующее решение"
                      : "Следующая задача"}
                  <ArrowRight size={18} />
                </button>
                <button
                  className="secondary"
                  disabled={loading}
                  onClick={() => setScreen("summary")}
                >
                  Закончить тренировку
                </button>
              </>
            )}
          </>
        )}
        {screen === "summary" && session && (
          <section className="summary">
            <h1>Практика завершена</h1>
            {session.results.length >= 3 && (
              <Ivanych pose="cheers">
                <p>За хорошие решения. Спешку оставим соперникам.</p>
              </Ivanych>
            )}
            <div className="big-result">
              {session.results.filter(Boolean).length}
              <span> / {session.results.length}</span>
            </div>
            <p>верных ответов</p>
            <div className="result-dots">
              {session.results.slice(-30).map((r, i) => (
                <span className={r ? "ok" : "miss"} key={i}>
                  {r ? <Check size={18} /> : <RotateCcw size={16} />}
                </span>
              ))}
            </div>
            <p className="lead">
              {session.results.every(Boolean)
                ? "Отличная работа. Закрепите навык новой подборкой."
                : "Ошибки сохранены. Короткое повторение поможет закрепить разбор."}
            </p>
            <button
              className="primary"
              onClick={() =>
                start([...new Set(session.tasks.map((t) => t.skill))])
              }
              disabled={loading}
            >
              Продолжить практику
              <ArrowRight size={18} />
            </button>
            {progress.mistakes.length > 0 && (
              <button className="secondary" onClick={() => start([], true)}>
                Повторить ошибки · {progress.mistakes.length}
              </button>
            )}
            <button
              className="text-button"
              onClick={() => {
                setTab("progress");
                setScreen("main");
              }}
            >
              Посмотреть прогресс
            </button>
            <div className="small-note">
              <ShieldCheck size={16} />
              {storageError
                ? "Проверьте сохранение в настройках"
                : "Прогресс сохранён на устройстве"}
            </div>
          </section>
        )}
        {screen === "matrix" && (
          <>
            <button className="back" onClick={back}>
              <ArrowLeft size={18} /> К тренажёрам
            </button>
            <div className="eyebrow">ИССЛЕДУЕМ РУКИ</div>
            <h1>Матрица рук</h1>
            <p className="lead">
              Выберите клетку или найдите руку в списке. Это свободная матрица,
              без оценки стратегии.
            </p>
            <RangeMatrix />
            <div className="info-box">
              <strong>«Собери диапазон» — следующий этап</strong>
              <p>
                Проверенного набора пока нет. Выбранные клетки не являются
                рекомендацией к розыгрышу.
              </p>
            </div>
          </>
        )}
        {screen === "formats" && (
          <article className="formats-guide">
            <button className="back" onClick={() => setScreen("settings")}>
              <ArrowLeft size={18} /> Настройки
            </button>
            <h1>Кэш и турниры</h1>
            <p className="lead">
              Правила раздачи одинаковые. Отличаются ценность фишек,
              длительность игры и условия победы.
            </p>
            <h2>Кэш — игра отдельными раздачами</h2>
            <p>
              Вы садитесь за стол с определённой суммой. Фишки соответствуют
              деньгам: например, 100 фишек по 1 ₽ — это 100 ₽. Блайнды за
              выбранным столом обычно постоянны. Между раздачами можно закончить
              игру и забрать стоимость оставшихся фишек.
            </p>
            <p>
              Если стек уменьшился, его можно пополнить в пределах правил стола.
              Проигрыш всех фишек не означает выбывания из соревнования: в кэше
              нет общей турнирной дистанции и призовых мест.
            </p>
            <h2>Турнир — одна общая дистанция</h2>
            <p>
              Участники оплачивают вход — бай-ин — и получают стартовый стек.
              Турнирные фишки нельзя обменять на деньги напрямую: 10 000 в стеке
              не означают 10 000 ₽. Призы зависят от занятого места и структуры
              выплат.
            </p>
            <p>
              Блайнды растут по расписанию, поэтому тот же стек со временем
              содержит всё меньше больших блайндов. Например, 10 000 фишек при
              BB 100 — это 100 BB, а при BB 500 — уже 20 BB. Иногда добавляется
              анте — ещё одна обязательная ставка.
            </p>
            <p>
              Когда фишки заканчиваются, игрок выбывает. Некоторые турниры
              допускают повторный вход или докупку в оговорённый период. Просто
              уйти и забрать стоимость своего стека, как в кэше, нельзя.
            </p>
            <h2>Что меняется в решениях</h2>
            <p>
              Комбинации и порядок действий общие. В кэше сравнивают денежный
              результат решений. В турнире нужно учитывать ещё стадию, рост
              блайндов и близость призов: удвоение стека не означает удвоение
              будущего выигрыша.
            </p>
            <section className="info-box">
              <h2>Что вам интереснее?</h2>
              <div className="toggle">
                <button
                  aria-pressed={progress.format === "cash"}
                  className={progress.format === "cash" ? "active" : ""}
                  onClick={() => setProgress((p) => ({ ...p, format: "cash" }))}
                >
                  Кэш
                </button>
                <button
                  aria-pressed={progress.format === "tournament"}
                  className={progress.format === "tournament" ? "active" : ""}
                  onClick={() =>
                    setProgress((p) => ({ ...p, format: "tournament" }))
                  }
                >
                  Турниры
                </button>
              </div>
              <p>
                Выбор сохраняется как ваше предпочтение. Текущие уроки и
                тренировки дают общую базу и от этого выбора не меняются.
              </p>
            </section>
          </article>
        )}
        {screen === "settings" && (
          <>
            <button className="back" onClick={back}>
              <ArrowLeft size={18} /> Назад
            </button>
            <h1>Всё под рукой.</h1>
            <button
              className="secondary replay-tour"
              onClick={() => setTourStep(0)}
            >
              Экскурсия с Иванычем
            </button>
            <p className="lead">PokChe · версия 0.1 · личная практика</p>
            <section className="info-box">
              <h2>
                <Download size={20} /> На главный экран
              </h2>
              <p>
                <strong>iPhone:</strong> откройте HTTPS-ссылку в Safari →
                «Поделиться» → «На экран Домой». Если есть переключатель
                «Открывать как веб-приложение», включите его.
              </p>
              <p>
                <strong>Android:</strong> откройте HTTPS-ссылку в Chrome → меню
                ⋮ → «Добавить на главный экран» → «Установить» (название зависит
                от версии).
              </p>
              <p>
                <strong>
                  {offlineReady || cached
                    ? "Базовые материалы готовы офлайн."
                    : "Офлайн-копия ещё не подтверждена."}
                </strong>{" "}
                Первый запуск нужен с интернетом. Откройте установленное
                приложение и дождитесь готовности офлайн.
              </p>
              <p className="muted">
                На телефоне адрес http://IP-компьютера не даёт полноценную PWA.
                Нужен HTTPS. На компьютере localhost подходит для проверки.
              </p>
            </section>
            <section className="info-box">
              <h2>Прогресс на устройстве</h2>
              <p>
                Без аккаунта и синхронизации. Очистка данных браузера удалит
                прогресс. Safari и установленное приложение могут хранить его
                отдельно — используйте резервную копию.
              </p>
              <button className="secondary" onClick={exportProgress}>
                Скачать резервную копию
              </button>
              <label className="file-label">
                Восстановить из файла
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    void importProgress(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="muted">
                Восстановление заменит текущий прогресс данными файла.
              </p>
            </section>
            <section className="info-box">
              <h2>Об игре</h2>
              <button
                className="secondary"
                onClick={() => setScreen("formats")}
              >
                Кэш и турниры: в чём разница <ChevronRight size={18} />
              </button>
            </section>
            <details className="info-box">
              <summary>Источники и точность</summary>
              <p>
                Правила и формулы проверяются детерминированно. Эквити на тёрне
                — полный перебор 44 риверов против указанной руки; ничья даёт
                половину банка. Симуляция не используется.
              </p>
              <p>
                {sourceReview.name} · проверка {sourceReview.checked}.{" "}
                {sourceReview.reason}
              </p>
              <a href={sourceReview.url} target="_blank" rel="noreferrer">
                Исходный PDF ↗
              </a>
              <p>
                Постфлоп-солвер b-inary исследован: AGPL-3.0, разработка
                приостановлена. Код не встроен, рассчитанной базы в приложении
                нет.
              </p>
              <a
                href="https://github.com/b-inary/postflop-solver"
                target="_blank"
                rel="noreferrer"
              >
                Репозиторий солвера ↗
              </a>
            </details>
          </>
        )}
      </main>
      {loading && (
        <div className="loading" role="status">
          <span className="spinner" /> Готовим новые задачи…
        </div>
      )}
      {quit && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
          >
            <h2 id="quit-title">Закончить сейчас?</h2>
            <p>
              Проверенные ответы уже сохранены. Незавершённая задача не
              учитывается.
            </p>
            <button
              autoFocus
              className="primary"
              onClick={() => setQuit(false)}
            >
              Продолжить тренировку
            </button>
            <button
              className="secondary"
              onClick={() => {
                setQuit(false);
                setScreen("main");
              }}
            >
              Выйти
            </button>
          </section>
        </div>
      )}
      {tourStep !== null && (
        <WelcomeTour
          step={tourStep}
          onStep={setTourStep}
          onFinish={finishTour}
        />
      )}
      {screen === "main" && (
        <nav className="bottom-nav" aria-label="Основная навигация">
          {(
            [
              { id: "learn", label: "Обучение", Icon: BookOpen },
              { id: "train", label: "Тренажёры", Icon: Target },
              {
                id: "progress",
                label: "Мой прогресс",
                Icon: ChartNoAxesColumnIncreasing,
              },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "active" : ""}
              key={id}
              onClick={() => setTab(id)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function RangeMatrix() {
  const rs = [..."AKQJT98765432"];
  const labels = rs.flatMap((a, i) =>
    rs.map((b, j) => (i === j ? a + b : i < j ? a + b + "s" : b + a + "o")),
  );
  const [cell, setCell] = useState("AA");
  const [marked, setMarked] = useState<string[]>([]);
  return (
    <>
      <div className="matrix" aria-label="Матрица стартовых рук">
        {labels.map((l) => (
          <button
            key={l}
            aria-label={l}
            aria-pressed={cell === l}
            className={`${l.length === 2 ? "pair" : l.endsWith("s") ? "suited" : "offsuit"} ${cell === l ? "focused" : ""} ${marked.includes(l) ? "marked" : ""}`}
            onClick={() => setCell(l)}
          >
            {l}
          </button>
        ))}
      </div>
      <section className="cell-editor">
        <label htmlFor="hand-select">Выбрать руку крупным списком</label>
        <select
          id="hand-select"
          value={cell}
          onChange={(e) => setCell(e.target.value)}
        >
          {labels.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <div className="cell-description">
          <strong>{cell}</strong>
          <span>
            {cell.length === 2
              ? "Пара · 6 комбинаций"
              : cell.endsWith("s")
                ? "Одной масти · 4 комбинации"
                : "Разных мастей · 12 комбинаций"}
          </span>
        </div>
        <button
          className="primary"
          onClick={() =>
            setMarked((p) =>
              p.includes(cell) ? p.filter((x) => x !== cell) : [...p, cell],
            )
          }
        >
          {marked.includes(cell) ? "Убрать из набора" : "Добавить в набор"}
          {marked.includes(cell) ? <X size={18} /> : <Check size={18} />}
        </button>
        <p className="muted">
          Выбрано {marked.length} типов рук · учебный черновик
        </p>
        <button
          className="text-button"
          onClick={() => setMarked([])}
          disabled={!marked.length}
        >
          Очистить набор
        </button>
      </section>
    </>
  );
}
