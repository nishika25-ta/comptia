import type { AttemptResult, ContentVersion, ExamSession } from "../types";

export function progressKeys(version: ContentVersion) {
  const suffix = version;
  return {
    attempts: `secplus.attempts.${suffix}`,
    session: `secplus.examSession.${suffix}`,
    history: `secplus.examHistory.${suffix}`,
    visited: `secplus.visitedLessons.${suffix}`,
  } as const;
}

/** All localStorage keys that hold user progress (used by sync), both material versions. */
export const ALL_PROGRESS_KEYS = [
  ...Object.values(progressKeys("v1")),
  ...Object.values(progressKeys("v2")),
] as const;

export function loadAttempts(version: ContentVersion): AttemptResult[] {
  try {
    const raw = localStorage.getItem(progressKeys(version).attempts);
    return raw ? (JSON.parse(raw) as AttemptResult[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(version: ContentVersion, result: AttemptResult) {
  const attempts = loadAttempts(version);
  attempts.push(result);
  const trimmed = attempts.slice(-5000);
  try {
    localStorage.setItem(
      progressKeys(version).attempts,
      JSON.stringify(trimmed)
    );
  } catch {
    // ignore quota errors
  }
}

export function clearAttempts(version: ContentVersion) {
  try {
    localStorage.removeItem(progressKeys(version).attempts);
  } catch {
    // ignore
  }
}

export function loadExamSession(version: ContentVersion): ExamSession | null {
  try {
    const raw = localStorage.getItem(progressKeys(version).session);
    return raw ? (JSON.parse(raw) as ExamSession) : null;
  } catch {
    return null;
  }
}

export function saveExamSession(version: ContentVersion, session: ExamSession) {
  try {
    localStorage.setItem(
      progressKeys(version).session,
      JSON.stringify(session)
    );
  } catch {
    // ignore
  }
}

export function clearExamSession(version: ContentVersion) {
  try {
    localStorage.removeItem(progressKeys(version).session);
  } catch {
    // ignore
  }
}

export function loadExamHistory(version: ContentVersion): ExamSession[] {
  try {
    const raw = localStorage.getItem(progressKeys(version).history);
    return raw ? (JSON.parse(raw) as ExamSession[]) : [];
  } catch {
    return [];
  }
}

export function pushExamHistory(version: ContentVersion, session: ExamSession) {
  const history = loadExamHistory(version);
  history.unshift(session);
  const trimmed = history.slice(0, 50);
  try {
    localStorage.setItem(
      progressKeys(version).history,
      JSON.stringify(trimmed)
    );
  } catch {
    // ignore
  }
}

export function clearExamHistory(version: ContentVersion) {
  try {
    localStorage.removeItem(progressKeys(version).history);
  } catch {
    // ignore
  }
}

export function loadVisitedLessons(version: ContentVersion): Set<number> {
  try {
    const raw = localStorage.getItem(progressKeys(version).visited);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

export function markLessonVisited(version: ContentVersion, lessonId: number) {
  const visited = loadVisitedLessons(version);
  if (visited.has(lessonId)) return;
  visited.add(lessonId);
  try {
    localStorage.setItem(
      progressKeys(version).visited,
      JSON.stringify([...visited])
    );
  } catch {
    // ignore
  }
}

export function clearVisitedLessons(version: ContentVersion) {
  try {
    localStorage.removeItem(progressKeys(version).visited);
  } catch {
    // ignore
  }
}

export function aggregateStats(attempts: AttemptResult[]) {
  const perQuestion: Record<
    number,
    { attempts: number; correct: number; lastCorrect: boolean }
  > = {};
  for (const a of attempts) {
    if (!perQuestion[a.questionId]) {
      perQuestion[a.questionId] = {
        attempts: 0,
        correct: 0,
        lastCorrect: a.correct,
      };
    }
    perQuestion[a.questionId].attempts += 1;
    if (a.correct) perQuestion[a.questionId].correct += 1;
    perQuestion[a.questionId].lastCorrect = a.correct;
  }
  return { perQuestion };
}
