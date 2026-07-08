# Workflow: PRD

Tool-agnostic instructions for humans and AI assistants (Cursor, Claude, Copilot, ChatGPT, etc.).

**Template:** `docs/prd/0000-00-00-template.md` (do not edit)
**Output:** `docs/prd-temp/YYYY-MM-DD-<kebab-slug>.md` (ISO date prefix for sort order)

Draft PRDs live in `docs/prd-temp/` (agent-visible). The template and archived PRDs live in `docs/prd/`; treat that folder as reference-only, not a place to draft in. Use this workflow only for planning; implement from `PROJECT.md` and the codebase.

---

## How teammates run this

**Any chat UI:** Paste this file (or link to it in the repo) and add:

```text
Follow docs/workflows/prd.md exactly.

Feature: <name>
Outcome: <one line>
Problem: <who / what pain>
MVP scope: <what's in P0>
Out of scope: <optional>
```

**Cursor:** Invoke the `prd` skill (loads this workflow).

**Repo-aware agents:** Point the model at `docs/workflows/prd.md` and `PROJECT.md` (architecture, roles, schema, API reference all live there for this project — there's no separate `docs/core/` split yet).

---

## Inputs

Gather before writing (ask if missing):

- Feature name and one-line outcome
- Problem and who is affected (which role: patient, receptionist, doctor, pharmacist, admin)
- Constraints: which role(s) touch this, phase (MVP vs later)
- Relevant sections of `PROJECT.md` (Roles, Database Schema, API Reference, Status & Roadmap)

---

## Steps

1. Copy `docs/prd/0000-00-00-template.md` → `docs/prd-temp/YYYY-MM-DD-<kebab-slug>.md` (today's date).
2. Do not edit `docs/prd/0000-00-00-template.md`.
3. Fill every section per the table below.
4. Run the checklist at the end before finishing.

---

## Section rules

| Section | Rules |
| ------- | ----- |
| Frontmatter | `status: draft`, owners, `core_docs` list (PROJECT.md sections this touches), `phase: P0` |
| Summary | Concrete outcome, problem, solution, measurable success metric |
| Non-goals | At least one explicit exclusion |
| User stories | `US-###` with testable `AC-###` (Given/When/Then), tagged with the role (patient/doctor/receptionist/pharmacist/admin) |
| Requirements | `REQ-F-*` / `REQ-NF-*`, Must for MVP; trace to US/AC |
| Invariants | Hard rules (role-based access, queue-number ordering, patient data privacy) from `PROJECT.md` |
| UX / flow | Numbered steps; error/empty/permission states if relevant |
| Touchpoints | Short list (Frontend · Backend · DB · …); no implementation design |
| Phases | P0 exit criteria required; P1+ only if scoped |
| Open questions | `Q-*` with `open` — blocking gaps here, not in requirements |

**Grounding:** Use `PROJECT.md` and the code only to name touchpoints and invariants. Do not paste PROJECT.md content wholesale. If code and docs disagree, add a `Q-*` row.

**Do not:** invent shipped behavior, use vague ACs, or close `Q-*` without explicit user confirmation.

---

## GitHub issues

After the PRD is approved, use **[issue.md](./issue.md)** (skill: `issue`). After implementation on a branch, use **[pr.md](./pr.md)** (skill: `pr`).

---

## Handoff to engineering

Tell the requester:

- Path to the new PRD file
- Open `Q-*` that block implementation issues
- Which `PROJECT.md` sections implementers should use (not the PRD)

Coding agents should **not** rely on `docs/prd/` for implementation unless the user attaches a PRD for that task. After approval, move or copy the PRD from `docs/prd-temp/` to `docs/prd/` if you want it archived with other specs.

---

## Checklist

- [ ] Dated file under `docs/prd-temp/`
- [ ] Every Must requirement traces to US/AC
- [ ] Non-goals and invariants present
- [ ] No implementation issues implied for open questions
