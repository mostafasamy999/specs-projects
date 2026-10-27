# 001 New Activities: Changelog

Newest first. Each entry gives the date, what changed, why, the affected area and the decisions made. Entries before 2026-10-21 come from the specs repo's git history (branch `talentlink`). Only what the commits show is recorded.

For a new entry, copy this template:

```
## YYYY-MM-DD — vX.Y — <short title>
- **Change:** …
- **Reason:** …
- **Affected area:** business-requirements §… / api-contracts §… / open-questions Q…
- **Decisions:** …
```

---

## 2026-10-27 — QA review v1.3 (no requirement change) — More gaps and test cases

- **Change:** updated the QA review and renamed it from `qa/qa-review-v1.2.md` to `qa/qa-review-v1.3.md`.
  - Corrected QF-09, FLT-04, FLT-21 and the smoke-suite count.
  - Added gaps G-32 to G-57 (57 in total, 11 critical).
  - Added 45 test cases (236 in total, 46 P0).
  - Added the matching coverage rows, questions 31–56 and the v1.3 regression passes (including a cross-screen pass) and test data.
- **Added Q25** to `open-questions.md` (also noted in business-requirements §13): when the user selects Main in the list and goes to the dashboard, the dashboard counts can't match the Main list. Main uses `GetVisitAndTaskList` (master activities), and the dashboard request has no Main field. This is QA gap G-50, marked Critical. The team flagged it as a business issue.
- **Added Q26–Q28** from a cross-screen pass that walked each filter through the list, Main, dashboard, picker and details:
  - Q26 (G-51, Critical): the dashboard can't follow Priority or Search.
  - Q27 (G-52): the Main list can't filter by execution type.
  - Q28 (G-55): the list endpoint may return only the logged-in user's activities under My team and All.
  - The same pass also produced G-53, G-54, G-56 and G-57 (QA only, no numbered question yet).
- **Test run R1** (Android emulator, development build, Team Leader test account), recorded in QA review §7:
  - G-01 is partly settled: My activities sends the user's own IDs, so api-contracts §1.7 is wrong. It isn't closed, because no account with a team was available.
  - G-02 failed: Private only returns public activities (DEF-01).
  - Also raised: All sends empty ID lists (DEF-02), the Team Leader gets no team (DEF-03), the default range ends at 23:59:00 (DEF-04), and the home week strip repeats Thursday (DEF-05).
  - Previous still ends at yesterday 00:00, so WP1 isn't fixed on `enhance/activities` (DEF-06).
  - Current/Previous follow the device time zone: at UTC−12, a 25 Oct task fell out of both lists (DEF-07, G-03).
  - New gap G-58: the list opens on an undocumented 7-day range.
- **Reason:** a second review against business-requirements v1.2 and api-contracts v1.2 found scenarios the first review missed.
- **Affected area:** `qa/qa-review-v1.3.md`, `open-questions.md` (Q25–Q28), business-requirements §13 (summary line only). No requirement and no API contract changed.
- **Decisions:**
  - The spec stays at v1.2, because no requirement changed.
  - Q25 is recorded as Open, waiting for a product decision. The options are: the backend adds a Main flag or master-level counts to the dashboard; the dashboard ignores Main and says what it counts; or Main is cleared on return to the dashboard.
  - Q26–Q28 are recorded as Open the same way.
  - The other new gaps aren't numbered questions yet. If the product owner or backend confirms them, they move to `open-questions.md` as Q29+.
  - The most urgent new gap is G-35: edit always sends `attachments = []`, `null` address and contact, and the logged-in `companyId`, so editing an activity may delete or move its data.

## 2026-10-21 — v1.2 — Visit is the default type on Add Activity

- **Change:** a new activity now starts as a Visit (it used to start as a Task). The Add Activity toggle shows Visit at the start and Task at the end.
- **Reason:** requested by the user, to make Visit the default on the Add Activity screen.
- **Affected area:** business-requirements §5.3 and §12.3 (T10.1–T10.3). App code: `new_activity_selection.dart` (default type) and `new_activity_type_switch_widget.dart` (toggle order).
- **Decisions:** only the toggle's order changed. The `NewActivityType` enum order is unchanged, so the list's type filter and `fromId` are unaffected. Editing still shows the saved type, locked. No API change.

## 2026-10-21 — v1.1 (no requirement change) — Consolidate the spec files

- **Change:** merged six files into four:

  | Old file | Moved to |
  |---|---|
  | `spec.md` | `business-requirements.md` §1–§11. The API section went to `api-contracts.md`. The original open questions are recorded below in the 2026-10-18 entry. |
  | `current-state.md` | `business-requirements.md` §4. The endpoint table went to `api-contracts.md` §2. |
  | `plan.md` | `business-requirements.md` §9.2 (constraints), §9.3 (WP3 decision) and §12.1–§12.2 |
  | `tasks.md` | `business-requirements.md` §12.3, with the ticks kept |
  | `NEXT.md` | `business-requirements.md` §12.4. The session prompt and the end-of-day routine moved to the root `how to use`. |
  | `open-questions.md` | Kept as its own file at the user's request, now the single home for every question |

  Updated the root `README.md` and `how to use` for the new structure.
