import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ALL_CATEGORIES,
  CATEGORY_COUNTS,
  VALID_QUESTIONS,
  pickRandom,
} from "../lib/questions";
import {
  clearExamSession,
  loadExamHistory,
  loadExamSession,
  saveExamSession,
} from "../lib/storage";
import type { ExamSession } from "../types";
import { Icon } from "../components/Icon";

const PRESETS = [
  { label: "Quick check", desc: "15 questions · 18 min", count: 15, minutes: 18 },
  { label: "Half exam", desc: "45 questions · 50 min", count: 45, minutes: 50 },
  { label: "Full mock", desc: "90 questions · 90 min", count: 90, minutes: 90 },
  { label: "Marathon", desc: "150 questions · 150 min", count: 150, minutes: 150 },
];

export default function ExamSetupPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState(90);
  const [minutes, setMinutes] = useState(90);
  const [domains, setDomains] = useState<string[]>([]);
  const inProgress = loadExamSession();
  const history = loadExamHistory();

  function startExam() {
    const pool = domains.length
      ? VALID_QUESTIONS.filter((q) => domains.includes(q.category))
      : VALID_QUESTIONS;
    const n = Math.min(count, pool.length);
    const chosen = pickRandom(pool, n);
    const session: ExamSession = {
      startedAt: Date.now(),
      durationMs: minutes * 60 * 1000,
      questionIds: chosen.map((q) => q.id),
      answers: {},
      flagged: [],
    };
    saveExamSession(session);
    navigate("/exam/run");
  }

  function resumeExam() {
    navigate("/exam/run");
  }

  function discardExam() {
    if (
      confirm(
        "Discard the in-progress exam? Your answers so far will be deleted."
      )
    ) {
      clearExamSession();
      navigate("/exam");
      window.location.reload();
    }
  }

  function toggleDomain(d: string) {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function applyPreset(c: number, m: number) {
    setCount(c);
    setMinutes(m);
  }

  const poolForDomains = domains.length
    ? VALID_QUESTIONS.filter((q) => domains.includes(q.category)).length
    : VALID_QUESTIONS.length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 chip bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200 mb-2">
          <Icon name="timer" size={14} /> Exam mode
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
          Take a timed mock exam
        </h1>
        <p className="text-sm text-ink-600 dark:text-ink-300 mt-2">
          Pick a length, set a timer, and answer like the real thing. Flag any
          question for review and get a per-domain score breakdown at the end.
        </p>
      </div>

      {inProgress && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-amber-900 dark:text-amber-100 inline-flex items-center gap-2">
                <Icon name="warning" size={16} /> Exam in progress
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Started {new Date(inProgress.startedAt).toLocaleString()} ·{" "}
                {inProgress.questionIds.length} questions ·{" "}
                {Object.keys(inProgress.answers).length} answered
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resumeExam}
                className="btn bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                <Icon name="play" size={14} /> Resume
              </button>
              <button
                onClick={discardExam}
                className="btn bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 dark:bg-ink-900 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/30"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 mb-3">
          Presets
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.count, p.minutes)}
              className={`text-left p-4 rounded-xl border transition-all ${
                count === p.count && minutes === p.minutes
                  ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100 shadow-sm"
                  : "border-ink-200 dark:border-ink-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-ink-50 dark:hover:bg-ink-800/60"
              }`}
            >
              <div className="font-semibold text-ink-900 dark:text-ink-50">
                {p.label}
              </div>
              <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                {p.desc}
              </div>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label mb-1 block">Number of questions</label>
            <input
              type="number"
              min={1}
              max={VALID_QUESTIONS.length}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.min(
                    VALID_QUESTIONS.length,
                    Math.max(1, parseInt(e.target.value || "1", 10))
                  )
                )
              }
              className="input w-full"
            />
            <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
              Pool available: {poolForDomains}
            </div>
          </div>
          <div>
            <label className="label mb-1 block">Time limit (minutes)</label>
            <input
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) =>
                setMinutes(Math.max(1, parseInt(e.target.value || "1", 10)))
              }
              className="input w-full"
            />
            <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
              ~{(minutes / Math.max(1, count)).toFixed(1)} min per question
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="label">Domains (leave empty for all)</h3>
            {domains.length > 0 && (
              <button
                onClick={() => setDomains([])}
                className="text-xs text-brand-600 dark:text-brand-300 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_CATEGORIES.map((c) => {
              const active = domains.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleDomain(c)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? "bg-brand-600 border-brand-600 text-white dark:bg-brand-500 dark:border-brand-500"
                      : "bg-white dark:bg-ink-900 border-ink-300 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-700"
                  }`}
                >
                  {c} ({CATEGORY_COUNTS[c]})
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={startExam}
            disabled={poolForDomains === 0}
            className="btn-primary !px-6 !py-3 disabled:opacity-50"
          >
            Start exam <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 mb-3">
            Recent attempts
          </h2>
          <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-ink-800">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-900/60 text-ink-500 dark:text-ink-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Date</th>
                  <th className="text-right py-2 px-3 font-semibold">
                    Questions
                  </th>
                  <th className="text-right py-2 px-3 font-semibold">Score</th>
                  <th className="text-right py-2 px-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((h, i) => {
                  const score = h.score ?? 0;
                  const passed = score >= 0.83;
                  return (
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
                              passed
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
