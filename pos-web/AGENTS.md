<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## POS Web Guidelines

## Stack

- Next.js 15 App Router with TypeScript, React 18, Tailwind 4, and NextAuth.
- Prefer server-first patterns and keep route logic aligned with App Router conventions.

## Rules

- Confirm framework-sensitive behavior against the local Next.js docs before editing routing, data fetching, caching, middleware, or auth flows.
- Keep components focused. Do not move server concerns into client components without a reason.
- Follow the existing folder split under `app`, `components`, `lib`, and `types`.
- Preserve auth behavior and existing typing when changing login, dashboard, or API routes.
- Keep UI output concise and intentional; avoid generic boilerplate layouts.

## Validation

- Prefer targeted checks such as `npm run lint` and the smallest useful build or route verification.
- Keep validation scoped to the changed route, page, component, or auth flow.
