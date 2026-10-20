# Specs

Spec-driven development (SDD) specs for my apps.

## Workflow

Each feature or app lives in `specs/NNN-name/` and moves through these files in order:

| File | Purpose |
|---|---|
| `spec.md` | What to build and why: scope, behavior, acceptance criteria. No implementation detail beyond agreed constraints. |
| `current-state.md` | What already exists in the codebase: files, contracts, and decisions already made. It is a snapshot, so date it. |
| `review.md` | (Optional) Findings from a code review, with severity and confidence. They feed into `plan.md`. |
| `open-questions.md` | Unresolved product and technical rules. Answers get recorded here, then folded into `spec.md`. |
| `plan.md` | Technical plan: work packages, files, constraints. |
| `tasks.md` | Ordered and verifiable implementation tasks derived from `plan.md`. |
| `NEXT.md` | Where to pick up next, plus a ready-to-paste prompt for a coding session. |

Rules:
- Don't guess unresolved rules. Write them up as open questions.
- `spec.md` is the source of truth. If the code and the spec disagree, fix one of them on purpose.
- Bump the spec version and status whenever the spec changes.
- Commit with messages like `spec(001): resolve Q1 max length`.

## Index

| ID | Project | App path | Status |
|---|---|---|---|
| [001](specs/001-mute-video/spec.md) | Mute Video: remove sound or music from a video | `~/StudioProjects/mute-music-app` | v1.0 baseline and review done, Q1–Q8 open. Start at [NEXT.md](specs/001-mute-video/NEXT.md) |
