import { useEffect, useMemo, useState } from "react";
import {
  getCategories,
  getCategoryCounts,
  getValidQuestions,
  isAnswerCorrect,
  shuffle,
} from "../lib/questions";
import { aggregateStats, loadAttempts, saveAttempt } from "../lib/storage";
import {
  readStoredContentVersion,
  useContentVersion,
} from "../lib/contentVersion";
import type { ContentVersion } from "../types";
import QuestionCard from "../components/QuestionCard";
import { Icon } from "../components/Icon";

type FilterMode = "all" | "category" | "missed" | "unseen";
type Order = "sequential" | "random";

interface Settings {
  filter: FilterMode;
  category: string;
  order: Order;
}

function settingsStorageKey(v: ContentVersion) {
  return `secplus.practice.settings.${v}`;
}

function loadSettings(v: ContentVersion, categories: string[]): Settings {
  const fallback: Settings = {
    filter: "all",
    category: categories[0] || "",
    order: "sequential",
  };
  try {
    const raw = localStorage.getItem(settingsStorageKey(v));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const cat =
      parsed.category && categories.includes(parsed.category)
        ? parsed.category
        : categories[0] || "";
    return {
      filter: parsed.filter ?? fallback.filter,
      category: cat,
      order: parsed.order ?? fallback.order,
    };
  } catch {
    return fallback;
  }
}

