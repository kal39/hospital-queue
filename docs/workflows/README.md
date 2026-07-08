# Planning Workflows

Three linked playbooks that take a feature from idea to shipped code. They're written for whoever's driving — a person typing directly, or an AI assistant acting on their behalf.

| Stage | File | Produces |
| ----- | ---- | -------- |
| 1. Define | [prd.md](./prd.md) | A dated PRD under `docs/prd-temp/` |
| 2. Break down | [issue.md](./issue.md) | One epic + sized sub-issues on GitHub |
| 3. Ship | [pr.md](./pr.md) | A pull request linked back to its issue |

Nothing here is Claude-specific — hand any of these three files to another assistant (or read them yourself) and the steps still make sense. `@`-reference them, paste them, or point an agent at the path.
