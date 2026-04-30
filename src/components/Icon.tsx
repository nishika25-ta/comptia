import type { ReactElement, SVGProps } from "react";

type IconName =
  | "home"
  | "practice"
  | "exam"
  | "book"
  | "glossary"
  | "progress"
  | "search"
  | "filter"
  | "moon"
  | "sun"
  | "menu"
  | "close"
  | "check"
  | "x"
  | "chevron-right"
  | "chevron-left"
  | "chevron-down"
  | "arrow-right"
  | "shuffle"
  | "timer"
  | "flag"
  | "sparkles"
  | "shield"
  | "target"
  | "lightning"
  | "info"
  | "warning"
  | "play"
  | "pause"
  | "external"
  | "github"
  | "list-bullet";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V9z" />
    </>
  ),
  practice: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  exam: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  glossary: (
    <>
      <path d="M8 3h11a1 1 0 0 1 1 1v17l-6-3-6 3V4a1 1 0 0 1 1-1z" />
      <path d="M4 7v14l4-2" />
    </>
  ),
  progress: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18M6 12h12M10 19h4" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  menu: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  check: (
    <>
      <path d="M20 6 9 17l-5-5" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  "chevron-right": (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  "chevron-left": (
    <>
      <path d="m15 18-6-6 6-6" />
    </>
  ),
  "chevron-down": (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  shuffle: (
    <>
      <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="14" r="8" />
      <path d="M12 10v4l2 2M9 2h6" />
    </>
  ),
  flag: (
    <>
      <path d="M4 22V4M4 4h13l-2 5 2 5H4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6L12 3zM19 14l.9 2.2 2.1.8-2.1.8L19 20l-.9-2.2-2.1-.8 2.1-.8L19 14zM5 16l.7 1.8 1.8.7-1.8.7L5 21l-.7-1.8L2.5 18.5l1.8-.7L5 16z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  lightning: (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2 21h20L12 3z" />
      <path d="M12 10v4M12 18h.01" />
    </>
  ),
  play: (
    <>
      <path d="M5 4v16l14-8L5 4z" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4 10 14M9 5H4v15h15v-5" />
    </>
  ),
  github: (
    <>
      <path d="M9 19c-5 1.5-5-2.5-7-3M15 22v-3.87a3.4 3.4 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 5.77 5.07 5.07 0 0 0 18.91 2S17.73 1.65 15 3.48a13.38 13.38 0 0 0-7 0C5.27 1.65 4.09 2 4.09 2A5.07 5.07 0 0 0 4 5.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.4 3.4 0 0 0 8 19.13V22" />
    </>
  ),
  "list-bullet": (
    <>
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
      <path d="M9 6h12M9 12h12M9 18h12" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
  className = "",
  ...rest
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
