import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  GLOSSARY,
  LESSONS,
  blocksToText,
  highlight,
  lessonReadingMinutes,
  searchNotes,
} from "../lib/notes";
import { loadVisitedLessons } from "../lib/storage";
import { Icon } from "../components/Icon";
import CheatSheet from "../components/CheatSheet";

// ── Exam tips data ────────────────────────────────────────────────────────────
const EXAM_TIPS = [
  {
    icon: "target" as const,
    color: "brand",
    title: "Know the passing score",
    body: "CompTIA Security+ requires a score of 750/900 (~83%). That means you can miss roughly 17% of questions — focus on domains where you're weakest, not perfection in every area.",
  },
  {
    icon: "shuffle" as const,
    color: "accent",
    title: "Practice with PBQs first",
    body: "Performance-based questions (PBQs) appear early in the exam. Tackle them first while your mind is fresh — don't let them eat up time at the end.",
  },
  {
    icon: "lightning" as const,
    color: "amber",
    title: "Eliminate distractors",
    body: "CompTIA always includes two obviously wrong answers. Eliminate those first, then reason between the remaining two. 'Most likely', 'best', and 'first' are key qualifier words.",
  },
  {
    icon: "shield" as const,
    color: "emerald",
    title: "Master the top domains",
    body: "Threats, Attacks & Vulnerabilities (24%) and Technologies & Tools (22%) make up nearly half the exam. Prioritise these domains in your study time.",
  },
  {
    icon: "timer" as const,
    color: "violet",
    title: "Pace yourself (90 min)",
    body: "You have 90 minutes for up to 90 questions — roughly 1 minute per question. Flag difficult ones and return later. Don't spend more than 2 minutes on any single question.",
  },
  {
    icon: "sparkles" as const,
    color: "rose",
    title: "Use acronyms as anchors",
    body: "CIA (Confidentiality, Integrity, Availability), AAA (Authentication, Authorization, Accounting), and IAAA frameworks appear constantly. Learn these cold — they unlock many questions.",
  },
  {
    icon: "book" as const,
    color: "teal",
    title: "Re-read lesson summaries",
    body: "Each lesson's summary block condenses the key testable concepts. A quick pass through all summaries the day before your exam is one of the highest-ROI study strategies.",
  },
  {
    icon: "practice" as const,
    color: "orange",
    title: "Aim for 85%+ in practice",
    body: "If you're consistently scoring 85% or above in practice mode here, you're exam-ready. Below 80% on any domain → revisit the notes and drill those questions again.",
  },
];

const COLOR_MAP: Record<string, string> = {
  brand: "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
  accent: "bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
};

