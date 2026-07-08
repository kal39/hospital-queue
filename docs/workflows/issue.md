# Workflow: Issue (PRD → parent + sub-issues)

Create **one parent issue** that references the PRD, then **sub-issues** decomposed from the PRD with appropriate labels. Target repo: **LevCodeX/hospital-queue** (confirm with `gh repo view`).

**Input:** path to a PRD under `docs/prd-temp/` or `docs/prd/` (e.g. `docs/prd-temp/2026-07-08-sms-reminders.md`)

Prefer `docs/prd-temp/` for drafts created by the PRD workflow; `docs/prd/` holds the template plus approved/archived PRDs. This workflow is planning-only.

---

## How teammates run this

**Any chat UI:** Attach or paste the PRD, plus this file, and:

```text
Follow docs/workflows/issue.md.

PRD: docs/prd/YYYY-MM-DD-<slug>.md
Phase: P0
Action: plan only | create issues
```

**Cursor:** Invoke the `issue` skill.

**CLI (after plan is approved):** use the `gh issue create` commands the agent outputs, or ask the agent to run them with network permission.

---

## Prerequisites

- [ ] PRD exists and frontmatter `phase` is set
- [ ] No **Open questions** rows with `open` (stop and resolve with author first)
- [ ] `gh` authenticated (`gh auth status`) and default repo is `LevCodeX/hospital-queue`
- [ ] User chose **plan only** or **create issues**

---

## Step 1 — Parse PRD

Read the full PRD. Extract:

| Source | Use for |
| ------ | ------- |
| Title (`# …`) | Parent issue title and theme |
| `phase` in frontmatter | Only include requirements/stories for that phase unless user overrides |
| `US-*` / `AC-*` | Sub-issue bodies and AC checklists |
| `REQ-*` | Traceability; Must = required in this batch |
| **Non-goals** / story "Out of scope" | Never create issues |
| **Phases** table | Defer P1+ unless user asked |

---

## Step 2 — Decompose into parent + sub-issues

**Parent issue (exactly one)**

- Title: PRD title or `🚀 <Area>: <feature theme>` (emoji optional on parent)
- Label: **`epic`**
- Body: feature summary, phase, links to relevant `PROJECT.md` sections, and **PRD path** (see parent body template below)
- Does **not** duplicate every AC; it tracks overall outcome and lists sub-issues after creation

**Sub-issues (one or more)**

- **Sizing:** each sub-issue ≈ 0.5–3 days for one engineer
- **Prefer vertical slices** (shippable user outcome). Avoid layer-only tickets unless tiny
- **Split** when multiple `US-*` deliver independently, AC sets span Frontend + Backend, or `REQ-NF-*` stands alone
- **Do not** create sub-issues for **Non-goals**, out-of-scope lines, or open **Q-***

**Sub-issue labels** (create in GitHub if missing; apply one primary type per issue):

| Sub-issue role | Label |
| -------------- | ----- |
| User-story slice | `story` |
| Engineering task (tests, migrations, config) | `task` |
| Security / perf from `REQ-NF-*` | `task` (add `security` or `perf` if those labels exist) |

**Area labels** — mirror the Trello board's categories, apply whichever apply: `backend`, `frontend`, `database`, `security`, `testing`, `devops`, `documentation`.

**Dependencies:** note in sub-issue body (`Depends on #…`) or creation order; link blocked-by relationships only when the repo supports them.

---

## Step 3 — Plan (always, before create)

Output a table for user approval:

| # | Role | Type | Title | Labels | US / REQ / AC | Depends |
| - | ---- | ---- | ----- | ------ | ------------- | ------- |
| 0 | Parent | Epic | … | `epic` | (all US/REQ in scope) | — |
| 1 | Sub | 🚀 Feature | … | `story`, `backend` | US-001, REQ-F-001, AC-001–002 | — |
| 2 | Sub | 🧪 Test | … | `task`, `backend` | AC-001 | 1 |

**Sub-issue title format:** `<emoji> <Area>: <imperative outcome>` (same types as [pr.md](./pr.md)):

| Type | Emoji |
| ---- | ----- |
| Feature | 🚀 |
| Enhancement | ✨ |
| Bug | 🦠 |
| Refactor | ♻️ |
| Test | 🧪 |
| Docs | 📝 |
| Config | 🔧 |
| Perf | ⚡ |
| Security | 🔒 |
| Cleanup | 🧹 |

