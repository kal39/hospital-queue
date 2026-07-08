# Playbook: Opening a Pull Request

Takes whatever's on the current branch, matches it to the GitHub issue it closes, and opens a PR shaped like `.github/PULL_REQUEST_TEMPLATE.md`.

**Needs:** an issue number or URL, and optionally a base branch (defaults to `main`).

---

## Kicking one off

```text
Follow docs/workflows/pr.md.

Issue: #123
Base: main
Action: plan only | create PR
```

Custom-command users: `/pr` (`.claude/commands/pr.md`) wraps this same playbook.

---

## Before starting

- [ ] `gh auth status` is good and the default repo is `LevCodeX/hospital-queue`
- [ ] The branch is already pushed (`git push -u origin HEAD` if not)
- [ ] The branch isn't `main` itself
- [ ] The linked issue is still open (merging the PR is what closes it)
- [ ] It's clear whether this run should just plan, or actually open the PR

---

## 1. Pull context from the issue

```bash
gh issue view <N> --json title,body,number,state,labels
```

Use it for:

| From the issue | Goes into |
| --------------- | --------- |
| Title | The PR title's core wording |
| Body | Summary bullets, the test plan, any `STORY-*`/`FR-*` traceability |
| Labels | A hint at which change type applies |

If it's already closed, stop and check with whoever asked before doing anything else.

---

## 2. Look at what actually changed

```bash
git fetch origin <base>
git diff --stat origin/<base>...HEAD
git diff origin/<base>...HEAD
```

Base the PR description on the real diff (cross-check `PROJECT.md` if a change's intent isn't obvious from the code alone) — don't describe changes that aren't there.

---

## 3. Pick the change type

| Change is... | Emoji |
| ------------- | ----- |
| A fix | 🐛 |
| An improvement | ✨ |
| A refactor | ♻️ |
| A new feature | 🚀 |
| Docs-only | 📝 |
| Tests | 🧪 |
| Config/chore | 🔧 |
| A performance win | ⚡ |
| A security fix | 🔐 |
| Cleanup | 🧹 |

---

## 4. Draft the plan before touching GitHub

| Field | Value |
| ----- | ----- |
| Title | `<emoji> <area>: <what it does>` — plain text, no `**`, no `[]` |
| Base | `main` unless told otherwise |
| Head | the current branch |
| Closes | `#<N>` |

Match the emoji in the title to the one leading the body's first line.

**Body shape** (everything below the horizontal rule gets generated fresh each time):

```markdown
**<emoji> <Type>**: <terse, present-tense, one or two sentences>

<details>
<summary>What changed</summary>

- <one bullet per logical change>
- <test plan, pulled from the issue's acceptance checks if it has any>

</details>

---

<details><summary>Diagram</summary>

<only if a picture actually helps — see below>

</details>

<details><summary>Files touched</summary>

- `path/to/file` — one line on what changed there
- ...

</details>
```

### When to include a diagram

Only draw one if the change introduces spatial/topological structure that isn't already obvious from the code and can't be said faster in a sentence — and keep it to 7 nodes or fewer. If the relationship is sequential, comparative, or already visible in the diff, just write it out instead. When a diagram earns its place, use Mermaid, top-down (`flowchart TD`), fenced in a code block.

### Writing the description

- Present tense, active voice: "Adds a cancel endpoint for booked appointments," not "This PR adds..."
- Skip qualifiers like "probably" or "should" — state what the diff does
- Don't restate the opening line as a bullet underneath it
- Leave out review feedback or anything not actually in this diff
- Trivial change (typo, one config line)? Say so in the plan and skip the diagram section entirely

Stop here if the run is **plan only**.

---

## 5. Open it

Only once the plan's approved and someone explicitly asked for a real PR:

```bash
gh pr create \
  --repo LevCodeX/hospital-queue \
  --base <base> \
  --head "$(git branch --show-current)" \
  --title "<emoji> area: what it does" \
  --body "$(cat <<'EOF'
<full body from step 4>
EOF
)"
```

Make sure `Closes #<N>` (or `Fixes #<N>`) is in there somewhere so merging actually closes the issue.

Reply with the PR URL and one line summarizing it.

---

## Guardrails

- Never open a PR straight from `main` unless someone specifically asked for that
- Don't force-push or amend history unless told to
- The PRD is planning material, not a spec — build from `PROJECT.md` and the issue, not the PRD
- Never paste a token, key, or credential into a PR body

---

## Before you call it finished

- [ ] The plan was shown and approved before creating anything
- [ ] Title and body follow `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] The test plan reflects the issue's checks, or is backed by the actual diff
- [ ] `Closes #<N>` is present
- [ ] The requester has the PR URL
