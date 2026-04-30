# Security+ Exam Sandbox

A Vite + React + TypeScript study tool for the **CompTIA Security+ (SY0-701)** exam.
Everything runs locally in the browser. No backend, no accounts, your study data
stays on your machine via `localStorage`.

## What's inside

- **762 sample questions** parsed from `CompTIA-SY0-701.pdf` (757 standard
  multiple-choice; 5 interactive PBQs are excluded from quizzes but visible in
  data).
- **16 lessons + 44 topics** of study content extracted from the Official
  CompTIA Security+ Student Guide.
- **326-term glossary** with full-text search.
- **Practice mode** with instant feedback, filters (all / by domain / missed /
  unseen), and per-question retry.
- **Timed exam mode** with presets (15 / 45 / 90 / 150 questions), domain
  filters, question navigator, flag-for-review, auto-submit when time runs out,
  and a full review screen with breakdown by domain.
- **Progress dashboard** with mastery by domain, exam history, and a list of
  previously missed questions for targeted review.

## Quick start

```bash
cd exam-app
npm install
npm run dev
```

Then open <http://localhost:5173/>.

## Production build

```bash
npm run build
npm run preview
```

The production bundle is a fully static site you can drop on any static host.

## Project structure

```
exam-app/
├── data/
│   ├── raw/                          # Plain-text dumps from the PDFs (cache)
│   └── screenshots/                  # Smoke-test screenshots
├── scripts/
│   ├── extract-pdf-text.cjs          # PDF → plain text (uses pdf-parse)
│   ├── parse-questions.cjs           # plain text → src/data/questions.json
│   ├── parse-notes.cjs               # plain text → notes.json + glossary.json
│   ├── smoke-test.cjs                # Headless page-load smoke test
│   ├── smoke-test-interactive.cjs    # Headless interactive flow test
│   └── final-screenshots.cjs         # Capture page screenshots
└── src/
    ├── components/
    │   ├── Layout.tsx                # Top bar + footer + outlet
    │   └── QuestionCard.tsx          # Reusable MCQ widget
    ├── data/
    │   ├── questions.json            # 762 parsed questions
    │   ├── notes.json                # 16 lessons w/ topics
    │   └── glossary.json             # 326 glossary entries
    ├── lib/
    │   ├── questions.ts              # Filtering, scoring, helpers
    │   ├── notes.ts                  # Search across lessons + glossary
    │   └── storage.ts                # localStorage wrappers
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── PracticePage.tsx
    │   ├── ExamSetupPage.tsx
    │   ├── ExamRunPage.tsx
    │   ├── ExamReviewPage.tsx
    │   ├── NotesPage.tsx             # Index + search
    │   ├── LessonPage.tsx            # Single-lesson reader
    │   ├── GlossaryPage.tsx
    │   ├── ProgressPage.tsx
    │   └── NotFoundPage.tsx
    ├── App.tsx                       # Router wiring
    ├── main.tsx
    ├── index.css                     # Tailwind directives + tweaks
    └── types.ts
```

## Re-parsing the source PDFs

The JSON data already lives in `src/data/`. If you want to re-extract from the
source PDFs (e.g. after updating them), run:

```bash
# 1. Extract raw text from the PDFs in the parent folder
node scripts/extract-pdf-text.cjs ../CompTIA-SY0-701.pdf data/raw/sample_questions.txt
node scripts/extract-pdf-text.cjs ../Student_Guides.pdf data/raw/student_guides.txt

# 2. Parse text into structured JSON the app consumes
node scripts/parse-questions.cjs
node scripts/parse-notes.cjs
```

## How scoring works

- **Practice mode** — every submission is recorded in
  `localStorage` under `secplus.attempts.v1`. The Progress page aggregates these
  into per-question and per-domain stats. The "Previously missed" filter
  surfaces only questions whose latest attempt was wrong.
- **Exam mode** — a timed session is stored under `secplus.examSession.v1`.
  When the session is submitted (manually or via timer), the score is saved to
  `secplus.examHistory.v1`, where the Progress page reads it. Passing
  threshold is shown at 75% (Security+ scaled passing is 750/900 ~ 83%; 75% is a
  practical practice-test target).

## Notes on parsing

- Questions: 757 / 762 are MCQ-shaped. The 5 outliers are interactive
  Performance-Based Questions (drag-and-drop, click-the-host, etc.) that don't
  map to a single multiple-choice answer. They're kept in the JSON with an
  `error` flag, but excluded from practice and exam modes.
- Lessons / topics: every lesson and every topic title is preserved. The
  paragraphs are reconstructed from PDF line wrapping; some short captions and
  figure descriptions intermingle with body text — that's a known trade-off of
  parsing PDFs without layout info.
- Glossary: 326 of the ~430 terms in the PDF were cleanly separated into
  term + definition pairs. A handful of edge cases share a definition span;
  those are still searchable by term and definition text.

## Privacy

Everything is stored in your browser's `localStorage`:

- `secplus.attempts.v1` — practice attempts (last 5 000)
- `secplus.examSession.v1` — current/latest exam
- `secplus.examHistory.v1` — last 50 exam summaries
- `secplus.practice.settings.v1` — practice page UI preferences

Use the **Reset attempts** / **Clear exam history** buttons on the Progress
page to wipe them.

## Disclaimer

This tool is for personal study. CompTIA®, Security+®, and SY0-701 are
trademarks of CompTIA, Inc. The content is sourced from the publicly
distributed sample question pack and Student Guide. CompTIA does not endorse
this tool.