If **plan only**, stop here.

---

## Step 4 — Issue bodies

### Parent (epic) body

```markdown
## Summary
<one paragraph from PRD>

## PRD
- **Path:** docs/prd/YYYY-MM-DD-<slug>.md
- **Phase:** P0

## Scope (this epic)
**In**
- …

**Out**
- …

## Engineering context
- Relevant PROJECT.md sections: <e.g. "API Reference — Appointments", "Database Schema — queue_tickets">

## Sub-issues
<!-- Fill after creation -->
- [ ] #TBD — …
```

### Sub-issue body

Use this body for every sub-issue (fill from PRD):

```markdown
## Summary
<one paragraph>

## Traceability
- PRD: docs/prd/YYYY-MM-DD-<slug>.md
- Parent: #PARENT
- User story: US-###
- Requirements: REQ-F-###, REQ-NF-###
- Acceptance: AC-###

## Acceptance criteria
- [ ] AC-###: …

## Scope
**In**
- …

**Out**
- …

## Test plan
- [ ] …

## Definition of done
- [ ] Acceptance criteria met
- [ ] PR linked; CI green
```

Pull **In/Out** from PRD non-goals and story out-of-scope. Add **Test plan** from AC and `REQ-NF-*`.

---

## Step 5 — Create on GitHub

Run only after the user approves the plan and asked to **create issues**.

### 5a — Parent epic

```bash
gh issue create \
  --repo LevCodeX/hospital-queue \
  --title "🚀 Area: feature theme" \
  --label "epic" \
  --body "$(cat <<'EOF'
<paste parent body>
EOF
)"
```

Capture the parent issue number (`PARENT`).

### 5b — Sub-issues

```bash
gh issue create \
  --repo LevCodeX/hospital-queue \
  --title "🚀 Area: outcome" \
  --label "story" \
  --body "$(cat <<'EOF'
<paste sub-issue body with Parent: #PARENT>
EOF
)"
```

Use `--label "task"` (and optional area labels) per the plan table.

### 5c — Link sub-issues to parent

Prefer native sub-issue linking (try in order):

1. **`gh issue create --parent PARENT`** (when your `gh` version supports it)
2. **GraphQL** (after all issues exist):

```bash
PARENT_ID=$(gh issue view "$PARENT" --repo LevCodeX/hospital-queue --json id -q .id)
CHILD_ID=$(gh issue view "$CHILD" --repo LevCodeX/hospital-queue --json id -q .id)
gh api graphql -H "GraphQL-Features: sub_issues" -f query='
mutation($parent: ID!, $child: ID!) {
  addSubIssue(input: { issueId: $parent, subIssueId: $child }) {
    issue { number title }
    subIssue { number title }
  }
}' -f parent="$PARENT_ID" -f child="$CHILD_ID"
```

3. **REST** (if GraphQL is unavailable): `POST /repos/{owner}/{repo}/issues/{parent_number}/sub_issues` with `sub_issue_id` set to the child issue's numeric REST `id` (from `gh api repos/LevCodeX/hospital-queue/issues/CHILD`).

Repeat linking for each sub-issue.

### 5d — Update parent checklist

Edit the parent issue body so **Sub-issues** lists each child (`#NNN — title`).

After creation, reply with:

| Role | Issue | URL | Labels | Traces |
| ---- | ----- | --- | ------ | ------ |
| Parent | #PPP | … | epic | PRD path |
| Sub | #NNN | … | story, backend | US-001, AC-001 |

---

## Do not

- Create issues for **Non-goals**, out-of-scope lines, or open **Q-***
- Invent AC or requirements not in the PRD
- Create multiple parent/epic issues for one PRD in a single run (one parent per PRD batch)
- Use the PRD as implementation truth (point implementers to `PROJECT.md`)

---

## Checklist

- [ ] Plan table shows one parent and N sub-issues; user approved (if creating)
- [ ] Parent references PRD path and phase; label `epic` applied
- [ ] Every sub-issue traces to `US-*` / `AC-*` / `REQ-*` and lists parent `#PARENT`
- [ ] Sub-issues have appropriate `story` / `task` and area labels
- [ ] Sub-issues linked to parent via GitHub sub-issues (or documented fallback)
- [ ] Open questions were empty or explicitly waived by user
- [ ] User has issue URLs and linked `PROJECT.md` sections for engineering handoff
