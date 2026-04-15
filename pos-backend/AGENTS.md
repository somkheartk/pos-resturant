# POS Backend Guidelines

## Stack

- NestJS 11 with TypeScript, Mongoose, class-validator, and Jest.
- Keep controller, service, DTO, and module responsibilities separate.

## Rules

- Preserve existing API shapes unless the task explicitly requires a contract change.
- Reuse shared constants and helpers under `src/common` and `src/shared` before adding new patterns.
- Keep validation in DTOs and request boundaries, not scattered in controllers.
- When changing API errors, keep compatibility with the shared error format and `errors[]` field support.
- Prefer focused service changes over broad rewrites.

## Validation

- Use targeted checks such as `npm run lint`, `npm test`, or the relevant spec for changed behavior.
