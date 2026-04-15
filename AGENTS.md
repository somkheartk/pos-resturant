# POS Monorepo Guidelines

## Scope

- Identify the target project first: `pos_mobile`, `pos-backend`, or `pos-web`.
- Follow the closest `AGENTS.md`. Nested project rules override this file.
- Change only the project required by the task unless the request clearly spans multiple projects.

## Working Style

- Be direct, concise, and action-first.
- Inspect the relevant files and manifest before editing.
- Prefer the smallest complete change that fixes the root problem.
- Avoid speculative refactors and avoid touching unrelated areas.

## Validation

- Run the smallest useful validation for the touched project.
- Report what changed, how it was checked, and any remaining risk briefly.