function saveSettings(v: ContentVersion, s: Settings) {
  try {
    localStorage.setItem(settingsStorageKey(v), JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export default function PracticePage() {
  const { version } = useContentVersion();
  const ALL_CATEGORIES = useMemo(() => getCategories(version), [version]);
  const CATEGORY_COUNTS = useMemo(
    () => getCategoryCounts(version),
    [version]
  );
  const VALID_QUESTIONS = useMemo(
    () => getValidQuestions(version),
    [version]
  );

  const [settings, setSettings] = useState<Settings>(() =>
    loadSettings(
      readStoredContentVersion(),
      getCategories(readStoredContentVersion())
    )
  );

  useEffect(() => {
    setSettings(loadSettings(version, ALL_CATEGORIES));
  }, [version, ALL_CATEGORIES]);

  const [pool, setPool] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [tick, setTick] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionRight, setSessionRight] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  useEffect(() => {
    saveSettings(version, settings);
  }, [version, settings]);

  useEffect(() => {
    const attempts = loadAttempts(version);
    const { perQuestion } = aggregateStats(attempts);

    let qs = VALID_QUESTIONS.slice();

    if (settings.filter === "category") {
      qs = qs.filter((q) => q.category === settings.category);
    } else if (settings.filter === "missed") {
      qs = qs.filter(
        (q) => perQuestion[q.id] && !perQuestion[q.id].lastCorrect
      );
    } else if (settings.filter === "unseen") {
      qs = qs.filter((q) => !perQuestion[q.id]);
    }

    if (settings.order === "random") qs = shuffle(qs);

    setPool(qs.map((q) => q.id));
    setCursor(0);
    setSelected([]);
    setSubmitted(false);
  }, [
    version,
    VALID_QUESTIONS,
    settings.filter,
    settings.category,
    settings.order,
    tick,
  ]);

  const currentId = pool[cursor];
  const currentQuestion = useMemo(
    () => VALID_QUESTIONS.find((q) => q.id === currentId),
    [currentId]
  );

  function handleSubmit() {
    if (!currentQuestion || submitted) return;
    if (selected.length === 0) return;
    const correct = isAnswerCorrect(currentQuestion, selected);
    saveAttempt(version, {
      questionId: currentQuestion.id,
      selected: [...selected].sort(),
      correct,
      timestamp: Date.now(),
    });
    setSubmitted(true);
    if (correct) {
      setSessionRight((n) => n + 1);
      setStreak((s) => s + 1);
    } else {
      setSessionWrong((n) => n + 1);
      setStreak(0);
    }
  }

  function handleNext() {
    if (cursor + 1 >= pool.length) {
      setTick((t) => t + 1);
      return;
    }
    setCursor((c) => c + 1);
    setSelected([]);
    setSubmitted(false);
  }

  function handlePrev() {
    if (cursor === 0) return;
    setCursor((c) => c - 1);
    setSelected([]);
    setSubmitted(false);
  }

  function handleRandomJump() {
    if (pool.length === 0) return;
    const newIdx = Math.floor(Math.random() * pool.length);
    setCursor(newIdx);
    setSelected([]);
    setSubmitted(false);
  }

  // Hotkeys: Enter to submit / next, ←→ navigate, R for random.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!submitted) handleSubmit();
        else handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        if (submitted) handleNext();
      } else if (e.key.toUpperCase() === "R") {
        e.preventDefault();
        handleRandomJump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, selected, cursor, pool.length]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div>
          <div className="inline-flex items-center gap-2 chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 mb-2">
            <Icon name="practice" size={14} /> Practice ·{" "}
            {version === "v1" ? "Version 1" : "Version 2"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            Practice with instant feedback
          </h1>
          <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
            Choose a filter, answer, then keep going. Your progress is saved in
            this browser. Use <kbd className="kbd">Enter</kbd> to submit / next.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="card px-4 py-2 text-sm text-ink-700 dark:text-ink-200 inline-flex items-center gap-2">
            <Icon name="lightning" size={14} className="text-amber-500" />
            <span className="font-mono tabular-nums font-semibold">{streak}</span>
            <span className="text-ink-500 dark:text-ink-400 text-xs">streak</span>
          </div>
          <div className="card px-4 py-2 text-sm text-ink-700 dark:text-ink-200 inline-flex items-center gap-3">
            <span className="text-emerald-600 dark:text-emerald-300 font-semibold tabular-nums">
              {sessionRight}
            </span>
            <span className="text-ink-300 dark:text-ink-600">/</span>
            <span className="text-rose-600 dark:text-rose-300 font-semibold tabular-nums">
              {sessionWrong}
            </span>
            <span className="text-ink-500 dark:text-ink-400 text-xs">
              this session
            </span>
          </div>
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label mb-1 block">Filter</label>
            <select
              value={settings.filter}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  filter: e.target.value as FilterMode,
                })
              }
              className="input w-full"
            >
              <option value="all">
                All questions ({VALID_QUESTIONS.length})
              </option>
              <option value="category">By domain</option>
              <option value="missed">Previously missed</option>
              <option value="unseen">Unseen so far</option>
            </select>
          </div>

          {settings.filter === "category" && (
            <div>
              <label className="label mb-1 block">Domain</label>
              <select
                value={settings.category}
                onChange={(e) =>
                  setSettings({ ...settings, category: e.target.value })
                }
                className="input w-full"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CATEGORY_COUNTS[c]})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label mb-1 block">Order</label>
            <select
              value={settings.order}
              onChange={(e) =>
                setSettings({ ...settings, order: e.target.value as Order })
              }
              className="input w-full"
            >
              <option value="sequential">Sequential</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-ink-500 dark:text-ink-400 mt-3 inline-flex items-center gap-1">
          <Icon name="filter" size={12} />
          Pool size:{" "}
          <span className="font-semibold text-ink-700 dark:text-ink-200">
            {pool.length}
          </span>{" "}
          question{pool.length === 1 ? "" : "s"}
        </div>
      </div>

      {pool.length === 0 ? (
        <div className="card p-10 text-center text-ink-600 dark:text-ink-300">
          <Icon
            name="info"
            size={28}
            className="mx-auto mb-2 text-ink-400 dark:text-ink-500"
          />
          <p className="text-lg font-medium mb-1">
            No questions match this filter.
          </p>
          <p className="text-sm">
            Try a different filter, or come back after answering more questions.
          </p>
        </div>
      ) : currentQuestion ? (
        <>
          <QuestionCard
            question={currentQuestion}
            selected={selected}
            setSelected={setSelected}
            showAnswer={submitted}
            questionNumber={cursor + 1}
            totalQuestions={pool.length}
            enableHotkeys={!submitted}
          />

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={cursor === 0}
                className="btn-outline disabled:opacity-50"
              >
                <Icon name="chevron-left" size={14} /> Previous
              </button>
              <button
                onClick={handleRandomJump}
                className="btn-outline"
                title="Jump to a random question (R)"
              >
                <Icon name="shuffle" size={14} /> Random
              </button>
            </div>
            <div className="flex gap-2">
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected.length === 0}
                  className="btn-primary !px-5 disabled:opacity-50"
                >
                  Submit
                  <kbd className="kbd !bg-white/20 !text-white !border-white/30">
                    ⏎
                  </kbd>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary !px-5"
                >
                  Next
                  <Icon name="arrow-right" size={14} />
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
