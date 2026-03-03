# Repository Guidelines

## Project Structure & Module Organization
The app is a Vite + React + TypeScript JSONL viewer.
- `src/main.tsx`: app bootstrap.
- `src/App.tsx`: top-level page state (upload, filters, pagination, expand/collapse).
- `src/components/`: UI modules such as `DropZone`, `LineList`, `LineItem`, and `JsonTree`.
- `src/lib/jsonl.ts`: JSONL parsing logic.
- `src/**/*.test.tsx` and `src/lib/*.test.ts`: UI and unit tests.
- `src/test/setup.ts`: shared Vitest setup (`jest-dom`, cleanup).
- `public/`: static assets.
- `dist/`: production build output (generated).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server with HMR.
- `npm run build`: run TypeScript project build (`tsc -b`) and bundle via Vite.
- `npm run preview`: preview production bundle locally.
- `npm test`: run Vitest once in `jsdom`.

Use these from repository root, for example:
```bash
npm run dev
npm test
```

## Coding Style & Naming Conventions
- Use TypeScript and React function components.
- Indentation: 2 spaces; semicolons enabled; double quotes in TS/TSX (match existing files).
- Components/types: `PascalCase` (`LineList`, `ParsedLine`).
- Variables/functions: `camelCase` (`expandedLineSet`, `toggleLine`).
- Prefer small, focused modules; keep parser logic in `src/lib`, UI behavior in `src/components`.

## Testing Guidelines
- Framework: Vitest + Testing Library (`@testing-library/react`, `jest-dom`).
- Environment: `jsdom` (`vitest.config.ts`).
- Test files: colocated with source (`App.test.tsx`, `jsonl.test.ts`).
- Cover both happy paths and malformed JSONL/error paths.
- Run `npm test` before opening a PR; add/adjust tests for any behavior change.

## Commit & Pull Request Guidelines
- Follow observed commit style: `feat: ...`, `fix: ...`, `docs: ...` (imperative, concise).
- Keep commits focused; avoid mixing refactor and feature work.
- PRs should include:
  - What changed and why.
  - Test evidence (e.g., `npm test` result).
  - UI screenshots/GIFs for visible changes (filters, tree expand/collapse, fullscreen behavior).
  - Linked issue/ticket when applicable.
