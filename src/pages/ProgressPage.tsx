import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCategories,
  getCategoryCounts,
  getQuestionById,
  getValidQuestions,
} from "../lib/questions";
import {
  aggregateStats,
  clearAttempts,
  clearExamHistory,
  loadAttempts,
  loadExamHistory,
} from "../lib/storage";
import { useContentVersion } from "../lib/contentVersion";
import QuestionCard from "../components/QuestionCard";
import SyncModal from "../components/SyncModal";
import type { Question } from "../types";
import { Icon } from "../components/Icon";

export default function ProgressPage() {
  const { version } = useContentVersion();
  const VALID_QUESTIONS = useMemo(() => getValidQuestions(version), [version]);
  const ALL_CATEGORIES = useMemo(() => getCategories(version), [version]);
  const CATEGORY_COUNTS = useMemo(
    () => getCategoryCounts(version),
    [version]
  );

  const [tick, setTick] = useState(0);
  const [showSync, setShowSync] = useState(false);
  const attempts = useMemo(() => loadAttempts(version), [tick, version]);
  const history = useMemo(() => loadExamHistory(version), [tick, version]);
  const { perQuestion } = useMemo(() => aggregateStats(attempts), [attempts]);
  const [reviewIdx, setReviewIdx] = useState(0);

  const totalAnswered = Object.keys(perQuestion).length;
  const totalCorrect = Object.values(perQuestion).filter((v) => v.lastCorrect)
    .length;
  const accuracy =
    attempts.length > 0
      ? attempts.filter((a) => a.correct).length / attempts.length
      : 0;

  const wrongQs: Question[] = useMemo(() => {
    return VALID_QUESTIONS.filter(
      (q) => perQuestion[q.id] && !perQuestion[q.id].lastCorrect
    );
  }, [perQuestion, VALID_QUESTIONS]);

  const categoryStats = useMemo(() => {
    const stats: Record<
      string,
      { seen: number; correct: number; total: number }
    > = {};
    for (const c of ALL_CATEGORIES) {
      stats[c] = { seen: 0, correct: 0, total: CATEGORY_COUNTS[c] || 0 };
    }
    for (const id in perQuestion) {
      const q = getQuestionById(version, parseInt(id, 10));
      if (!q) continue;
      if (!stats[q.category])
        stats[q.category] = { seen: 0, correct: 0, total: 0 };
      stats[q.category].seen += 1;
      if (perQuestion[parseInt(id, 10)].lastCorrect)
        stats[q.category].correct += 1;
    }
    return stats;
  }, [perQuestion, version, ALL_CATEGORIES]);

  function refresh() {
    setTick((t) => t + 1);
    setReviewIdx(0);
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 chip bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 mb-2">
            <Icon name="progress" size={14} /> Progress ·{" "}
            {version === "v1" ? "Version 1" : "Version 2"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            Your study dashboard
          </h1>
          <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
            Tracked locally for the selected material version. Includes Practice
            and Exam attempts for this version only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSync(true)}
            className="btn-outline text-sm inline-flex items-center gap-1.5"
          >
            <Icon name="sync" size={14} /> Sync devices
          </button>
          <button
            onClick={() => {
              if (
                confirm("Clear all practice attempts? This cannot be undone.")
              ) {
                clearAttempts(version);
                refresh();
              }
            }}
            className="btn-outline text-sm hover:!border-rose-300 hover:!text-rose-600 dark:hover:!border-rose-600 dark:hover:!text-rose-300"
          >
            Reset attempts
          </button>
          <button
            onClick={() => {
              if (confirm("Clear all exam history? This cannot be undone.")) {
                clearExamHistory(version);
                refresh();
              }
            }}
            className="btn-outline text-sm hover:!border-rose-300 hover:!text-rose-600 dark:hover:!border-rose-600 dark:hover:!text-rose-300"
          >
            Clear exam history
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-display font-semibold tabular-nums text-ink-900 dark:text-ink-50">
            {totalAnswered}
            <span className="text-base text-ink-400 dark:text-ink-500">
              {" "}
              / {VALID_QUESTIONS.length}
            </span>
          </div>
          <div className="text-sm font-medium text-ink-700 dark:text-ink-200 mt-1">
            Questions seen
          </div>
          <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
              style={{
                width: `${(totalAnswered / VALID_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-display font-semibold tabular-nums text-ink-900 dark:text-ink-50">
            {totalCorrect}
            <span className="text-base text-ink-400 dark:text-ink-500">
              {" "}
              / {totalAnswered}
            </span>
          </div>
          <div className="text-sm font-medium text-ink-700 dark:text-ink-200 mt-1">
            Last attempt correct
          </div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-display font-semibold tabular-nums text-ink-900 dark:text-ink-50">
            {Math.round(accuracy * 100)}%
          </div>
          <div className="text-sm font-medium text-ink-700 dark:text-ink-200 mt-1">
            All-time accuracy
          </div>
          <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            {attempts.length} total attempts
          </div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-display font-semibold tabular-nums text-ink-900 dark:text-ink-50">
            {history.length}
          </div>
          <div className="text-sm font-medium text-ink-700 dark:text-ink-200 mt-1">
            Exam sessions
          </div>
          <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            {history.length > 0 && history[0].score !== undefined
              ? `Latest: ${Math.round(history[0].score * 100)}%`
              : "—"}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 mb-3">
          Mastery by domain
        </h2>
        <div className="space-y-3">
          {Object.entries(categoryStats)
            .filter(([, v]) => v.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([cat, v]) => {
              const seenPct = v.total ? (v.seen / v.total) * 100 : 0;
              const accPct = v.seen ? (v.correct / v.seen) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex flex-wrap justify-between text-sm gap-2">
                    <span className="font-medium text-ink-800 dark:text-ink-100">
                      {cat}
                    </span>
                    <span className="text-ink-600 dark:text-ink-300 text-xs tabular-nums">
                      Seen {v.seen}/{v.total} ·{" "}
                      <span className="font-mono">
                        {Math.round(accPct)}% accuracy
                      </span>
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-ink-300 dark:bg-ink-700"
                      style={{ width: `${seenPct}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 left-0 transition-all ${
                        accPct >= 75
                          ? "bg-emerald-500"
                          : accPct >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{
                        width: `${(seenPct * accPct) / 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <div className="text-xs text-ink-500 dark:text-ink-400 mt-3">
          Light bar = % seen. Coloured bar = % correct relative to category total.
        </div>
      </section>

      {history.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 mb-3">
            Exam history
          </h2>
          <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-900/60 text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400">
                <tr>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-right py-2 px-3">Questions</th>
                  <th className="text-right py-2 px-3">Score</th>
                  <th className="text-right py-2 px-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={i}
                    className="border-t border-ink-100 dark:border-ink-800"
                  >
                    <td className="py-2 px-3 text-ink-700 dark:text-ink-200">
                      {new Date(h.startedAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-ink-700 dark:text-ink-200">
                      {h.questionIds.length}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold">
                      {h.score !== undefined ? (
                        <span
                          className={
                            h.score >= 0.83
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-rose-600 dark:text-rose-300"
                          }
                        >
                          {Math.round(h.score * 100)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-ink-500 dark:text-ink-400">
                      {h.finishedAt
                        ? formatDuration(h.finishedAt - h.startedAt)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {wrongQs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">
              Review previously missed ({wrongQs.length})
            </h2>
            <Link
              to="/practice"
              className="text-sm text-brand-600 dark:text-brand-300 hover:underline inline-flex items-center gap-1"
            >
              Practice missed questions <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <QuestionCard
            question={wrongQs[reviewIdx]}
            selected={[]}
            setSelected={() => undefined}
            showAnswer
            disabled
            questionNumber={reviewIdx + 1}
            totalQuestions={wrongQs.length}
          />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setReviewIdx((i) => Math.max(0, i - 1))}
              disabled={reviewIdx === 0}
              className="btn-outline disabled:opacity-50"
            >
              <Icon name="chevron-left" size={14} /> Previous
            </button>
            <span className="text-sm text-ink-500 dark:text-ink-400 tabular-nums">
              {reviewIdx + 1} of {wrongQs.length}
            </span>
            <button
              onClick={() =>
                setReviewIdx((i) => Math.min(wrongQs.length - 1, i + 1))
              }
              disabled={reviewIdx >= wrongQs.length - 1}
              className="btn-outline disabled:opacity-50"
            >
              Next <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </section>
      )}
    </div>
    {showSync && (
      <SyncModal
        onClose={() => setShowSync(false)}
        onDone={() => {
          setShowSync(false);
          refresh();
        }}
      />
    )}
    </>
  );
}

function formatDuration(ms: number) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