export default function NotesPage() {
  const [query, setQuery] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);
  const results = useMemo(() => searchNotes(query, 30), [query]);

  // Progress tracking ─────────────────────────────────────────────────────────
  const visitedLessons = useMemo(() => loadVisitedLessons(), []);
  const totalLessons = LESSONS.length;
  const visitedCount = visitedLessons.size;
  const visitedPct = totalLessons > 0 ? (visitedCount / totalLessons) * 100 : 0;

  const totalTopics = useMemo(() => LESSONS.reduce((a, l) => a + l.topics.length, 0), []);
  const totalReadingMins = useMemo(
    () => LESSONS.reduce((a, l) => a + lessonReadingMinutes(l), 0),
    []
  );
  const visitedReadingMins = useMemo(
    () =>
      LESSONS.filter((l) => visitedLessons.has(l.id)).reduce(
        (a, l) => a + lessonReadingMinutes(l),
        0
      ),
    [visitedLessons]
  );

  const progressLabel =
    visitedCount === 0
      ? "Not started yet — open a lesson to begin!"
      : visitedCount === totalLessons
      ? "🎉 All lessons completed!"
      : visitedCount <= totalLessons * 0.33
      ? "Just getting started — keep going!"
      : visitedCount <= totalLessons * 0.66
      ? "Making great progress!"
      : "Almost there — finish strong!";

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 chip bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200 mb-2">
            <Icon name="book" size={14} /> Study guide
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            Study Notes
          </h1>
          <p className="mt-2 text-ink-600 dark:text-ink-300 max-w-2xl">
            Complete coverage from the Official CompTIA Security+ Student Guide,
            now reorganised with sub-headings, bulleted definitions and inline
            objectives. Browse by lesson, or search across every topic and the
            glossary.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center text-sm">
          <div className="card p-3">
            <div className="text-xl md:text-2xl font-display font-semibold text-ink-900 dark:text-ink-50">
              {LESSONS.length}
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">
              lessons
            </div>
          </div>
          <div className="card p-3">
            <div className="text-xl md:text-2xl font-display font-semibold text-ink-900 dark:text-ink-50">
              {totalTopics}
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">topics</div>
          </div>
          <div className="card p-3">
            <div className="text-xl md:text-2xl font-display font-semibold text-ink-900 dark:text-ink-50">
              {GLOSSARY.length}
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">terms</div>
          </div>
        </div>
      </header>

      {/* ── Study Progress ─────────────────────────────────────────────────── */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 chip bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 mb-1">
              <Icon name="progress" size={13} /> Study progress
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-300">
              {progressLabel}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold tabular-nums text-ink-900 dark:text-ink-50">
              {visitedCount}
              <span className="text-base text-ink-400 dark:text-ink-500">
                {" "}/ {totalLessons}
              </span>
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">
              lessons read
            </div>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="relative h-3 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-accent-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${visitedPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink-500 dark:text-ink-400 mb-4">
          <span>{Math.round(visitedPct)}% complete</span>
          <span>~{visitedReadingMins} / {totalReadingMins} min read</span>
        </div>

        {/* Per-lesson mini bars */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1">
          {LESSONS.map((l) => {
            const done = visitedLessons.has(l.id);
            return (
              <Link
                key={l.id}
                to={`/notes/${l.id}`}
                title={`Lesson ${l.id}: ${l.title}${done ? " ✓" : ""}`}
                className={`group relative h-7 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all ${
                  done
                    ? "bg-brand-500 text-white shadow-sm hover:bg-brand-600"
                    : "bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-300"
                }`}
              >
                {l.id}
              </Link>
            );
          })}
        </div>

        {visitedCount > 0 && (
          <div className="mt-3 flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" />
              Visited
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-ink-200 dark:bg-ink-700 inline-block" />
              Not yet read
            </span>
            <span className="ml-auto">
              {totalLessons - visitedCount} lesson{totalLessons - visitedCount !== 1 ? "s" : ""} remaining
            </span>
          </div>
        )}
      </section>

      {/* ── Cheat Sheet ────────────────────────────────────────────────── */}
      <CheatSheet />

      {/* ── Exam Tips ──────────────────────────────────────────────────────── */}
      <section className="card overflow-hidden">
        <button
          onClick={() => setTipsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
          aria-expanded={tipsOpen}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-sm">
              <Icon name="sparkles" size={15} className="text-white" />
            </div>
            <div>
              <div className="font-display font-semibold text-ink-900 dark:text-ink-50">
                How to ace the Security+ exam
              </div>
              <div className="text-xs text-ink-500 dark:text-ink-400">
                {EXAM_TIPS.length} proven strategies
              </div>
            </div>
          </div>
          <Icon
            name="chevron-down"
            size={18}
            className={`text-ink-400 transition-transform duration-200 ${tipsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {tipsOpen && (
          <div className="px-5 pb-5 pt-1">
            <div className="grid sm:grid-cols-2 gap-3">
              {EXAM_TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className="flex gap-3 rounded-xl border border-ink-100 dark:border-ink-800 p-4 bg-white/60 dark:bg-ink-900/40"
                >
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center ${COLOR_MAP[tip.color]}`}
                  >
                    <Icon name={tip.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-ink-900 dark:text-ink-50 mb-0.5">
                      {tip.title}
                    </div>
                    <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                      {tip.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-3 text-center">
              Combined from top-rated Security+ study communities and official CompTIA guidance.
            </p>
          </div>
        )}
      </section>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Icon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, topics, and glossary…"
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
        </div>
        {query && (
          <div className="mt-4">
            <div className="text-xs text-ink-500 dark:text-ink-400 mb-2">
              {results.length === 0
                ? "No matches found."
                : `Showing ${results.length} match${results.length === 1 ? "" : "es"}`}
            </div>
            <div className="space-y-2">
              {results.map((r, i) => {
                if (r.type === "glossary") {
                  return (
                    <Link
                      key={i}
                      to="/glossary"
                      className="block p-3 rounded-xl border border-ink-200 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-0.5">
                        <Icon name="glossary" size={12} /> Glossary
                      </div>
                      <div className="font-semibold text-ink-900 dark:text-ink-50">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlight(r.term, query),
                          }}
                        />
                      </div>
                      <div
                        className="text-sm text-ink-600 dark:text-ink-300 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: highlight(r.definition, query),
                        }}
                      />
                    </Link>
                  );
                }
                if (r.type === "intro") {
                  return (
                    <Link
                      key={i}
                      to={`/notes/${r.lessonId}`}
                      className="block p-3 rounded-xl border border-ink-200 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 mb-0.5">
                        <Icon name="book" size={12} /> Lesson {r.lessonId} ·{" "}
                        introduction
                      </div>
                      <div className="font-semibold text-ink-900 dark:text-ink-50">
                        {r.lessonTitle}
                      </div>
                      <div
                        className="text-sm text-ink-600 dark:text-ink-300 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: highlight(r.snippet, query),
                        }}
                      />
                    </Link>
                  );
                }
                return (
                  <Link
                    key={i}
                    to={`/notes/${r.lessonId}/${r.topicId}`}
                    className="block p-3 rounded-xl border border-ink-200 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-colors"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300 mb-0.5">
                      <Icon name="book" size={12} /> Lesson {r.lessonId} ·
                      Topic {r.topicId}
                    </div>
                    <div className="font-semibold text-ink-900 dark:text-ink-50">
                      {r.topicTitle}
                    </div>
                    <div
                      className="text-sm text-ink-600 dark:text-ink-300 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: highlight(r.snippet, query),
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lesson grid */}
      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
        {LESSONS.map((l) => {
          const introWords = blocksToText(l.introBlocks)
            .split(/\s+/)
            .filter(Boolean).length;
          const minutes = lessonReadingMinutes(l);
          const visited = visitedLessons.has(l.id);
          return (
            <Link
              key={l.id}
              to={`/notes/${l.id}`}
              className="card card-hover p-4 md:p-5 group block relative"
            >
              {visited && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 grid place-items-center shadow-sm">
                  <Icon name="check" size={11} className="text-white" strokeWidth={2.5} />
                </div>
              )}
              <div className="flex items-start gap-3 md:gap-4">
                <div
                  className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl grid place-items-center text-white font-display font-bold text-base md:text-lg shadow-sm ${
                    visited
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                      : "bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600"
                  }`}
                >
                  {l.id}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                    Lesson {l.id}
                  </div>
                  <h3 className="font-display text-base md:text-lg font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300 leading-snug">
                    {l.title}
                  </h3>
                  <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="list-bullet" size={12} />
                      {l.topics.length} topics
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="timer" size={12} />~{minutes} min read
                    </span>
                    {introWords > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="info" size={12} />
                        intro included
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(l.topics.length > 3 ? l.topics.slice(0, 3) : l.topics).map((t) => (
                      <span
                        key={t.id}
                        className="chip bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                      >
                        {t.id} · {t.title}
                      </span>
                    ))}
                    {l.topics.length > 3 && (
                      <span className="chip bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                        +{l.topics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <Icon
                  name="chevron-right"
                  size={18}
                  className="hidden sm:block text-ink-400 dark:text-ink-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition mt-2 shrink-0"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
