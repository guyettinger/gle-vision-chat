Project guidelines for gle-vision-chat

Purpose

- Vision chat app built with Next.js App Router that analyzes up to 4 images per question using OpenAI via ai-sdk. Keep UX simple and responsive.

Tech stack

- Runtime: Next.js 15 (App Router), React 19, TypeScript (strict), Turbopack.
- Styling: Tailwind CSS v4 with CSS variables, shadcn/ui patterns (see components/ui).
- State/data: @tanstack/react-query for mutations and caching.
- Validation: zod for request/response schemas.
- AI: ai and @ai-sdk/openai with OpenAI models.
- Testing: Jest + ts-jest.
- Lint/format: ESLint (next/core-web-vitals + TS) and Prettier (+ tailwind + organize-imports plugins).

Project structure

- src/app: Next.js routes, API handlers, global styles.
  - app/api/analyses/route.ts: POST endpoint for image analysis.
  - app/globals.css: Tailwind and theme tokens.
  - app/page.tsx: Main client UI.
- src/components: Reusable components (Header, MessagesList, Theme components).
  - components/ui: Low-level primitives with shadcn/ui style.
  - components/Providers: App-level providers (Theme, React Query).
- src/hooks: Reusable hooks (useAnalysis, useWindowDropzone).
- src/lib: Small utilities (errors, files, utils [cn]).
- src/services: External services and configuration.
  - services/openai: AI integration (analyzeImages).
  - services/config: Env and config access.
- tests: Co-located under feature folders (e.g., src/app/api/analyses/\_tests).
- Absolute imports: Use @/\* path alias (configured in tsconfig.json and jest.config.ts).

Getting started

- Install: npm install
- Develop: npm run dev (http://localhost:3000)
- Build: npm run build; Run: npm start
- Environment: Set OPENAI_API_KEY for any server-side AI calls.

Testing

- Run all: npm test
- Watch/specific: npx jest src/app/api/analyses/\_tests/route.test.ts
- Pattern: Co-locate tests under \_tests next to the code. Use jest.mock to isolate external services (see analyzeImages mocks in route tests).

Linting & formatting

- Lint: npm run lint (uses Flat config + next/core-web-vitals).
- Format write/check: npm run format / npm run format:check
- Conventions:
  - Keep TypeScript strict. Prefer explicit types at public boundaries; rely on inference internally.
  - Organize imports and keep Tailwind classes sorted; Prettier plugins handle both.

Coding conventions

- UI:
  - Use Tailwind classes and the cn() helper for conditional classNames.
  - Prefer Next.js <Image> for static assets; plain <img> is acceptable for dynamic data URLs (as used in page.tsx and MessagesList).
  - Keep components small and focused; colocate small UI primitives under components/ui.
- State & async:
  - For server calls, create typed hooks with React Query useMutation/useQuery as applicable.
  - Reflect pending/error states in UI; avoid throwing from components.
- Validation & types:
  - Validate all API inputs/outputs with zod schemas. Export types via z.infer for reuse in client code.
- Errors:
  - Use isErrorWithMessage type guard to surface user-friendly messages. Log unexpected errors on the server.
- Files & uploads:
  - Use readFileAsDataUrl for client-side base64 previews. Enforce limits (max 4 images) both client and server.

API guidelines

- Endpoints live under src/app/api/<name>/route.ts using Next.js Request/Response.
- Parse body with req.json(), validate with zod, return NextResponse.json.
- Services (OpenAI, etc.) go in src/services and should not depend on Next.js modules so they can be unit-tested.

Adding features

- Create feature-specific components and hooks under components/ and hooks/.
- Add schemas/types near the API route or in a shared module if reused broadly.
- Write tests co-located under \_tests with Jest and ts-jest. Mock external services.

Accessibility & UX

- Provide aria-labels for interactive controls and role="alert" for error messages.
- Preserve keyboard interactions (Enter to submit), and show loading states.

Security

- Never commit secrets. Read keys from process.env (see services/config/config.ts). Use server-only env in API routes.

Commit message style

- Free-form messages

Branch naming

- Use any descriptive branch name

Pre-commit hooks

- No pre-commit hooks; rely on CI/manual

Review checklist (PRs)

- [ ] All tests pass (npm test)
- [ ] Lint and format pass (npm run lint && npm run format:check)
- [ ] Types are correct; zod schemas validate external boundaries
- [ ] No uncaught promise rejections; user-facing errors are handled
- [ ] UI responsive and accessible for main flows
