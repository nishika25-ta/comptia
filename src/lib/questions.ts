import questionsV1 from "../data/questions.json";
import questionsV2 from "../data/questions2.json";
import { sortExamDomains } from "./examDomains";
import type { ContentVersion, Question } from "../types";

const POOLS: Record<ContentVersion, Question[]> = {
  v1: questionsV1 as Question[],
  v2: questionsV2 as Question[],
};

export function getAllQuestions(version: ContentVersion): Question[] {
  return POOLS[version];
}

export function getValidQuestions(version: ContentVersion): Question[] {
  return POOLS[version].filter(
    (q) => !q.error && Array.isArray(q.options) && q.options.length >= 2
  );
}

export function getPbqQuestions(version: ContentVersion): Question[] {
  return POOLS[version].filter((q) => !!q.error);
}

export function getCategories(version: ContentVersion): string[] {
  const valid = getValidQuestions(version);
  const unique = Array.from(
    new Set(valid.map((q) => q.category).filter(Boolean))
  );
  return sortExamDomains(unique);
}

export function getCategoryCounts(version: ContentVersion): Record<string, number> {
  return getValidQuestions(version).reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function getQuestionById(
  version: ContentVersion,
  id: number
): Question | undefined {
  return POOLS[version].find((q) => q.id === id);
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

export function totalQuestionCount(version: ContentVersion): number {
  return POOLS[version].length;
}
