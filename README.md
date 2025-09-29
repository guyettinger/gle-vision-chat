# gle-vision-chat

A simple, fast vision chat app. Ask a question and analyze up to 4 images per message using OpenAI via ai-sdk.

## Quick start

- Install: `npm install`
- Dev server: `npm run dev` → http://localhost:3000
- Build/Run: `npm run build` then `npm start`

Environment

- Set `OPENAI_API_KEY` for server-side AI calls.

## What’s inside

- Next.js 15 (App Router), React 19, TypeScript (strict), Turbopack
- Tailwind CSS v4, shadcn/ui patterns
- React Query for async state
- zod for validation
- ai + @ai-sdk/openai for models
- Jest + ts-jest for tests

## Common scripts

- Tests: `npm test`
- Lint: `npm run lint`
- Format (write/check): `npm run format` / `npm run format:check`

## Contributing

Keep components small, validate API inputs/outputs with zod, surface user-friendly errors, and keep the UI accessible (aria-labels, role="alert", keyboard support).

## Learn more

For detailed guidelines (project structure, patterns, and checklists), see:

- .junie/guidelines.md
