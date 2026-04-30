import notesData from "../data/notes.json";
import glossaryData from "../data/glossary.json";
import type { Block, GlossaryEntry, Lesson } from "../types";

export const LESSONS = notesData as Lesson[];
export const GLOSSARY = glossaryData as GlossaryEntry[];

export function getLesson(id: number | string): Lesson | undefined {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return LESSONS.find((l) => l.id === numId);
}

export function getTopic(lessonId: number | string, topicId: string) {
  const lesson = getLesson(lessonId);
  if (!lesson) return undefined;
  return lesson.topics.find((t) => t.id === topicId);
}

/**
 * Flatten a list of blocks into a string used for searching/preview.
 */
export function blocksToText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "paragraph" || b.type === "heading") parts.push(b.text);
    else if (b.type === "list" && b.items) {
      for (const it of b.items) {
        parts.push((it.term ? it.term + " " : "") + it.text);
      }
    } else if (b.type === "callout") {
      if (b.heading) parts.push(b.heading);
      if (b.lead) parts.push(b.lead);
      if (b.items) parts.push(...b.items);
      if (b.text) parts.push(b.text);
    }
  }
  return parts.join(" ");
}

export type SearchResult =
  | {
      type: "topic";
      lessonId: number;
      lessonTitle: string;
      topicId: string;
      topicTitle: string;
      blockIndex: number;
      snippet: string;
    }
  | {
      type: "intro";
      lessonId: number;
      lessonTitle: string;
      blockIndex: number;
      snippet: string;
    }
  | { type: "glossary"; term: string; definition: string };

function blockSnippet(block: Block): string {
  if (block.type === "paragraph" || block.type === "heading") return block.text;
  if (block.type === "list" && block.items) {
    return block.items
      .map((it) => (it.term ? it.term + " — " : "") + it.text)
      .join(" • ");
  }
  if (block.type === "callout") {
    const items = block.items ? block.items.join(" • ") : "";
    return [block.heading, block.lead, items, block.text]
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

export function searchNotes(query: string, limit = 50): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const lesson of LESSONS) {
    lesson.introBlocks.forEach((block, idx) => {
      const snippet = blockSnippet(block);
      if (snippet.toLowerCase().includes(q)) {
        results.push({
          type: "intro",
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          blockIndex: idx,
          snippet,
        });
      }
    });
    for (const topic of lesson.topics) {
      topic.blocks.forEach((block, idx) => {
        const snippet = blockSnippet(block);
        if (snippet.toLowerCase().includes(q)) {
          results.push({
            type: "topic",
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            topicId: topic.id,
            topicTitle: topic.title,
            blockIndex: idx,
            snippet,
          });
        }
      });
    }
  }
  for (const entry of GLOSSARY) {
    if (
      entry.term.toLowerCase().includes(q) ||
      entry.definition.toLowerCase().includes(q)
    ) {
      results.push({
        type: "glossary",
        term: entry.term,
        definition: entry.definition,
      });
    }
  }
  return results.slice(0, limit);
}

export function highlight(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "ig"), "<mark>$1</mark>");
}

/**
 * Compute reading time in minutes for a lesson (250 words/min).
 */
export function lessonReadingMinutes(lesson: Lesson): number {
  const text = [
    blocksToText(lesson.introBlocks),
    blocksToText(lesson.summaryBlocks),
    ...lesson.topics.map((t) => blocksToText(t.blocks)),
  ].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 250));
}
