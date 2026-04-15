---
name: Take POS Task
description: "Use when you want the agent to take a task in this POS monorepo, route it to the correct project, and execute it concisely under project rules."
argument-hint: "Describe the task and target project if known"
agent: pos-project-executor
---
Handle the user's task end-to-end in this POS monorepo.

- First identify the target project: `pos_mobile`, `pos-backend`, or `pos-web`.
- Read and follow the closest `AGENTS.md` before editing.
- Inspect existing code before proposing or making changes.
- Keep changes focused and professional.
- Keep communication concise.
- Validate the touched area with the smallest useful check.