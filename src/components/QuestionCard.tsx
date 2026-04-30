import { useEffect } from "react";
import type { Question } from "../types";
import { indexToLetter, letterToIndex } from "../lib/questions";
import { Icon } from "./Icon";

interface Props {
  question: Question;
  selected: string[];
  setSelected: (next: string[]) => void;
  showAnswer?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  flagged?: boolean;
  onToggleFlag?: () => void;
  disabled?: boolean;
  /** When true, A-Z keys toggle options; F flags the question. */
  enableHotkeys?: boolean;
}

export default function QuestionCard({
  question,
  selected,
  setSelected,
  showAnswer = false,
  questionNumber,
  totalQuestions,
  flagged,
  onToggleFlag,
  disabled = false,
  enableHotkeys = false,
}: Props) {
  const isMulti = question.multi;
  const correctSet = new Set(question.answer);

  function toggle(letter: string) {
    if (disabled) return;
    if (isMulti) {
      if (selected.includes(letter)) {
        setSelected(selected.filter((s) => s !== letter));
      } else {
        const cap = question.answer.length || 2;
        if (selected.length >= cap) return;
        setSelected([...selected, letter]);
      }
    } else {
      setSelected([letter]);
    }
  }

  useEffect(() => {
    if (!enableHotkeys || disabled) return;
    function onKey(e: KeyboardEvent) {
      // Don't intercept while typing in form inputs.
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toUpperCase();
      if (k.length === 1 && k >= "A" && k <= "Z") {
        const idx = letterToIndex(k);
        if (idx >= 0 && idx < question.options.length) {
          e.preventDefault();
          toggle(k);
        }
        return;
      }
      if (k === "F" && onToggleFlag) {
        e.preventDefault();
        onToggleFlag();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableHotkeys, disabled, question.id, selected.join(","), isMulti]);

  return (
    <div className="card p-6 md:p-7 animate-scale-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {questionNumber !== undefined && totalQuestions !== undefined && (
            <span className="chip bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200 font-mono">
              {questionNumber} / {totalQuestions}
            </span>
          )}
          <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            {question.category}
          </span>
          {isMulti && (
            <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
              <Icon name="check" size={12} />
              Select {question.answer.length}
            </span>
          )}
          <span className="chip bg-ink-50 text-ink-500 dark:bg-ink-900 dark:text-ink-400 font-mono">
            #{question.id}
          </span>
        </div>
        {onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            className={`btn !py-1.5 !px-3 ${
              flagged
                ? "bg-amber-50 border border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/60 dark:text-amber-200"
                : "btn-outline"
            }`}
            title={flagged ? "Unflag (F)" : "Flag for review (F)"}
          >
            <Icon
              name="flag"
              size={14}
              strokeWidth={flagged ? 2.4 : 1.8}
              className={flagged ? "fill-amber-300/40" : ""}
            />
            <span className="text-xs font-medium">
              {flagged ? "Flagged" : "Flag"}
            </span>
          </button>
        )}
      </div>

      <p className="text-base md:text-lg text-ink-900 dark:text-ink-50 leading-relaxed font-medium mb-5 whitespace-pre-wrap">
        {question.questionText}
      </p>

      <ul className="space-y-2.5">
        {question.options.map((opt, idx) => {
          const letter = indexToLetter(idx);
          const isSelected = selected.includes(letter);
          const isCorrect = correctSet.has(letter);

          let stateClass =
            "border-ink-200 dark:border-ink-700 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 cursor-pointer";

          if (showAnswer) {
            if (isCorrect && isSelected)
              stateClass =
                "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-600 ring-1 ring-emerald-300/60";
            else if (isCorrect)
              stateClass =
                "border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-700";
            else if (isSelected && !isCorrect)
              stateClass =
                "border-rose-400 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-700 ring-1 ring-rose-300/50";
            else
              stateClass =
                "border-ink-200 dark:border-ink-700 opacity-70";
          } else if (isSelected) {
            stateClass =
              "border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 dark:border-brand-500 ring-1 ring-brand-300/50";
          }

          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => toggle(letter)}
                disabled={disabled}
                className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${stateClass} ${
                  disabled ? "cursor-default" : ""
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-lg grid place-items-center font-bold text-sm border transition-all ${
                    showAnswer && isCorrect
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : showAnswer && isSelected
                        ? "bg-rose-500 text-white border-rose-500"
                        : isSelected
                          ? "bg-brand-600 text-white border-brand-600 dark:bg-brand-500 dark:border-brand-500"
                          : "bg-white text-ink-700 border-ink-300 dark:bg-ink-900 dark:text-ink-200 dark:border-ink-700"
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1 text-ink-800 dark:text-ink-100 leading-relaxed">
                  {opt}
                </span>
                {showAnswer && isCorrect && (
                  <span className="ml-auto inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-bold text-sm">
                    <Icon name="check" size={14} strokeWidth={2.6} />
                    Correct
                  </span>
                )}
                {showAnswer && isSelected && !isCorrect && (
                  <span className="ml-auto inline-flex items-center gap-1 text-rose-600 dark:text-rose-300 font-bold text-sm">
                    <Icon name="x" size={14} strokeWidth={2.6} />
                    Your pick
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {enableHotkeys && !showAnswer && !disabled && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          <span>Tip:</span>
          <span className="inline-flex items-center gap-1">
            Press <kbd className="kbd">A</kbd>–
            <kbd className="kbd">{indexToLetter(question.options.length - 1)}</kbd>{" "}
            to choose
          </span>
          {onToggleFlag && (
            <span className="inline-flex items-center gap-1">
              · <kbd className="kbd">F</kbd> to flag
            </span>
          )}
        </div>
      )}

      {showAnswer && (
        <div className="mt-6 border-t border-ink-200 dark:border-ink-800 pt-4 animate-fade-in">
          <div className="text-sm font-semibold text-ink-800 dark:text-ink-100 mb-2 flex flex-wrap items-baseline gap-1">
            <span className="text-ink-500 dark:text-ink-400 font-medium">
              Correct answer:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-300">
              {question.answer.join(", ")}
            </span>
            {question.answer.length === 1 &&
              question.options[letterToIndex(question.answer[0])] && (
                <span className="text-ink-700 dark:text-ink-200 font-normal">
                  — {question.options[letterToIndex(question.answer[0])]}
                </span>
              )}
          </div>
          {question.explanation ? (
            <div className="prose-tight text-sm text-ink-700 dark:text-ink-200 leading-relaxed">
              {question.explanation
                .split(/\n\n+/)
                .map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : (
            <p className="text-sm text-ink-500 dark:text-ink-400 italic">
              No explanation provided in the source for this question.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
