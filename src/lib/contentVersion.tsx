import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ContentVersion } from "../types";

export const CONTENT_VERSION_STORAGE_KEY = "secplus.materialVersion";

type Ctx = {
  version: ContentVersion;
  setVersion: (v: ContentVersion) => void;
};

const ContentVersionContext = createContext<Ctx | null>(null);

export function readStoredContentVersion(): ContentVersion {
  try {
    const s = localStorage.getItem(CONTENT_VERSION_STORAGE_KEY);
    return s === "v2" ? "v2" : "v1";
  } catch {
    return "v1";
  }
}

export function ContentVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] =
    useState<ContentVersion>(readStoredContentVersion);

  const setVersion = useCallback((v: ContentVersion) => {
    setVersionState(v);
    try {
      localStorage.setItem(CONTENT_VERSION_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ version, setVersion }), [version, setVersion]);

  return (
    <ContentVersionContext.Provider value={value}>
      {children}
    </ContentVersionContext.Provider>
  );
}

export function useContentVersion(): Ctx {
  const ctx = useContext(ContentVersionContext);
  if (!ctx) {
    throw new Error("useContentVersion must be used within ContentVersionProvider");
  }
  return ctx;
}
