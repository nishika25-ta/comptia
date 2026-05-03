import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getCategories,
  getCategoryCounts,
  getPbqQuestions,
  getValidQuestions,
} from "../lib/questions";
import { getGlossary, getLessons } from "../lib/notes";
import { loadAttempts, loadExamHistory } from "../lib/storage";
import { useContentVersion } from "../lib/contentVersion";
import { Icon } from "../components/Icon";

const Stat = ({
  value,
  label,
  hint,
  accent,
  icon,
}: {
  value: string | number;
  label: string;
  hint?: string;
  accent: "brand" | "emerald" | "violet" | "amber";
  icon: Parameters<typeof Icon>[0]["name"];
}) => {
  const colors = {
    brand: "text-brand-600 bg-brand-100 dark:text-brand-200 dark:bg-brand-900/40",
    emerald: "text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40",
    violet: "text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/40",
    amber: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40",
  } as const;
  return (
    <div className="card p-5 card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-display font-semibold text-ink-900 dark:text-ink-50 tabular-nums">
            {value}
          </div>
          <div className="text-sm font-medium text-ink-700 dark:text-ink-200 mt-1">
            {label}
          </div>
          {hint && (
            <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">
              {hint}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${colors[accent]}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { version } = useContentVersion();
  const VALID_QUESTIONS = useMemo(() => getValidQuestions(version), [version]);
  const PBQ_QUESTIONS = useMemo(() => getPbqQuestions(version), [version]);
  const ALL_CATEGORIES = useMemo(() => getCategories(version), [version]);
  const CATEGORY_COUNTS = useMemo(
    () => getCategoryCounts(version),
    [version]
  );
  const LESSONS = useMemo(() => getLessons(version), [version]);
  const GLOSSARY = useMemo(() => getGlossary(version), [version]);

  const attempts = useMemo(() => loadAttempts(version), [version]);
  const history = useMemo(() => loadExamHistory(version), [version]);
  const totalTopics = LESSONS.reduce((a, l) => a + l.topics.length, 0);

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-ink-200 dark:border-ink-800 bg-gradient-to-br from-white via-brand-50/40 to-accent-50/30 dark:from-ink-900 dark:via-brand-950/40 dark:to-accent-950/30 px-4 py-7 sm:px-6 sm:py-10 md:px-12 md:py-14 shadow-card">
        <div
          className="absolute inset-0 -z-10 opacity-40 dark:opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(40rem 18rem at 110% -10%, rgba(124, 77, 255, 0.18), transparent 60%), radial-gradient(40rem 24rem at -10% 110%, rgba(19, 120, 245, 0.18), transparent 60%)",
          }}
        />
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 chip bg-brand-100/70 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 mb-3">
            <Icon name="shield" size={14} /> CompTIA Security+ · SY0-701 ·{" "}
            {version === "v1" ? "Version 1" : "Version 2"}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-ink-900 dark:text-ink-50 leading-tight">
            Master the Security+ exam,
            <br className="hidden md:block" />{" "}
            <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              one question at a time.
            </span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-600 dark:text-ink-300">
            Practice with{" "}
            <span className="font-semibold text-ink-900 dark:text-ink-50">
              {VALID_QUESTIONS.length} multiple-choice questions
            </span>{" "}
            across all SY0-701 domains, then deepen your knowledge with the{" "}
            <span className="font-semibold text-ink-900 dark:text-ink-50">
              {version === "v1"
                ? "complete Student Guide"
                : "supplemental study notes from your Version 2 PDF"}
            </span>{" "}
            and a{" "}
            <span className="font-semibold text-ink-900 dark:text-ink-50">
              {GLOSSARY.length}-term glossary
            </span>
            .
          </p>
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-3">
            <Link to="/practice" className="btn-primary w-full sm:w-auto !px-5 !py-3 text-base">
              <Icon name="play" size={16} />
              Start practising
            </Link>
            <Link to="/exam" className="btn-outline w-full sm:w-auto !px-5 !py-3 text-base">
              <Icon name="timer" size={16} />
              Take a timed exam
            </Link>
            <Link to="/notes" className="btn-outline w-full sm:w-auto !px-5 !py-3 text-base">
              <Icon name="book" size={16} />
              Browse the notes
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat
          value={VALID_QUESTIONS.length}
          label="Practice questions"
          hint={
            PBQ_QUESTIONS.length
              ? `${PBQ_QUESTIONS.length} PBQs not included in quizzes`
              : undefined
          }
          accent="brand"
          icon="practice"
        />
        <Stat
          value={LESSONS.length}
          label="Study lessons"
          hint={`${totalTopics} structured topics`}
          accent="violet"
          icon="book"
        />
        <Stat
          value={GLOSSARY.length}
          label="Glossary terms"
          hint="Quick lookups & search"
          accent="emerald"
          icon="glossary"
        />
        <Stat
          value={attempts.length}
          label="Your attempts"
          hint={
            history.length
              ? `${history.length} exam sessions completed`
              : "Start now!"
          }
          accent="amber"
          icon="progress"
        />
      </section>

      {/* Mode cards */}
      <section className="grid md:grid-cols-3 gap-3 md:gap-4">
        <Link
          to="/practice"
          className="card p-6 card-hover group block"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 grid place-items-center mb-4">
            <Icon name="practice" size={22} />
          </div>
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300">
            Practice Mode
          </h3>
          <p className="text-sm text-ink-600 dark:text-ink-300 mt-1.5 leading-6">
            Filter by domain, get instant feedback, see explanations after every
            question, and revisit only the ones you missed.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-300">
            Open practice <Icon name="arrow-right" size={14} />
          </div>
        </Link>

        <Link to="/exam" className="card p-6 card-hover group block">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 grid place-items-center mb-4">
            <Icon name="timer" size={22} />
          </div>
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300">
            Exam Mode
          </h3>
          <p className="text-sm text-ink-600 dark:text-ink-300 mt-1.5 leading-6">
            Timed mock exam with a 90-question default, navigation between
            questions, flag-for-review, and a per-domain score breakdown.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-300">
            Configure exam <Icon name="arrow-right" size={14} />
          </div>
        </Link>

        <Link to="/notes" className="card p-6 card-hover group block">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 grid place-items-center mb-4">
            <Icon name="book" size={22} />
          </div>
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300">
            Study Notes
          </h3>
          <p className="text-sm text-ink-600 dark:text-ink-300 mt-1.5 leading-6">
            {version === "v1"
              ? "All 16 lessons of the Official Student Guide — now with sub-headings, bulleted lists, and inline objectives for easy skimming."
              : "Question explanations and topics from your Version 2 material, organised like Version 1 for the same study workflow."}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-300">
            Open notes <Icon name="arrow-right" size={14} />
          </div>
        </Link>
      </section>

      {/* Domain breakdown */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-ink-50 tracking-tight">
            Question pool by domain
          </h2>
          <span className="text-sm text-ink-500 dark:text-ink-400">
            {VALID_QUESTIONS.length} total
          </span>
        </div>
        <div className="card overflow-hidden hidden md:block rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 dark:bg-ink-900/60 text-ink-500 dark:text-ink-400">
              <tr>
                <th className="text-left px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Domain
                </th>
                <th className="text-right px-4 py-3.5 font-semibold text-xs uppercase tracking-wider w-32">
                  Questions
                </th>
                <th className="px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="text-ink-800 dark:text-ink-100">
              {ALL_CATEGORIES.map((c) => {
                const n = CATEGORY_COUNTS[c] || 0;
                const share = (n / VALID_QUESTIONS.length) * 100;
                return (
                  <tr
                    key={c}
                    className="border-t border-ink-100 dark:border-ink-800 first:border-t-0"
                  >
                    <td className="px-4 py-3.5 font-medium leading-snug">
                      {c}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-ink-700 dark:text-ink-200 font-medium">
                      {n}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="h-2.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 min-w-[2px]"
                          style={{ width: `${Math.max(share, n > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-2">
          {ALL_CATEGORIES.map((c) => {
            const n = CATEGORY_COUNTS[c] || 0;
            const share = (n / VALID_QUESTIONS.length) * 100;
            return (
              <div key={c} className="card p-3.5 rounded-2xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-ink-800 dark:text-ink-100 leading-snug">
                    {c}
                  </div>
                  <div className="text-sm tabular-nums text-ink-600 dark:text-ink-300 font-medium">
                    {n}
                  </div>
                </div>
                <div className="h-2.5 bg-ink-100 dark:bg-ink-800 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 min-w-[2px]"
                    style={{ width: `${Math.max(share, n > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
