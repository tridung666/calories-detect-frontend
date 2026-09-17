# Frontend Rules

## General Principles

- Follow Feature-Based Architecture.
- Keep components small and reusable.
- Prefer readability over clever code.
- Write code for maintainability.

---

## React

Always use:

- Functional Components
- Hooks
- TypeScript
- Named Exports
- Arrow Functions

Never use:

- Class Components
- any
- Inline CSS

---

## Folder Rules

Business logic belongs inside feature folders.

Shared UI belongs inside:

components/ui

Reusable layout belongs inside:

components/layout

---

## Components

A component should have only one responsibility.

If a component exceeds roughly 200 lines,
split it into multiple smaller components.

---

## Hooks

Business logic should be extracted into custom hooks.

Examples:

- useFoods
- useMeals
- useProfile

---

## Imports

Prefer absolute imports if configured.

Group imports:

1. React
2. Third-party libraries
3. Internal modules
4. Styles

---

## State Management

Server state:

- TanStack Query

Client state:

- Zustand (if introduced later)

Do not duplicate server state inside client state.

---

## API

Never call Axios directly inside UI components.

API belongs in:

features/**/api

---

## Error Handling

Every page should support:

- Loading
- Empty State
- Error State

---

## Performance

- Lazy load pages.
- Avoid unnecessary renders.
- Memoize only when beneficial.

---

## Internationalization

- Keep user-facing copy in `src/locales/<language>/<namespace>.json`.
- Use `useTranslation` with explicit namespaces in components and `i18n.t` at call
  time outside React. Never resolve translations at module initialization.
- Use interpolation and pluralization instead of concatenating sentences.
- Store typed translation keys in Zod validation messages; shared form fields
  translate them when rendering.
- Use locale-aware date and number helpers without changing API data formats.
- Follow [the localization guide](./i18n.md) when adding copy or languages.
