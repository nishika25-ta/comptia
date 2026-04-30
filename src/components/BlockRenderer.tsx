import type { Block } from "../types";
import { Icon } from "./Icon";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function CalloutObjectives({ heading, items }: { heading?: string; items?: string[] }) {
  return (
    <div className="my-6 rounded-2xl border border-brand-200 bg-brand-50/70 dark:border-brand-800/70 dark:bg-brand-900/20 p-4">
      <div className="flex items-center gap-2 text-brand-700 dark:text-brand-200 font-semibold text-sm">
        <Icon name="target" size={16} />
        <span>{heading || "Exam objectives covered"}</span>
      </div>
      {items && items.length > 0 && (
        <ul className="mt-2 space-y-1 text-[0.95rem] text-ink-700 dark:text-ink-100">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-500">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalloutLessonObjectives({
  heading,
  lead,
  items,
}: {
  heading?: string;
  lead?: string;
  items?: string[];
}) {
  return (
    <div className="my-6 rounded-2xl border border-accent-200/70 bg-gradient-to-br from-accent-50 to-brand-50 dark:from-accent-950/40 dark:to-brand-950/40 dark:border-accent-800/60 p-5">
      <div className="flex items-center gap-2 text-accent-700 dark:text-accent-200 font-semibold text-sm uppercase tracking-wider">
        <Icon name="sparkles" size={16} />
        <span>{heading || "In this lesson, you will:"}</span>
      </div>
      {lead && (
        <p className="mt-2 text-ink-700 dark:text-ink-200 text-[0.95rem]">
          {lead}
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-[0.95rem]">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 items-start text-ink-800 dark:text-ink-100"
            >
              <span className="mt-1 text-accent-600 dark:text-accent-300">
                <Icon name="check" size={14} strokeWidth={2.4} />
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalloutReview({ heading, items }: { heading?: string; items?: string[] }) {
  return (
    <div className="my-6 rounded-2xl border border-amber-300/70 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30 p-5">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold text-sm">
        <Icon name="lightning" size={16} />
        <span>{heading || "Review activity"}</span>
      </div>
      {items && items.length > 0 && (
        <ol className="mt-3 space-y-2 list-decimal list-outside pl-5 text-[0.95rem] text-ink-800 dark:text-ink-100">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ListBlock({ items }: { items: Array<{ term?: string; text: string }> }) {
  return (
    <ul className="my-4 space-y-2.5">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex gap-3 text-[0.975rem] leading-7 text-ink-700 dark:text-ink-200"
        >
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
          <span>
            {it.term && (
              <strong className="font-semibold text-ink-900 dark:text-ink-50">
                {it.term}
                <span className="text-ink-400 dark:text-ink-500"> — </span>
              </strong>
            )}
            {it.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface BlockRendererProps {
  blocks: Block[];
  /**
   * If provided, attaches an id to each heading block by slugifying the heading
   * text using the given prefix, e.g. "1A-information-security".
   */
  headingIdPrefix?: string;
  /** Optional heading start level (default: 2). */
  headingLevel?: 2 | 3;
}

export function BlockRenderer({
  blocks,
  headingIdPrefix,
  headingLevel = 2,
}: BlockRendererProps) {
  const HeadingTag = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";
  return (
    <div className="notes-prose">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          const id = headingIdPrefix
            ? `${headingIdPrefix}-${slugify(b.text)}`
            : undefined;
          return (
            <HeadingTag key={i} id={id} className="group">
              <span>{b.text}</span>
              {id && (
                <a
                  href={`#${id}`}
                  className="ml-2 text-ink-300 dark:text-ink-600 opacity-0 group-hover:opacity-100 transition text-base"
                  aria-label="Anchor link"
                >
                  #
                </a>
              )}
            </HeadingTag>
          );
        }
        if (b.type === "paragraph") {
          return <p key={i}>{b.text}</p>;
        }
        if (b.type === "list") {
          return <ListBlock key={i} items={b.items} />;
        }
        if (b.type === "callout") {
          if (b.kind === "objectives")
            return (
              <CalloutObjectives
                key={i}
                heading={b.heading}
                items={b.items}
              />
            );
          if (b.kind === "lesson-objectives")
            return (
              <CalloutLessonObjectives
                key={i}
                heading={b.heading}
                lead={b.lead}
                items={b.items}
              />
            );
          if (b.kind === "review")
            return (
              <CalloutReview key={i} heading={b.heading} items={b.items} />
            );
          // generic note fallback
          return (
            <div
              key={i}
              className="my-6 rounded-2xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900/60 p-4 text-[0.95rem] text-ink-700 dark:text-ink-200"
            >
              {b.heading && <div className="font-semibold mb-1">{b.heading}</div>}
              {b.text && <p>{b.text}</p>}
              {b.items && (
                <ul className="list-disc pl-5 space-y-1">
                  {b.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/**
 * Extract the headings from a sequence of blocks for use as a TOC.
 */
export function extractHeadings(
  blocks: Block[],
  prefix: string
): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const b of blocks) {
    if (b.type === "heading") {
      out.push({ id: `${prefix}-${slugify(b.text)}`, text: b.text });
    }
  }
  return out;
}
