# Playbook: Writing a PRD

Turns a rough feature idea into a structured spec that an engineer (or another agent) can size and build from. Works the same in a chat window, an editor sidebar, or a CLI agent.

**Start from:** `docs/prd/0000-00-00-template.md` — copy it, never edit the template in place.
**Land in:** `docs/prd-temp/YYYY-MM-DD-<slug>.md` (date-prefixed so the folder sorts chronologically).

`docs/prd-temp/` is where drafts live while they're being worked on. Once a PRD is approved it can move to `docs/prd/` for long-term reference. Neither folder is where implementation detail lives — that's `PROJECT.md` and the code itself.

---

## Kicking one off

Give whoever/whatever is running this workflow the following, filled in:

```text
Follow docs/workflows/prd.md.

Feature: <name>
Outcome: <the one-line "why this matters">
Problem: <who hurts, and how>
MVP scope: <what ships in P0>
Out of scope: <optional — what's explicitly deferred>
```

If running this through an agent that supports custom commands, `/prd` (see `.claude/commands/prd.md`) does the same thing.

---

## Before writing anything

Make sure you actually have:

- A feature name and a one-sentence outcome
- The affected role(s) — this project has five: `patient`, `receptionist`, `doctor`, `pharmacist`, `admin`
- Whether this is P0 (now) or a later phase
- The relevant slice of `PROJECT.md` — schema tables, existing endpoints, roles table — so the PRD doesn't contradict what's already built

If any of the above is missing, ask before drafting.

---

## The actual steps

1. Copy the template to `docs/prd-temp/<today's date>-<slug>.md`.
2. Work through every section (see the table below for what belongs where).
3. Walk the checklist at the bottom before calling it done.
4. Hand off (see "When it's done" below).

---

## What goes where

| Section | What it needs |
| ------- | -------------- |
| Frontmatter | `status: draft`, an owner, `phase: P0`, and a `reference_docs` list pointing at the relevant `PROJECT.md` headings |
| Summary | The outcome, the problem, the proposed solution, and one metric that proves it worked |
| Non-goals | Say what this explicitly does *not* cover — at least one line |
| User stories | `STORY-001`, `STORY-002`, … each tagged with the role it's for, each with a `CHECK-###` acceptance test written as Given/When/Then |
| Requirements | `FR-###` (functional) and `NFR-###` (non-functional — perf, security, etc.), each marked Must/Should, each tracing back to a story |
| Invariants | Things that must never break: role-based access boundaries, queue-number ordering, patient-data handling |
| Flow | Numbered walk-through of the UX, including error/empty states where relevant |
| Touchpoints | One line each for Frontend / Backend / DB — just enough to scope the issues later, not a design doc |
| Phases | What "done" means for P0, and what's explicitly pushed to P1 |
| Open questions | `OPEN-###` rows — anything still unresolved goes here, not buried in a requirement |

Pull facts from `PROJECT.md` and the codebase, but don't paste chunks of it wholesale — reference it. If the code contradicts the docs, raise an `OPEN-###` instead of guessing which one is right.

**Don't:** describe behavior that doesn't exist yet as if it does, write an acceptance check that isn't actually testable, or mark an `OPEN-###` resolved without the person who owns the feature confirming it.

---

## When it's done

Move to **[issue.md](./issue.md)** to turn the PRD into GitHub issues. Once code lands on a branch, **[pr.md](./pr.md)** opens the pull request.

Tell whoever asked for this:

- Where the PRD file lives
- Any `OPEN-###` rows that would block someone from starting implementation
- Which `PROJECT.md` sections an implementer should actually read (not the PRD itself — it's a planning artifact, not a spec to code against)

---

## Before you call it finished

- [ ] File is under `docs/prd-temp/` with today's date in the name
- [ ] Every `Must` requirement traces to a story and a check
- [ ] Non-goals and invariants are both filled in
- [ ] No open question is quietly implying an implementation decision
