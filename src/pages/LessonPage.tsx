import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  blocksToText,
  getLesson,
  getLessons,
  lessonReadingMinutes,
} from "../lib/notes";
import { markLessonVisited } from "../lib/storage";
import { useContentVersion } from "../lib/contentVersion";
import { BlockRenderer, extractHeadings } from "../components/BlockRenderer";
import V2StudyTopic from "../components/V2StudyTopic";
import { Icon } from "../components/Icon";

export default function LessonPage() {
  const { version } = useContentVersion();
  const { lessonId, topicId } = useParams<{
    lessonId: string;
    topicId?: string;
  }>();
  const LESSONS = useMemo(() => getLessons(version), [version]);
  const lesson = useMemo(
    () => getLesson(version, lessonId || ""),
    [version, lessonId]
  );
  const targetRef = useRef<HTMLElement | null>(null);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (topicId && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [topicId, lessonId]);

  // Mark lesson visited for progress tracking.
  useEffect(() => {
    if (lesson) markLessonVisited(version, lesson.id);
  }, [lesson, version]);

  // Reading-progress bar.
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const pct = total <= 0 ? 100 : Math.min(100, Math.max(0, (scrolled / total) * 100));
      setProgress(pct);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [lessonId]);

  if (!lesson) {
    return (
      <div className="card p-8 max-w-xl">
        <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">
          Lesson not found
        </h1>
        <Link
          to="/notes"
          className="link inline-flex items-center gap-1 mt-2"
        >
          <Icon name="chevron-left" size={14} /> Back to all lessons
        </Link>
      </div>
    );
  }

  const prev = LESSONS.find((l) => l.id === lesson.id - 1);
  const next = LESSONS.find((l) => l.id === lesson.id + 1);

  const introWords = blocksToText(lesson.introBlocks).split(/\s+/).filter(Boolean).length;
  const minutes = lessonReadingMinutes(lesson);

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8 animate-fade-in">
      {/* Reading progress bar */}
      <div className="fixed top-[57px] left-0 right-0 h-0.5 bg-transparent z-20 no-print">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sidebar TOC */}
      <aside className="lg:sticky lg:top-[80px] self-start space-y-3">
        <Link
          to="/notes"
          className="text-sm text-brand-600 dark:text-brand-300 hover:underline inline-flex items-center gap-1"
        >
          <Icon name="chevron-left" size={14} /> All lessons
        </Link>

        <div className="card p-4">
          <div className="label mb-2">All lessons</div>
          <nav className="space-y-0.5 text-sm max-h-72 lg:max-h-[28rem] overflow-y-auto pr-1">
            {LESSONS.map((l) => (
              <Link
                key={l.id}
                to={`/notes/${l.id}`}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  l.id === lesson.id
                    ? "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100 font-semibold"
                    : "text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                }`}
              >
                <span className="font-mono text-[11px] tabular-nums opacity-70 w-5 text-right">
                  {l.id}.
                </span>
                <span className="truncate">{l.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="card p-4">
          <div className="label mb-2">On this page</div>
          <nav className="space-y-0.5 text-sm">
            {lesson.introBlocks.length > 0 && (
              <a
                href="#intro"
                className="block px-2 py-1.5 rounded-md text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                Introduction
              </a>
            )}
            {lesson.topics.map((t) => {
              const subs = extractHeadings(t.blocks, t.id).slice(0, 6);
              return (
                <div key={t.id} className="">
                  <a
                    href={`#topic-${t.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                      topicId === t.id
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100 font-semibold"
                        : "text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                    }`}
                  >
                    <span className="font-mono text-[11px] tabular-nums opacity-70 w-7 text-right">
                      {t.id}
                    </span>
                    <span className="truncate">{t.title}</span>
                  </a>
                  {subs.length > 0 && (
                    <div className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l border-ink-200 dark:border-ink-800 pl-2">
                      {subs.map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className="block px-2 py-0.5 rounded text-[12px] text-ink-500 hover:text-ink-800 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-ink-100 dark:hover:bg-ink-800 truncate"
                        >
                          {h.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {lesson.summaryBlocks.length > 0 && (
              <a
                href="#summary"
                className="block px-2 py-1.5 rounded-md text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                Summary
              </a>
            )}
          </nav>
        </div>
      </aside>

      <article ref={articleRef} className="space-y-8 max-w-3xl">
        <header>
          <div className="inline-flex items-center gap-2 chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 mb-3">
            <Icon name="book" size={14} />{" "}
            {version === "v2" ? (
              <>
                Study pack · Lesson {lesson.id}
              </>
            ) : (
              <>Lesson {lesson.id}</>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50 leading-tight">
            {lesson.title}
          </h1>
          <div className="mt-3 inline-flex items-center gap-4 text-sm text-ink-500 dark:text-ink-400">
            <span className="inline-flex items-center gap-1">
              <Icon name="list-bullet" size={14} /> {lesson.topics.length} topics
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="timer" size={14} />~{minutes} min read
            </span>
          </div>
        </header>

        {lesson.introBlocks.length > 0 && (
          <section
            id="intro"
            className={
              version === "v2"
                ? "rounded-2xl border border-ink-200/80 dark:border-ink-700/80 bg-gradient-to-r from-accent-50/40 via-white to-brand-50/35 dark:from-accent-950/25 dark:via-ink-900 dark:to-brand-950/20 p-6 md:p-8 scroll-mt-24 shadow-sm"
                : "card p-6 md:p-8 scroll-mt-24"
            }
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">
              <Icon name="info" size={16} /> Introduction
            </div>
            <BlockRenderer
              blocks={lesson.introBlocks}
              headingIdPrefix={`L${lesson.id}-intro`}
            />
            {introWords > 0 && (
              <div className="mt-4 text-xs text-ink-500 dark:text-ink-400 inline-flex items-center gap-1">
                <Icon name="info" size={12} /> {introWords} words ·{" "}
                {Math.max(1, Math.round(introWords / 250))} min
              </div>
            )}
          </section>
        )}

        {lesson.topics.map((t) => {
          const isTarget = topicId === t.id;
          return (
            <section
              key={t.id}
              id={`topic-${t.id}`}
              ref={
                isTarget
                  ? (el: HTMLElement | null) => {
                      targetRef.current = el;
                    }
                  : undefined
              }
              className={`scroll-mt-24 transition ${
                version === "v2"
                  ? `rounded-2xl border border-ink-200/70 dark:border-ink-700/70 bg-white/90 dark:bg-ink-900/40 p-6 md:p-8 shadow-card ${
                      isTarget
                        ? "ring-2 ring-brand-400/50 dark:ring-brand-500/40 border-brand-300/80 dark:border-brand-600/50"
                        : ""
                    }`
                  : `card p-6 md:p-8 ${
                      isTarget
                        ? "ring-2 ring-brand-300/60 dark:ring-brand-600/60 border-brand-300 dark:border-brand-700"
                        : ""
                    }`
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                  <Icon name="target" size={14} />
                  Topic {t.id}
                </span>
                {version === "v2" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                    Q&A format
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50 mb-6">
                {t.title}
              </h2>
              {version === "v2" ? (
                <V2StudyTopic blocks={t.blocks} headingIdPrefix={t.id} />
              ) : (
                <BlockRenderer blocks={t.blocks} headingIdPrefix={t.id} />
              )}
            </section>
          );
        })}

        {lesson.summaryBlocks.length > 0 && (
          <section
            id="summary"
            className="card p-6 md:p-8 scroll-mt-24 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-ink-900/60 border-emerald-200/70 dark:border-emerald-800/40"
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
              <Icon name="check" size={16} /> Lesson summary
            </div>
            <BlockRenderer
              blocks={lesson.summaryBlocks}
              headingIdPrefix={`L${lesson.id}-sum`}
            />
          </section>
        )}

        <nav className="grid sm:grid-cols-2 gap-3 pt-2">
          {prev ? (
            <Link
              to={`/notes/${prev.id}`}
              className="card card-hover p-4 group"
            >
              <div className="text-xs text-ink-500 dark:text-ink-400 inline-flex items-center gap-1">
                <Icon name="chevron-left" size={12} /> Previous
              </div>
              <div className="font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300 line-clamp-2">
                Lesson {prev.id}: {prev.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/notes/${next.id}`}
              className="card card-hover p-4 group sm:text-right"
            >
              <div className="text-xs text-ink-500 dark:text-ink-400 inline-flex items-center gap-1 sm:flex-row-reverse">
                Next <Icon name="chevron-right" size={12} />
              </div>
              <div className="font-semibold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300 line-clamp-2">
                Lesson {next.id}: {next.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </div>
  );
}
