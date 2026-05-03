import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { useContentVersion } from "../lib/contentVersion";
import type { ContentVersion } from "../types";

const NAV = [
  { to: "/", label: "Home", icon: "home" as const, end: true },
  { to: "/practice", label: "Practice", icon: "practice" as const },
  { to: "/exam", label: "Exam", icon: "exam" as const },
  { to: "/notes", label: "Notes", icon: "book" as const },
  { to: "/glossary", label: "Glossary", icon: "glossary" as const },
  { to: "/progress", label: "Progress", icon: "progress" as const },
];

function MaterialVersionToggle() {
  const { version, setVersion } = useContentVersion();
  const choices: { id: ContentVersion; label: string }[] = [
    { id: "v1", label: "Version 1" },
    { id: "v2", label: "Version 2" },
  ];
  return (
    <div
      className="flex rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50/80 dark:bg-ink-900/50 p-0.5 shrink-0"
      role="group"
      aria-label="Study material version"
    >
      {choices.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setVersion(c.id)}
          className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors ${
            version === c.id
              ? "bg-white dark:bg-ink-800 text-brand-700 dark:text-brand-200 shadow-sm"
              : "text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export default function Layout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 no-print backdrop-blur-md bg-white/75 dark:bg-ink-950/70 border-b border-ink-200 dark:border-ink-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 grid place-items-center text-white font-bold shadow-sm">
              <Icon name="shield" size={18} className="text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-ink-900 dark:text-ink-50 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors truncate">
                Security+ Sandbox
              </span>
              <span className="hidden sm:block text-[11px] text-ink-500 dark:text-ink-400 truncate">
                SY0-701 study & practice
              </span>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 items-center justify-end gap-3 min-w-0">
            <MaterialVersionToggle />
            <nav className="flex items-center gap-1 flex-wrap justify-end">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                        : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50"
                    }`
                  }
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex md:hidden items-center gap-1 shrink-0">
            <MaterialVersionToggle />
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto md:ml-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn-ghost md:hidden rounded-full !p-2"
              aria-label="Toggle navigation menu"
            >
              <Icon name={open ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-950 animate-fade-in">
            <nav className="max-w-7xl mx-auto px-2 py-2 flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                        : "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                    }`
                  }
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-10">
          {children ?? <Outlet />}
        </div>
      </main>

      <footer className="border-t border-ink-200 dark:border-ink-800 bg-white/50 dark:bg-ink-950/50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-5 text-xs text-ink-500 dark:text-ink-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            Built for personal study. Content from CompTIA Security+ SY0-701
            public sample questions and the Official CompTIA Security+ Student
            Guide.
          </span>
          <span className="opacity-70">
            All study data stays in your browser.
          </span>
        </div>
      </footer>
    </div>
  );
}
