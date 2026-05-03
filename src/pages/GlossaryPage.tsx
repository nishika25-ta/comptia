import { useMemo, useState } from "react";
import { getGlossary, highlight } from "../lib/notes";
import { useContentVersion } from "../lib/contentVersion";
import { Icon } from "../components/Icon";

export default function GlossaryPage() {
  const { version } = useContentVersion();
  const GLOSSARY = useMemo(() => getGlossary(version), [version]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q)
    );
  }, [query, GLOSSARY]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof GLOSSARY>();
    for (const e of filtered) {
      const letter = (e.term[0] || "?").toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const lettersAvailable = grouped.map(([k]) => k);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 chip bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200 mb-2">
          <Icon name="glossary" size={14} /> Glossary ·{" "}
          {version === "v1" ? "Version 1" : "Version 2"}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
          Security+ glossary
        </h1>
        <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
          {version === "v1"
            ? `${GLOSSARY.length} terms extracted from the Official Student Guide.`
            : GLOSSARY.length > 0
              ? `${GLOSSARY.length} terms for Version 2.`
              : "No separate glossary file ships with Version 2 yet — use Study Notes search for definitions in explanations."}
        </p>
      </div>

      <div className="card p-4 sticky top-[68px] z-10 bg-white/95 dark:bg-ink-950/90 backdrop-blur">
        <div className="relative">
          <Icon
            name="search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search glossary…"
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
            const has = lettersAvailable.includes(letter);
            return (
              <a
                key={letter}
                href={has ? `#letter-${letter}` : undefined}
                className={`w-7 h-7 rounded-md grid place-items-center text-xs font-bold transition-colors ${
                  has
                    ? "text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/50"
                    : "text-ink-300 dark:text-ink-700 cursor-default"
                }`}
              >
                {letter}
              </a>
            );
          })}
        </div>
        <div className="text-xs text-ink-500 dark:text-ink-400 mt-2">
          Showing{" "}
          <span className="font-semibold text-ink-700 dark:text-ink-200">
            {filtered.length}
          </span>{" "}
          of {GLOSSARY.length} terms
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map(([letter, entries]) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-48">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-display text-2xl font-bold text-brand-600 dark:text-brand-300 w-10 h-10 grid place-items-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
                {letter}
              </span>
              <span className="text-sm text-ink-500 dark:text-ink-400">
                {entries.length} term{entries.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="card divide-y divide-ink-100 dark:divide-ink-800">
              {entries.map((e, i) => (
                <div key={i} className="p-4 md:p-5">
                  <div
                    className="font-semibold text-ink-900 dark:text-ink-50"
                    dangerouslySetInnerHTML={{
                      __html: highlight(e.term, query),
                    }}
                  />
                  <div
                    className="text-sm text-ink-700 dark:text-ink-200 mt-1 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlight(e.definition, query),
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
