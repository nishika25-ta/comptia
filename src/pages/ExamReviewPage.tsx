import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCategories,
  getQuestionById,
  isAnswerCorrect,
} from "../lib/questions";
import { clearExamSession, loadExamSession } from "../lib/storage";
import { useContentVersion } from "../lib/contentVersion";
import QuestionCard from "../components/QuestionCard";
import type { Question } from "../types";
import { Icon } from "../components/Icon";

type Filter = "all" | "wrong" | "flagged" | "unanswered" | "correct";

export default function ExamReviewPage() {
  const navigate = useNavigate();
  const { version } = useContentVersion();
  const session = loadExamSession(version);
  const ALL_CATEGORIES = useMemo(() => getCategories(version), [version]);
  const [filter, setFilter] = useState<Filter>("all");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!session || !session.finishedAt) navigate("/exam");
  }, [session, navigate]);

  const data = useMemo(() => {
    if (!session) return [];
    return session.questionIds
      .map((id) => {
        const q = getQuestionById(version, id);
        if (!q || q.error) return null;
        const sel = session.answers[id] || [];
        const correct = isAnswerCorrect(q as Question, sel);
        return {
          q: q as Question,
          selected: sel,
          correct,
          flagged: session.flagged.includes(id),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [session, version]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      switch (filter) {
        case "wrong":
          return !d.correct && d.selected.length > 0;
        case "correct":
          return d.correct;
        case "flagged":
          return d.flagged;
        case "unanswered":
          return d.selected.length === 0;
        default:
          return true;
      }
    });
  }, [data, filter]);

  useEffect(() => {
    setCursor(0);
  }, [filter]);

  const totalCorrect = data.filter((d) => d.correct).length;
  const totalAnswered = data.filter((d) => d.selected.length > 0).length;
  const score = data.length ? totalCorrect / data.length : 0;
  const elapsedMs =
    session?.finishedAt && session?.startedAt
      ? session.finishedAt - session.startedAt
      : 0;

  const categoryStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    for (const c of ALL_CATEGORIES) stats[c] = { correct: 0, total: 0 };
    for (const d of data) {
      if (!stats[d.q.category])
        stats[d.q.category] = { correct: 0, total: 0 };
      stats[d.q.category].total += 1;
      if (d.correct) stats[d.q.category].correct += 1;
    }
    return stats;
  }, [data, ALL_CATEGORIES]);

  if (!session || !session.finishedAt) return null;

  const passingThreshold = 0.83; // CompTIA Security+ scaled passing 750/900
  const passed = score >= passingThreshold;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score hero */}
      <div className="card p-6 md:p-8 overflow-hidden relative">
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            passed ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="label mb-1">Exam result</div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-6xl font-semibold text-ink-900 dark:text-ink-50 tabular-nums leading-none">
                {Math.round(score * 100)}
                <span className="text-3xl text-ink-400 dark:text-ink-500">%</span>
              </span>
              <span
                className={`text-sm font-bold inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${
                  passed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                }`}
              >
                <Icon
                  name={passed ? "check" : "x"}
                  size={14}
                  strokeWidth={2.4}
                />
                {passed ? "Passed (≥83%)" : "Below 83% threshold"}
              </span>
            </div>
            <div className="text-sm text-ink-600 dark:text-ink-300 mt-2 inline-flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <span className="font-semibold text-ink-900 dark:text-ink-50">
                  {totalCorrect}
                </span>
                /{data.length} correct
              </span>
              <span>
                <span className="font-semibold text-ink-900 dark:text-ink-50">
                  {totalAnswered}
                </span>{" "}
                answered
              </span>
              {elapsedMs > 0 && (
                <span>
                  Time:{" "}
                  <span className="font-mono">
                    {Math.floor(elapsedMs / 60000)}m{" "}
                    {Math.floor((elapsedMs % 60000) / 1000)}s
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Link
              to="/exam"
              className="btn-primary"
              onClick={() => clearExamSession(version)}
            >
              <Icon name="play" size={14} /> Take another exam
            </Link>
            <button
              onClick={() => window.print()}
              className="btn-outline text-sm"
            >
              Print result
            </button>
          </div>
        </div>
      </div>

      {/* Per-domain breakdown */}
      <div className="card p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 mb-3">
          Breakdown by domain
        </h2>
        <div className="space-y-3">
          {Object.entries(categoryStats)
            .filter(([, v]) => v.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([cat, v]) => {
              const pct = v.total ? (v.correct / v.total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-ink-800 dark:text-ink-100">
                      {cat}
                    </span>
                    <span className="text-ink-600 dark:text-ink-300 tabular-nums">
                      {v.correct}/{v.total}{" "}
                      <span className="font-mono">
                        ({Math.round(pct)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pct >= 75
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-600 dark:text-ink-300 inline-flex items-center gap-1">
            <Icon name="filter" size={14} /> Review
          </span>
          {(
            [
              ["all", `All (${data.length})`],
              [
                "wrong",
                `Incorrect (${data.filter((d) => !d.correct && d.selected.length > 0).length})`,
              ],
              ["correct", `Correct (${totalCorrect})`],
              [
                "unanswered",
                `Unanswered (${data.filter((d) => d.selected.length === 0).length})`,
              ],
              [
                "flagged",
                `Flagged (${data.filter((d) => d.flagged).length})`,
              ],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === f
                  ? "bg-brand-600 border-brand-600 text-white dark:bg-brand-500 dark:border-brand-500"
                  : "bg-white dark:bg-ink-900 border-ink-300 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-600 dark:text-ink-300">
          <Icon
            name="info"
            size={28}
            className="mx-auto mb-2 text-ink-400 dark:text-ink-500"
          />
          No questions match this filter.
        </div>
      ) : (
        <>
          <QuestionCard
            question={filtered[cursor].q}
            selected={filtered[cursor].selected}
            setSelected={() => undefined}
            showAnswer
            disabled
            questionNumber={cursor + 1}
            totalQuestions={filtered.length}
            flagged={filtered[cursor].flagged}
          />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setCursor((c) => Math.max(0, c - 1))}
              disabled={cursor === 0}
              className="btn-outline disabled:opacity-50"
            >
              <Icon name="chevron-left" size={14} /> Previous
            </button>
            <div className="text-sm text-ink-500 dark:text-ink-400 tabular-nums">
              {cursor + 1} of {filtered.length}
            </div>
            <button
              onClick={() =>
                setCursor((c) => Math.min(filtered.length - 1, c + 1))
              }
              disabled={cursor >= filtered.length - 1}
              className="btn-outline disabled:opacity-50"
            >
              Next <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
