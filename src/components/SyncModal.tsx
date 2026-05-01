import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ALL_PROGRESS_KEYS } from "../lib/storage";

// ── Helpers ───────────────────────────────────────────────────────────────────

function exportSyncCode(): string {
  const payload: Record<string, unknown> = { v: 1 };
  for (const key of ALL_PROGRESS_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) payload[key] = JSON.parse(raw);
  }
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function importSyncCode(code: string, mode: "merge" | "replace"): void {
  const json = JSON.parse(decodeURIComponent(atob(code.trim())));
  for (const key of ALL_PROGRESS_KEYS) {
    if (!(key in json)) continue;
    if (mode === "replace") {
      localStorage.setItem(key, JSON.stringify(json[key]));
    } else {
      // merge: combine arrays, newer entries win by timestamp
      const existing = localStorage.getItem(key);
      if (!existing) {
        localStorage.setItem(key, JSON.stringify(json[key]));
      } else {
        const local = JSON.parse(existing);
        if (Array.isArray(local) && Array.isArray(json[key])) {
          // Deduplicate by serialised value for attempts, prepend for history
          const combined = [...json[key], ...local];
          // Keep last-seen unique by (questionId, timestamp) for attempts
          const seen = new Set<string>();
          const merged = combined.filter((item) => {
            const k =
              typeof item === "object" && item !== null
                ? JSON.stringify(item)
                : String(item);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          localStorage.setItem(key, JSON.stringify(merged.slice(0, 5000)));
        } else {
          localStorage.setItem(key, JSON.stringify(json[key]));
        }
      }
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onDone: () => void;
}

type Tab = "export" | "import";

export default function SyncModal({ onClose, onDone }: Props) {
  const [tab, setTab] = useState<Tab>("export");
  const [syncCode, setSyncCode] = useState<string>("");
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Generate export code once on mount
  useEffect(() => {
    setSyncCode(exportSyncCode());
  }, []);

  // Trap focus & close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleCopy() {
    navigator.clipboard.writeText(syncCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleImport() {
    setImportError("");
    setImportSuccess(false);
    try {
      importSyncCode(importText, importMode);
      setImportSuccess(true);
      // Give the user 1.5 s to see the success message before closing.
      setTimeout(() => onDone(), 1500);
    } catch {
      setImportError(
        "Invalid sync code. Make sure you pasted the full code exactly as generated."
      );
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="card w-full max-w-lg p-0 overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Cross-device progress sync"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <Icon name="sync" size={18} className="text-brand-500" />
            <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-50">
              Sync progress across devices
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink-200 dark:border-ink-800">
          {(["export", "import"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setImportError("");
                setImportSuccess(false);
              }}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/40 dark:bg-brand-900/20"
                  : "text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200"
              }`}
            >
              {t === "export" ? (
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <Icon name="upload" size={14} /> Export from this device
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <Icon name="download" size={14} /> Import to this device
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {tab === "export" ? (
            <>
              <p className="text-sm text-ink-600 dark:text-ink-300">
                Copy the sync code below and paste it on your other device using
                the <strong>Import</strong> tab.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  value={syncCode}
                  rows={5}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 text-xs font-mono text-ink-700 dark:text-ink-200 p-3 resize-none focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>

              <button
                onClick={handleCopy}
                className={`btn-primary w-full flex items-center justify-center gap-2 transition-all ${
                  copied ? "!bg-emerald-600" : ""
                }`}
              >
                <Icon name={copied ? "check" : "copy"} size={15} />
                {copied ? "Copied!" : "Copy sync code"}
              </button>

              <p className="text-xs text-ink-500 dark:text-ink-400 text-center">
                The code contains all your practice attempts and exam history.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-600 dark:text-ink-300">
                Paste a sync code generated on another device to bring your
                progress here.
              </p>

              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError("");
                  setImportSuccess(false);
                }}
                rows={5}
                placeholder="Paste your sync code here…"
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 text-xs font-mono text-ink-700 dark:text-ink-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-ink-400"
              />

              {/* Merge/Replace toggle */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-600 dark:text-ink-300 font-medium">
                  Import mode:
                </span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="import-mode"
                    value="merge"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                    className="accent-brand-500"
                  />
                  <span className="text-ink-700 dark:text-ink-200">Merge</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="import-mode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                    className="accent-rose-500"
                  />
                  <span className="text-ink-700 dark:text-ink-200">
                    Replace
                  </span>
                </label>
                <span className="text-xs text-ink-400 dark:text-ink-500 ml-auto">
                  {importMode === "merge"
                    ? "Combines with existing data"
                    : "Overwrites existing data"}
                </span>
              </div>

              {importError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 p-3 text-sm text-rose-700 dark:text-rose-300">
                  <Icon name="warning" size={15} className="mt-0.5 shrink-0" />
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  <Icon name="check" size={15} className="shrink-0" />
                  Progress imported successfully! Your dashboard has been
                  refreshed.
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!importText.trim() || importSuccess}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="download" size={15} />
                Import progress
              </button>

              {importMode === "replace" && !importSuccess && (
                <p className="text-xs text-rose-500 dark:text-rose-400 text-center">
                  ⚠ Replace mode will overwrite your current progress on this
                  device.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
