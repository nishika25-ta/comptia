import { useMemo, useState } from "react";
import { CHEAT_SECTIONS } from "../data/cheatsheet";
import { Icon } from "./Icon";

const COLORS: Record<string, { chip: string; badge: string; border: string }> = {
  brand:  { chip: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",  badge: "bg-brand-500",  border: "border-brand-200 dark:border-brand-800" },
  violet: { chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200", badge: "bg-violet-500", border: "border-violet-200 dark:border-violet-800" },
  emerald:{ chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200", badge: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-800" },
  accent: { chip: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200",  badge: "bg-accent-500",  border: "border-accent-200 dark:border-accent-800" },
  rose:   { chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",    badge: "bg-rose-500",    border: "border-rose-200 dark:border-rose-800" },
  amber:  { chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",  badge: "bg-amber-500",  border: "border-amber-200 dark:border-amber-800" },
  teal:   { chip: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200",    badge: "bg-teal-500",    border: "border-teal-200 dark:border-teal-800" },
  orange: { chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200", badge: "bg-orange-500", border: "border-orange-200 dark:border-orange-800" },
  red:    { chip: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",      badge: "bg-red-500",    border: "border-red-200 dark:border-red-800" },
  indigo: { chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200", badge: "bg-indigo-500", border: "border-indigo-200 dark:border-indigo-800" },
  cyan:   { chip: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",    badge: "bg-cyan-500",    border: "border-cyan-200 dark:border-cyan-800" },
};

export default function CheatSheet() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CHEAT_SECTIONS;
    return CHEAT_SECTIONS.map((sec) => ({
      ...sec,
      entries: sec.entries.filter(
        (e) => e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q)
      ),
    })).filter((sec) => sec.entries.length > 0);
  }, [search]);

  const totalEntries = CHEAT_SECTIONS.reduce((a, s) => a + s.entries.length, 0);

  return (
    <section className="card overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-brand-600 grid place-items-center shadow-sm shrink-0">
            <Icon name="lightning" size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display font-semibold text-ink-900 dark:text-ink-50">
              Security+ Cheat Sheet
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">
              {CHEAT_SECTIONS.length} domains · {totalEntries} must-know concepts
            </div>
          </div>
        </div>
        <Icon
          name="chevron-down"
          size={18}
          className={`text-ink-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-ink-200 dark:border-ink-800">
          {/* Search + stats bar */}
          <div className="px-4 pt-4 pb-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveTab(0); }}
                placeholder="Filter concepts…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 shrink-0">
              <span className="font-semibold text-ink-700 dark:text-ink-200">{filtered.reduce((a,s)=>a+s.entries.length,0)}</span> matches
            </div>
          </div>

          {/* Domain tabs (hidden when searching) */}
          {!search && (
            <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
              {CHEAT_SECTIONS.map((sec, i) => {
                const c = COLORS[sec.color] ?? COLORS.brand;
                return (
                  <button
                    key={sec.title}
                    onClick={() => setActiveTab(i)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === i ? c.chip + " ring-2 ring-inset ring-current/30" : "bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700"
                    }`}
                  >
                    {sec.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Entries */}
          <div className="px-4 pb-5 space-y-4">
            {(search ? filtered : [filtered[activeTab]].filter(Boolean)).map((sec) => {
              if (!sec) return null;
              const c = COLORS[sec.color] ?? COLORS.brand;
              return (
                <div key={sec.title}>
                  {search && (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg mb-2 ${c.chip}`}>
                      {sec.title}
                    </div>
                  )}
                  <div className={`rounded-xl border ${c.border} overflow-hidden`}>
                    <table className="w-full text-sm">
                      <tbody>
                        {sec.entries.map((entry, i) => (
                          <tr
                            key={entry.term}
                            className={`${i % 2 === 0 ? "bg-white dark:bg-ink-900" : "bg-ink-50/60 dark:bg-ink-800/40"} border-t border-ink-100 dark:border-ink-800 first:border-t-0`}
                          >
                            <td className="py-2.5 px-3 align-top w-[30%] min-w-[120px]">
                              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${c.chip}`}>
                                {entry.term}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-ink-700 dark:text-ink-200 leading-relaxed">
                              {entry.def}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
