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
import { Icon } from "../components/Icon";

export default function NotesPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchNotes(query, 30), [query]);

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
              {LESSONS.reduce((a, l) => a + l.topics.length, 0)}
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
          return (
            <Link
              key={l.id}
              to={`/notes/${l.id}`}
              className="card card-hover p-4 md:p-5 group block"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 grid place-items-center text-white font-display font-bold text-base md:text-lg shadow-sm">
                  {l.id}
                </div>
                <div className="flex-1 min-w-0">
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
                  className="hidden sm:block text-ink-400 dark:text-ink-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition mt-2"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
