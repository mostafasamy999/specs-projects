# TalentLink Specs
 
Spec-driven development (SDD) specs for the TalentLink360 HR Flutter app
(`~/StudioProjects/talentlink`).

## Workflow

Each feature lives in `specs/NNN-feature-name/` and moves through these files in order:

| File | Purpose |
|---|---|
| `spec.md` | What to build and why: scope, behavior, acceptance criteria. No implementation detail beyond agreed constraints. |
| `current-state.md` | What already exists in the codebase: files, endpoints, and decisions already made. It is a snapshot, so date it. |
| `open-questions.md` | Unresolved business and API rules. Answers get recorded here, then folded into `spec.md`. |
| `plan.md` | Technical plan: layers, files, DI and API mapping. Written once the open questions are resolved. |
| `tasks.md` | Ordered and verifiable implementation tasks derived from `plan.md`. |

Rules:
- Don't guess unresolved rules. Write them up as open questions.
- `spec.md` is the source of truth. If the code and the spec disagree, fix one of them on purpose.
- Bump the spec version and status whenever the spec changes.

## Index

| ID | Feature | Status |
|---|---|---|
| [001](specs/001-new-activities/spec.md) | New Activities: Visits & Tasks | v1.1 approved; waiting on backend Q12–Q14. Start at [NEXT.md](specs/001-new-activities/NEXT.md) |
