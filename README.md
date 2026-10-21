# TalentLink Specs

Spec-driven development (SDD) specs for the TalentLink360 HR Flutter app
(`~/StudioProjects/talentlink`).

## Where the specs live

| | |
|---|---|
| Repo | `~/work/specs-projects` (one repo, one branch per project) |
| Branch | `talentlink` |
| Folder on disk | `~/work/specs-talentlink` (a git worktree of the `talentlink` branch) |

Open `~/work/specs-talentlink` to work on these specs alongside the other projects' branches.

## Workflow

Each feature lives in `specs/NNN-feature-name/` and has four files:

| File | Purpose |
|---|---|
| `business-requirements.md` | What to build and why: scope, behavior, rules, acceptance criteria. Also the current state of the code (dated snapshot), the architecture constraints, the implementation plan, the task checklist and where work stopped (§12.4). |
| `api-contracts.md` | Every endpoint the feature uses: path, request body, response shape, envelopes, formats and error handling. Built only from confirmed docs and the app code. Anything unknown is marked TBD. |
| `open-questions.md` | Every unresolved business and API question, numbered Q1, Q2 and so on. It is the only place questions are tracked. Answers are recorded here, then folded into the other two files. |
| `changelog.md` | Dated history of spec changes, with the reason, the affected area and the decisions made. |

Rules:
- Don't guess unresolved rules. Write them up in `open-questions.md` and mark them Open or Assumed in code.
- `business-requirements.md` and `api-contracts.md` are the source of truth. If the code and the spec disagree, fix one of them on purpose.
- Never turn an assumption into a confirmed rule without an answer recorded in `open-questions.md`.
- Bump the version and status in `business-requirements.md` whenever the spec changes, and add a `changelog.md` entry.

Day-to-day steps are in [how to use](how%20to%20use).

## Index

| ID | Feature | Version | Status | Start here |
|---|---|---|---|---|
| [001](specs/001-activities/business-requirements.md) | New Activities: Visits & Tasks | v1.2 approved | Waiting on backend Q12–Q14. Q15–Q24 not sent yet. | [§12.4 Where we stopped](specs/001-activities/business-requirements.md#124-where-we-stopped-and-whats-next) |
