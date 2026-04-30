import type { AttemptResult, ExamSession } from "../types";

const ATTEMPTS_KEY = "secplus.attempts.v1";
const SESSION_KEY = "secplus.examSession.v1";
const HISTORY_KEY = "secplus.examHistory.v1";

export function loadAttempts(): AttemptResult[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptResult[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(result: AttemptResult) {
  const attempts = loadAttempts();
  attempts.push(result);
  // Keep last 5000 attempts to avoid bloat
  const trimmed = attempts.slice(-5000);
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota errors
  }
}

export function clearAttempts() {
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // ignore
  }
}

export function loadExamSession(): ExamSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ExamSession) : null;
  } catch {
    return null;
  }
}

export function saveExamSession(session: ExamSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearExamSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function loadExamHistory(): ExamSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ExamSession[]) : [];
  } catch {
    return [];
  }
}

export function pushExamHistory(session: ExamSession) {
  const history = loadExamHistory();
  history.unshift(session);
  const trimmed = history.slice(0, 50);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function clearExamHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

/** Aggregate attempts to compute per-question and per-category stats. */
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
