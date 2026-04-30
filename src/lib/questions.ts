import questionsData from "../data/questions.json";
import type { Question } from "../types";

const ALL_QUESTIONS = questionsData as Question[];

export const VALID_QUESTIONS: Question[] = ALL_QUESTIONS.filter(
  (q) => !q.error && Array.isArray(q.options) && q.options.length >= 2
);

export const PBQ_QUESTIONS: Question[] = ALL_QUESTIONS.filter((q) => !!q.error);

export const ALL_CATEGORIES = Array.from(
  new Set(VALID_QUESTIONS.map((q) => q.category).filter(Boolean))
).sort();

export const CATEGORY_COUNTS: Record<string, number> = VALID_QUESTIONS.reduce(
  (acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

export function getById(id: number): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function isAnswerCorrect(q: Question, selected: string[]): boolean {
  if (!q.answer || q.answer.length === 0) return false;
  if (selected.length !== q.answer.length) return false;
  const a = [...q.answer].sort().join(",");
  const b = [...selected].sort().join(",");
  return a === b;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function letterToIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
}

export function indexToLetter(idx: number): string {
  return String.fromCharCode("A".charCodeAt(0) + idx);
}

export function totalQuestionCount(): number {
  return ALL_QUESTIONS.length;
}
