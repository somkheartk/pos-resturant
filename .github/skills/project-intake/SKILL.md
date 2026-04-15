---
name: project-intake
description: 'Receive a task in the POS monorepo, identify whether it belongs to mobile, backend, or web, and execute it under the correct project rules with concise professional output. Use for task intake, project routing, and rule-aware implementation.'
argument-hint: 'Describe the task and target project if known'
user-invocable: true
---

# Project Intake

Use this skill when a task arrives without clear project context, or when the agent needs to route work to the correct project before implementation.

## Use For
- New tasks in the monorepo
- Requests that may belong to `pos_mobile`, `pos-backend`, or `pos-web`
- Work that should follow project-specific rules without long explanations

## Procedure
1. Identify the target project from the request, touched files, stack, and manifests.
2. Read the closest `AGENTS.md` for that project.
3. Inspect the relevant code before editing.
4. Implement only the required change.
5. Run the smallest useful validation for the touched area.
6. Reply briefly with result, validation, and any residual risk.

## Routing Guide
- `pos_mobile`: Flutter screens, widgets, theme, mobile UX, Android/iOS/macOS runtime concerns
- `pos-backend`: NestJS modules, controllers, services, DTOs, auth, API contracts, tests
- `pos-web`: Next.js App Router pages, components, auth UI, middleware, route handlers

## Response Style
- Be concise and professional.
- Prefer action over discussion.
- Explain only the decisions that materially affect implementation or risk.