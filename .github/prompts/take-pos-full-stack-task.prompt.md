---
name: Take POS Full Stack Task
description: "Use when the task spans more than one POS project, such as web plus backend, mobile plus backend, or any cross-project contract change that must stay aligned end-to-end."
argument-hint: "Describe the cross-project task and affected projects"
agent: pos-project-executor
---
Handle the user's task end-to-end for a cross-project change in this POS monorepo.

- First identify all affected projects: `pos_mobile`, `pos-backend`, and/or `pos-web`.
- Read and follow the closest `AGENTS.md` for each touched project before editing.
- Define the dependency order before changing code. Prefer backend or contract changes first, then consuming frontend or mobile changes.
- Keep the scope explicit. Do not touch an extra project unless the task truly requires it.
- Keep communication concise, but report results per touched project.
- Validate each touched project with the smallest useful check.