- **Reason:** to simplify the docs without losing information. Each kind of information now lives in one place: business behavior, API contracts, questions and history.
- **Affected area:** every file in the module folder, the root `README.md` and `how to use`. The folder itself was renamed from `specs/001-new-activities/` to `specs/001-activities/` the same day, and the links were updated to match.
- **Decisions:**
  - No requirement changed, so the version stays at 1.1.
  - `api-contracts.md` was written from the old docs **and** the app code at `testflight` @ `a01b46459`. The JSON examples are DTO shapes with placeholder values, because no captured responses exist.
  - Comparing the docs with the code produced new questions Q15–Q24 in `open-questions.md`, plus a note on Q13 about the existing `canEdit` flag. None of them has been sent to the backend yet, and none is treated as confirmed.
  - Rechecked on 2026-10-21: the v1.1 gaps are still open in code. The Previous range still ends at yesterday, `fake/` still exists, the DI comment is stale, and there is no `test/` folder.
  - Plan identifiers B1 and B2 (backend dependencies) were replaced by their question numbers, Q12 and Q13.

## 2026-10-18 — v1.1 — Track backend questions and add a start guide

- **Change:** added `NEXT.md` (where to resume and a session prompt). Recorded the three backend questions Q12–Q14 as sent. Ticked T0.1–T0.3. The spec status now names the pending backend questions.
- **Reason:** the plan's backend dependencies (B1 workload status, B2 permission flags) and the `endDateTime` bound had been sent to the backend and were waiting for answers.
- **Affected area:** spec status, open questions, tasks (T0.x), README index.
- **Decisions:** WP2 is blocked on Q12 and WP4 on Q13. T1.1 can proceed with the fallback "assume inclusive, send today 00:00 − 1s" if Q14 isn't answered.
- Commit: `aa26060`.

## 2026-10-18 — v1.1 — Plan and tasks for the v1.1 gaps

- **Change:** added `plan.md` (WP1–WP5, constraints, backend dependencies B1/B2) and `tasks.md` (T0.1–T9.2).
- **Reason:** most of the feature already existed, so the plan covers only the gaps against v1.1.
- **Affected area:** implementation plan, task checklist, README index.
- **Decisions:**
  - Order: WP1 → WP3 → WP5 (domain/data) → WP2 after B1 → WP4 after B2 → WP5 (cubit/widget).
  - WP3: delete the unused in-app fakes (`domain/usecase/new_activities/fake/`) instead of wiring them up, because the backend is live. Test fixtures go in `test/`.
  - Always run the full `build_runner` (no `--build-filter`) after changing DTOs.
- Commit: `a4e2ab1`.

## 2026-10-18 — v1.1 — Clarify the privacy default

- **Change:** `isPrivate = true` as the default means private activities are **included along with** public ones, not shown on their own. This closed the follow-up "Needs clarification" note on Q5.
- **Reason:** the Q5 answer was ambiguous.
- **Affected area:** filter validation (now business-requirements §7.3), Q5.
- Commit: `365e980`.

## 2026-10-18 — v1.0 → v1.1 (Draft → Approved) — Resolve the product questions

- **Change:** the product owner answered Q1–Q11, and the answers were folded into the spec:
  - Permissions use both role and backend flags.
  - The dashboard metrics were approved (donut, stacked status bar, per-status rows).
  - The create baseline is the existing `new_activity_create` form, submitted through `InsertVisitOrTask`.
  - Current and Previous are split at today 00:00, with no gap and no overlap.
  - Main, Scope, Status and Priority quick filters were added.
  - "All" sends every allowed company, department and employee ID. `isPrivate` defaults to true.
  - The backend returns the workload status, and the app has no thresholds.
  - Sorting uses the scheduled start, newest or oldest first.
  - The endpoints were confirmed under `v2/Mobile/VisitAndTask/`, and the status IDs were listed.
  - Progress is an `int` from 0 to 100 for both Visits and Tasks. This replaced the earlier `double`.
- **Reason:** the spec was a draft that needed these answers before implementation.
- **Affected area:** permissions, dashboard, create, quick filters, filter validation, workload, sorting, API, progress, acceptance criteria, current-state gaps.
- **Decisions:** the gaps found against the code were the Previous range (Q2), the workload status (Q4), the stale fakes, the missing tests, and two items to verify (Q5 "All" IDs and Q9 action gating).
- Commit: `65ac93d`.

**The original v1.0 open questions** (kept for history; the answers are in `open-questions.md`):
1. What are the exact dashboard and list API endpoints, request parameters, and response envelopes?
2. What are the exact definitions of Current and Previous?
3. What are the permitted statuses and priority IDs?
4. What are the workload thresholds for Available, Busy, Very Busy, and Overloaded?
5. What are the exact rules for company, department, employee, and privacy filtering?
6. Which fields are required when creating a Visit versus a Task?
7. What is the progress range and which activity types support progress updates?
8. Which date field is used for sorting?
9. What are the role-specific permissions for creation, assignment, and progress updates?
10. What are the approved dashboard summary metrics and chart values?

The first `open-questions.md` also had Q11 (extra quick-filter chips `main`, `scope`, `status`, `priority`), because the code had more chips than the spec listed.

## 2026-10-18 — v1.0 (Draft) — Initial spec

- **Change:** created the specs repo with `spec.md` (v1.0 draft), `current-state.md` (a code snapshot at `testflight` @ `da099fd5`) and `open-questions.md`. The usage guidelines (`how to use`) were added the same day.
- **Reason:** to start spec-driven development for the New Activities module.
- **Affected area:** all of it.
- Commits: `6f4f5ae`, `3a7079a`.
