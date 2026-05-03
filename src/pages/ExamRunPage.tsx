import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestionById, isAnswerCorrect } from "../lib/questions";
import {
  loadExamSession,
  pushExamHistory,
  saveExamSession,
} from "../lib/storage";
import { useContentVersion } from "../lib/contentVersion";
import QuestionCard from "../components/QuestionCard";
import type { ExamSession, Question } from "../types";
import { Icon } from "../components/Icon";

export default function ExamRunPage() {
  const navigate = useNavigate();
  const { version } = useContentVersion();
  const [session, setSession] = useState<ExamSession | null>(() =>
    loadExamSession(version)
  );
  const [now, setNow] = useState(Date.now());
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setSession(loadExamSession(version));
  }, [version]);

  useEffect(() => {
    if (!session) navigate("/exam");
  }, [session, navigate]);

  useEffect(() => {
    if (!session) return;
    const remaining = session.startedAt + session.durationMs - now;
    if (remaining <= 0) finishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, session]);

  const questions: Question[] = useMemo(() => {
    if (!session) return [];
    return session.questionIds
      .map((id) => getQuestionById(version, id))
      .filter((q): q is Question => Boolean(q && !q.error));
  }, [session, version]);

  const current = questions[cursor];
  const remainingMs = session
    ? Math.max(0, session.startedAt + session.durationMs - now)
    : 0;
  const elapsedMs = session
    ? Math.min(now - session.startedAt, session.durationMs)
    : 0;

  function setSelected(letters: string[]) {
    if (!session || !current) return;
    const next: ExamSession = {
      ...session,
      answers: { ...session.answers, [current.id]: letters },
    };
    setSession(next);
    saveExamSession(version, next);
  }

  function toggleFlag() {
    if (!session || !current) return;
    const set = new Set(session.flagged);
    if (set.has(current.id)) set.delete(current.id);
    else set.add(current.id);
    const next = { ...session, flagged: Array.from(set) };
    setSession(next);
    saveExamSession(version, next);
  }

  function finishExam() {
    if (!session) return;
    let correct = 0;
    for (const id of session.questionIds) {
      const q = getQuestionById(version, id);
      if (!q) continue;
      const ans = session.answers[id] || [];
      if (isAnswerCorrect(q, ans)) correct++;
    }
    const finished: ExamSession = {
      ...session,
      finishedAt: Date.now(),
      correctCount: correct,
      score:
        session.questionIds.length > 0
          ? correct / session.questionIds.length
          : 0,
    };
    pushExamHistory(version, finished);
    saveExamSession(version, finished);
    navigate("/exam/review");
  }

  // Hotkeys for navigation/submit
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") setCursor((c) => Math.max(0, c - 1));
      else if (e.key === "ArrowRight" || e.key === "Enter")
        setCursor((c) => Math.min(questions.length - 1, c + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions.length]);

  if (!session || !current) return null;

  const totalQ = questions.length;
  const answeredCount = Object.keys(session.answers).filter((k) => {
    const v = session.answers[+k];
    return Array.isArray(v) && v.length > 0;
  }).length;
  const flaggedCount = session.flagged.length;
  const remainingMins = Math.floor(remainingMs / 60000);
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000);
  const lowTime = remainingMs < 5 * 60 * 1000;
  const veryLowTime = remainingMs < 60 * 1000;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Sticky control bar */}
      <div className="card p-4 sticky top-[68px] z-20 bg-white/90 dark:bg-ink-950/85 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-2 rounded-xl font-mono font-bold tabular-nums inline-flex items-center gap-2 transition-colors ${
                veryLowTime
                  ? "bg-rose-600 text-white animate-pulse"
                  : lowTime
                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700/60"
                    : "bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100"
              }`}
            >
              <Icon name="timer" size={16} />
              {String(remainingMins).padStart(2, "0")}:
              {String(remainingSecs).padStart(2, "0")}
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">
              Elapsed:{" "}
              <span className="font-mono">
                {Math.floor(elapsedMs / 60000)}m{" "}
                {Math.floor((elapsedMs % 60000) / 1000)}s
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>
              <span className="font-bold tabular-nums text-ink-900 dark:text-ink-50">
                {answeredCount}
              </span>
              <span className="text-ink-500 dark:text-ink-400">
                {" "}/ {totalQ} answered
              </span>
            </span>
            {flaggedCount > 0 && (
              <span className="text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                <Icon name="flag" size={12} />
                <span className="font-bold tabular-nums">{flaggedCount}</span>{" "}
                flagged
              </span>
            )}
            <button
              onClick={() => {
                if (
                  confirm(
                    `Submit exam now? You have answered ${answeredCount} of ${totalQ} questions.`
                  )
                ) {
                  finishExam();
                }
              }}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white !py-1.5 !px-4 text-sm font-semibold shadow-sm"
            >
              <Icon name="check" size={14} /> Submit exam
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
            style={{ width: `${(answeredCount / totalQ) * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={current}
        selected={session.answers[current.id] || []}
        setSelected={setSelected}
        questionNumber={cursor + 1}
        totalQuestions={totalQ}
        flagged={session.flagged.includes(current.id)}
        onToggleFlag={toggleFlag}
        enableHotkeys
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setCursor((c) => Math.max(0, c - 1))}
          disabled={cursor === 0}
          className="btn-outline disabled:opacity-50"
        >
          <Icon name="chevron-left" size={14} /> Previous
        </button>
        <div className="flex gap-2">
          {cursor < totalQ - 1 ? (
            <button
              onClick={() => setCursor((c) => Math.min(totalQ - 1, c + 1))}
              className="btn-primary !px-5"
            >
              Next <Icon name="arrow-right" size={14} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Submit exam now? You have answered ${answeredCount} of ${totalQ} questions.`
                  )
                ) {
                  finishExam();
                }
              }}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white !px-5 font-semibold"
            >
              <Icon name="check" size={14} /> Submit exam
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="label">Question navigator</div>
          <div className="text-xs text-ink-500 dark:text-ink-400 inline-flex gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
              answered
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-ink-200 dark:bg-ink-700" />
              unanswered
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              flagged
            </span>
          </div>
        </div>
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5">
          {questions.map((q, i) => {
            const ans = session.answers[q.id];
            const answered = Array.isArray(ans) && ans.length > 0;
            const isFlagged = session.flagged.includes(q.id);
            const isCurrent = i === cursor;
            return (
              <button
                key={q.id}
                onClick={() => setCursor(i)}
                className={`relative aspect-square text-xs font-semibold rounded-md transition-all ${
                  isCurrent
                    ? "bg-brand-600 text-white ring-2 ring-brand-300 dark:ring-brand-500 ring-offset-1 dark:ring-offset-ink-900"
                    : answered
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
                      : "bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                }`}
                title={`Q${i + 1}${answered ? " (answered)" : ""}${
                  isFlagged ? " · flagged" : ""
                }`}
              >
                {i + 1}
                {isFlagged && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white dark:border-ink-900"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
