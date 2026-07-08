# Playbook: Turning a PRD into GitHub Issues

Takes an approved PRD and splits it into one tracking epic plus a set of right-sized sub-issues. Repo: **LevCodeX/hospital-queue** — double check with `gh repo view` before creating anything.

**Needs:** a PRD path, e.g. `docs/prd-temp/2026-07-09-queue-sms-reminders.md`

This playbook only plans and (optionally) creates issues — it doesn't touch code.

---

## Kicking one off

```text
Follow docs/workflows/issue.md.

PRD: docs/prd-temp/<date>-<slug>.md
Phase: P0
Action: plan only | create issues
```

Defaults to **plan only**. Only create real GitHub issues when explicitly told to.

Custom-command users: `/issue` (`.claude/commands/issue.md`) wraps this same playbook.

---

## Before starting

- [ ] The PRD's frontmatter has `phase` set
- [ ] No `OPEN-###` row is still marked `open` — go resolve those with the PRD's owner first
- [ ] `gh auth status` succeeds and the default repo is `LevCodeX/hospital-queue`
- [ ] It's clear whether this run is a plan or an actual create

---

## 1. Read the PRD end to end

Pull out:

| From | Feeds into |
| ---- | ---------- |
| Title | The epic's title/theme |
| `phase` | Filters which stories/requirements are in scope this round |
| `STORY-*` / `CHECK-*` | Sub-issue bodies |
| `FR-*` / `NFR-*` | Traceability — `Must` items are what actually gets built this batch |
| Non-goals / any story's "out of scope" | Things to explicitly **not** create issues for |
| Phases table | P1+ work stays out unless someone asks for it |

---

## 2. Split it into an epic + sub-issues

**The epic (one, always)**

- Title: the PRD's title, or `🚀 <area>: <theme>`
- Label: `epic`
- Body: summary + phase + a pointer to the relevant `PROJECT.md` sections + the PRD path
- It tracks the overall outcome — it doesn't restate every acceptance check

**Sub-issues (as many as make sense)**

- Aim for roughly half a day to three days of work each
- Favor a vertical slice a user would actually notice (e.g. "patient can cancel a booked appointment") over a horizontal one (e.g. "add cancel column to appointments table")
- Split further when a story's checks span both frontend and backend, or when an `NFR-*` needs its own dedicated ticket
- Never open a ticket for a non-goal, an out-of-scope line, or something still sitting in `OPEN-###`

**Labels** — one type label per issue, plus whichever area labels apply:

| Issue is about... | Type label |
| ------------------ | ---------- |
| A user-facing slice | `story` |
| Plumbing (tests, config, migrations) | `task` |
| An `NFR-*` around security or performance | `task` + `security`/`perf` if those labels exist |

Area labels — same ones the Trello board uses, so the two stay in sync: `backend`, `frontend`, `database`, `security`, `testing`, `devops`, `documentation`.

Note dependencies inline (`Depends on #…`) or just by creation order.

---

## 3. Show the plan before creating anything

| # | Kind | Type | Title | Labels | Traces to | Depends on |
| - | ---- | ---- | ----- | ------ | --------- | ---------- |
| 0 | Epic | — | … | `epic` | (everything in scope) | — |
| 1 | Sub-issue | 🚀 Feature | … | `story`, `backend` | STORY-001, FR-001, CHECK-001 | — |
| 2 | Sub-issue | 🧪 Tests | … | `task`, `backend` | CHECK-001 | 1 |

**Title shape:** `<emoji> <area>: <what it does, imperative>`

| Kind of change | Emoji |
| --------------- | ----- |
| Feature | 🚀 |
| Improvement | ✨ |
| Fix | 🐛 |
| Refactor | ♻️ |
| Tests | 🧪 |
| Docs | 📝 |
| Chore/config | 🔧 |
| Performance | ⚡ |
| Security | 🔐 |
| Cleanup | 🧹 |

Stop here if the run is **plan only**.

---

## 4. Write the bodies

### Epic

```markdown
## What this is
<one paragraph from the PRD's summary>

## Source PRD
- Path: docs/prd-temp/<date>-<slug>.md
- Phase: P0

## Scope
In: …
Out: …

## Relevant docs
- PROJECT.md sections: <e.g. "API Reference — Queue">

## Sub-issues
<!-- filled in after creation -->
- [ ] #TBD — …
```

### Each sub-issue

```markdown
## What this is
<one paragraph>

## Traces to
- PRD: docs/prd-temp/<date>-<slug>.md
- Epic: #EPIC
- Story: STORY-###
- Requirements: FR-###, NFR-###
- Checks: CHECK-###

## Acceptance checks
- [ ] CHECK-###: …

## Scope
In: …
Out: …

## Test plan
- [ ] …

## Done means
- [ ] Every acceptance check passes
- [ ] PR is linked and CI is green
```

---

## 5. Create the issues

Only after the plan is approved and someone explicitly asked for real issues.

**The epic:**

```bash
gh issue create \
  --repo LevCodeX/hospital-queue \
  --title "🚀 area: theme" \
  --label "epic" \
  --body "$(cat <<'EOF'
<epic body>
EOF
)"
```

Note the epic's number — call it `EPIC` below.

**Each sub-issue:**

```bash
gh issue create \
  --repo LevCodeX/hospital-queue \
  --title "🚀 area: outcome" \
  --label "story" \
  --body "$(cat <<'EOF'
<sub-issue body, referencing #EPIC>
EOF
)"
```

**Link sub-issues back to the epic** — try in this order:

1. `gh issue create --parent EPIC` if the installed `gh` version supports it
2. GraphQL, once every issue exists:

```bash
EPIC_ID=$(gh issue view "$EPIC" --repo LevCodeX/hospital-queue --json id -q .id)
CHILD_ID=$(gh issue view "$CHILD" --repo LevCodeX/hospital-queue --json id -q .id)
gh api graphql -H "GraphQL-Features: sub_issues" -f query='
mutation($epic: ID!, $child: ID!) {
  addSubIssue(input: { issueId: $epic, subIssueId: $child }) {
    issue { number title }
    subIssue { number title }
  }
}' -f epic="$EPIC_ID" -f child="$CHILD_ID"
```

3. Plain REST if GraphQL sub-issues aren't available: `POST /repos/LevCodeX/hospital-queue/issues/{epic_number}/sub_issues` with the child's numeric `id`.

Then edit the epic's body so the **Sub-issues** checklist lists every child by number and title.

Reply with a table: kind, issue number, URL, labels, what it traces to.

---

## Guardrails

- Don't open issues for non-goals, out-of-scope lines, or anything still `OPEN-###`
- Don't invent acceptance checks that aren't in the PRD
- One epic per PRD per run — don't create a second epic for the same PRD later
- Point implementers at `PROJECT.md`, not the PRD, once building starts

---

## Before you call it finished

- [ ] Plan table showed one epic and N sub-issues, and was approved before anything was created
- [ ] The epic links the PRD path, phase, and has the `epic` label
- [ ] Every sub-issue traces to a story/requirement/check and lists the epic number
- [ ] Sub-issues carry both a type label and the right area label(s)
- [ ] Sub-issues are actually linked to the epic (native linking, or the documented fallback)
- [ ] No unresolved open questions were silently skipped
- [ ] The requester has issue URLs and knows which `PROJECT.md` sections to read
