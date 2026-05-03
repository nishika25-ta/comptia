import type { Block } from "../types";
import { BlockRenderer } from "./BlockRenderer";
import { Icon } from "./Icon";

interface Props {
  blocks: Block[];
  headingIdPrefix: string;
}

/**
 * Presents Version 2 notes (question + explanation) with clearer hierarchy.
 */
export default function V2StudyTopic({ blocks, headingIdPrefix }: Props) {
  if (blocks.length === 0) return null;

  const [first, ...rest] = blocks;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-ink-200/90 dark:border-ink-700/90 bg-gradient-to-br from-white via-brand-50/35 to-accent-50/25 dark:from-ink-900 dark:via-brand-950/25 dark:to-accent-950/20 shadow-sm">
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-600 opacity-90"
          aria-hidden
        />
        <div className="p-5 md:p-7 pt-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 mb-3 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 dark:bg-brand-400/10">
              <Icon name="practice" size={15} />
            </span>
            Question scenario
          </div>
          {first.type === "paragraph" ? (
            <p className="text-[1.0625rem] md:text-lg leading-relaxed text-ink-800 dark:text-ink-100 whitespace-pre-wrap">
              {first.text}
            </p>
          ) : first.type === "heading" ? (
            <h3 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-50">
              {first.text}
            </h3>
          ) : (
            <BlockRenderer
              blocks={[first]}
              headingIdPrefix={`${headingIdPrefix}-stem`}
            />
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="rounded-2xl border border-violet-200/75 dark:border-violet-800/45 border-l-4 border-l-violet-500 dark:border-l-violet-400 bg-gradient-to-b from-violet-50/90 to-white dark:from-violet-950/35 dark:to-ink-900/80 shadow-sm p-5 md:p-7">
          <div className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 dark:bg-violet-400/10">
              <Icon name="lightning" size={15} />
            </span>
            Explanation & takeaways
          </div>
          <BlockRenderer blocks={rest} headingIdPrefix={headingIdPrefix} />
        </div>
      )}
    </div>
  );
}
