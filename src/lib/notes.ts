import notesV1 from "../data/notes.json";
import notesV2 from "../data/notes2.json";
import glossaryV1 from "../data/glossary.json";
import glossaryV2 from "../data/glossary2.json";
import type { Block, ContentVersion, GlossaryEntry, Lesson } from "../types";

const LESSONS_POOL: Record<ContentVersion, Lesson[]> = {
  v1: notesV1 as Lesson[],
  v2: notesV2 as Lesson[],
};

const GLOSSARY_POOL: Record<ContentVersion, GlossaryEntry[]> = {
  v1: glossaryV1 as GlossaryEntry[],
  v2: glossaryV2 as GlossaryEntry[],
};

export function getLessons(version: ContentVersion): Lesson[] {
  return LESSONS_POOL[version];
}

export function getGlossary(version: ContentVersion): GlossaryEntry[] {
  return GLOSSARY_POOL[version];
}

export function getLesson(
  version: ContentVersion,
  id: number | string
): Lesson | undefined {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return getLessons(version).find((l) => l.id === numId);
}

export function getTopic(
  version: ContentVersion,
  lessonId: number | string,
  topicId: string
) {
  const lesson = getLesson(version, lessonId);
  if (!lesson) return undefined;
  return lesson.topics.find((t) => t.id === topicId);
}

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

export function searchNotes(
  version: ContentVersion,
  query: string,
  limit = 50
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const lessons = getLessons(version);
  const glossary = getGlossary(version);
  const results: SearchResult[] = [];
  for (const lesson of lessons) {
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
  for (const entry of glossary) {
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

export function lessonReadingMinutes(lesson: Lesson): number {
  const text = [
    blocksToText(lesson.introBlocks),
    blocksToText(lesson.summaryBlocks),
    ...lesson.topics.map((t) => blocksToText(t.blocks)),
  ].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 250));
}
