# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# Next.js Rules

This project uses the latest version of Next.js.

Do not assume APIs, conventions, routing behavior, or project structure from previous Next.js versions.

Before implementing features or modifying architecture:

* Read the relevant documentation in `node_modules/next/dist/docs/`.
* Follow current App Router conventions.
* Prefer Server Components unless there is a clear need for client-side interactivity.
* Use Client Components only when required.
* Respect Next.js deprecation warnings.

<!-- END:nextjs-agent-rules -->

# Project Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* React Query
* Axios
* NextAuth

Backend:

* Django REST Framework
* JWT Authentication
* PostgreSQL

# Folder Structure

This project does NOT use a `src` directory.

Project structure:

* app/
* hooks/
* lib/
* providers/
* public/
* types/
* utils/

Always follow the existing project structure.

Do not create a `src` directory.
Do not move files into a `src` directory.

# Architecture Rules

* Use App Router exclusively.
* Route pages belong in `app/`.
* API clients and external integrations belong in `lib/`.
* Shared TypeScript interfaces belong in `types/`.
* Custom hooks belong in `hooks/`.
* React providers belong in `providers/`.
* Static assets belong in `public/`.
* Reuse existing patterns before introducing new architecture.

Before creating files:

1. Inspect the existing project structure.
2. Reuse existing patterns.
3. Prefer extending current folders over creating new ones.
4. Avoid unnecessary abstractions.

# TypeScript Rules

* Prefer proper typing.
* Avoid unnecessary use of `any`.
* Reuse existing interfaces whenever possible.
* Use interfaces for API contracts.
* Use explicit return types when they improve readability.
* Keep types simple and maintainable.

# Component Rules

* Use functional components only.
* Use PascalCase for component names.
* Keep components focused and reusable.
* Extract repeated UI into shared components when appropriate.
* Prefer composition over deeply nested components.

# API Rules

* Use Axios exclusively.
* Do not use fetch unless explicitly requested.
* API logic belongs in `lib/`.
* Never place API calls directly inside UI components.
* Centralize Axios configuration.
* Reuse existing API helpers and clients.

# React Query Rules

* Use React Query for server state.
* Keep query keys consistent.
* Invalidate queries after mutations when appropriate.
* Avoid duplicating server state with local state.
* Prefer React Query over manual loading and error management.

# Styling Rules

* Use Tailwind CSS exclusively.
* Prefer Tailwind utility classes.
* Avoid inline styles.
* Avoid CSS Modules unless explicitly requested.
* Avoid creating custom CSS files unless necessary.
* Use responsive design by default.
* Follow existing spacing and layout patterns.
* Reuse existing Tailwind utility patterns.
* Use Tailwind best practices for maintainability.

# Forms

* Use native HTML forms.
* Use FormData when submitting forms.
* Do not introduce React Hook Form unless explicitly requested.
* Do not introduce Formik unless explicitly requested.
* Do not introduce Zod unless explicitly requested.
* Keep form state simple using useState when necessary.
* Follow existing project patterns for form handling.

Preferred pattern:

const formData = new FormData();

formData.append("name", values.name);
formData.append("email", values.email);

await api.post("/users", formData);

# Authentication

* Use NextAuth for authentication.
* Keep authentication logic separated from presentation logic.
* Protect private routes appropriately.
* Reuse existing authentication patterns before creating new ones.

# Import Rules

* Prefer absolute imports when configured.
* Reuse existing utilities before creating new ones.
* Reuse existing hooks before creating similar logic.
* Avoid duplicate helper functions.

# Code Quality

* Prioritize readability over cleverness.
* Keep functions small and focused.
* Avoid duplicated logic.
* Follow existing project conventions.
* Prefer simple solutions over complex abstractions.
* Write maintainable code that is easy to understand.

# Agent Behavior

Before generating code:

1. Read AGENTS.md.
2. Read CLAUDE.md if present.
3. Analyze the current project structure.
4. Follow existing conventions before introducing new patterns.
5. Reuse existing code whenever possible.

When uncertain:

* Analyze the codebase first.
* Follow current project conventions.
* Ask for clarification instead of making assumptions.

Change safety rules:

* Do not revert, restore, delete, or overwrite files unless the user explicitly asks for that exact action.
* Do not use broad Git commands such as `git restore`, `git checkout`, `git reset`, or similar commands across multiple files without user confirmation.
* When the user asks to undo a change, identify the specific file and exact change first, then confirm before applying it if there is any chance of touching unrelated work.
* If a requested change could affect multiple files, existing user work, or work from another collaborator, ask for confirmation before editing.
* When uncertain about the intended scope, ask a clarifying question instead of making a broad assumption.
* Prefer small, targeted patches over broad restores or rewrites.
