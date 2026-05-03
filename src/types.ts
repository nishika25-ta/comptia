/** Study material set: official SY0-701 pack + Student Guide vs. supplemental guide PDF. */
export type ContentVersion = "v1" | "v2";

export interface Question {
  id: number;
  category: string;
  questionText: string;
  options: string[];
  answer: string[];
  multi: boolean;
  explanation: string;
  error?: string;
  raw?: string;
  _issues?: string[];
}

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: Array<{ term?: string; text: string }> }
  | {
      type: "callout";
      kind: "objectives" | "lesson-objectives" | "review" | "note";
      heading?: string;
      lead?: string;
      items?: string[];
      text?: string;
    };

export interface Topic {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Lesson {
  id: number;
  title: string;
  introBlocks: Block[];
  summaryBlocks: Block[];
  topics: Topic[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export type AttemptResult = {
  questionId: number;
  selected: string[];
  correct: boolean;
  timestamp: number;
};

export type ExamSession = {
  startedAt: number;
  finishedAt?: number;
  durationMs: number;
  questionIds: number[];
  answers: Record<number, string[]>;
  flagged: number[];
  correctCount?: number;
  score?: number; // 0..1
};
