# POS Mobile Guidelines

## Stack

- Flutter Material 3 application for phone-first POS workflows.
- UI code lives under `lib/screens`, shared logic under `lib/core`, `lib/services`, `lib/models`, and `lib/widgets`.

## Rules

- Prioritize mobile-first layout, clear hierarchy, and no overflow on small screens.
- Keep customer-facing copy concise and consistent. Prefer Thai where the surrounding UI is Thai.
- Reuse existing models and services before introducing new state patterns.
- Avoid runtime dependencies for core UI that can fail in restricted networks.
- Keep visual changes intentional; do not add decorative complexity without UX value.

## Validation

- Prefer targeted diagnostics on edited files and run Flutter checks when practical.
