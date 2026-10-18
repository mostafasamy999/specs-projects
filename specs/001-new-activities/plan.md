# 001 New Activities: Implementation Plan

**Spec:** [spec.md](spec.md) v1.1  
**Based on:** [current-state.md](current-state.md) (snapshot 2026-10-18, `testflight` @ `da099fd5`)  
**Repo:** `~/StudioProjects/talentlink`. Paths below are relative to `lib/src/`.

Most of the feature is already built, so this plan covers only the gaps against spec v1.1.

## Constraints

- Follow the existing per-layer `new_*` convention: a Retrofit service, a `DataState` repository, use cases, a Cubit with mixins, and GetIt.
- Do not touch the old Visit/Task module (`visit/`, `visit_and_task/`, `add_visit/`, `add_task/`, `visit_detail/`, `visit_timeline/`, `visit_assigned_to_logged_in/`).
- After changing DTOs, run the **full** `build_runner` with no `--build-filter`, and keep the regenerated `.g.dart` files.
- Don't invent backend fields. Where a change needs a field the backend doesn't send yet, it is listed under **Backend dependencies** and stays blocked.

## Backend dependencies (blocking)

| # | Needed from the backend | Blocks | Why |
|---|---|---|---|
| B1 | A workload status field per employee on `GetEmployeeTasksORVisits` (name, type, and value set: Available / Busy / Very Busy / Overloaded) | WP2 | `NewRemoteEmployeeActivities` currently returns only `employeeId`, `employeeName`, `typeId`, `typeName`, `createdDate`, `count` and `items`. It has no status. |
| B2 | Per-activity permission flags on `GetVisitOrTaskDetails` / `GetVisitOrTaskMasterData` (e.g. `canChangeStatus`, `canReschedule`, `canUpdateProgress`, `canToggleEnabled`) | WP4 | The detail actions are gated only on `isMaster` (from the route args) and on status (`NewActivityStatusIds.open` / `nonEditable`). No backend flags exist. |

Ask the backend for both now. WP1, WP3 and WP5 can proceed without them.

---

## WP1: Fix the Previous range (Q2)

**Problem:** `NewActivitiesTimeScope.previous.range` returns `(null, yesterday 00:00)`, so activities scheduled yesterday fall into neither Current nor Previous.

**Change**
- `domain/entities/new_activities/new_activities_time_scope.dart`: Previous becomes `(null, today 00:00)`.
- Check how the repository formats `endDateTime`. If the backend treats `endDateTime` as **inclusive**, sending today 00:00 would also match an activity at exactly 00:00 today, which also belongs to Current. Confirm whether the bound is inclusive or exclusive. If it is inclusive, send `today 00:00 − 1s`.
- `NewActivitiesTimeScope.of(from, to)` matches presets by equality, so it keeps working once `range` changes. Make sure no persisted or saved filter holds the old value.

**Done when**
- Current and Previous together cover every activity with no gap or overlap (unit test).
- The quick-filter bar still highlights the right chip after the change (`new_activities_quick_filters_bar_widget.dart`).

## WP2: Workload status from the backend (Q4). Blocked on B1.

**Problem:** `NewEmployeeAvailabilityChipWidget` shows only Busy or Available, based on `items.isNotEmpty`. The spec requires the four statuses returned by the backend.

**Change**
- **Domain:** add `enum NewWorkloadStatus { available, busy, veryBusy, overloaded, unknown }` in `domain/entities/new_activities/new_employee_workload.dart`. Add a new `NewEmployeeWorkload { status, items }` entity. Change `getEmployeesWorkload` to return `Map<int, NewEmployeeWorkload>` instead of `Map<int, List<NewWorkloadItem>>`.
- **Data:** add the B1 field to `NewRemoteEmployeeActivities` and map it in `mapWorkloadsToDomain()`. An unknown or missing value maps to `unknown`, never to `available`.
- **Use case:** update the return type of `NewGetEmployeesWorkloadUseCase`.
- **Presentation:** in `presentation/widgets/new_companies_employees_picker/`:
  - The chip renders the four statuses plus `unknown`, with colors for each status.
  - The tree row (null currently means "not loaded") and the picker sheet pass the new entity through.
- **l10n:** add `newActivitiesVeryBusy`, `newActivitiesOverloaded` and an unknown label in both ARB files, then regenerate.
- **Error path:** if the workload request fails, show no chip or an "unknown" chip for every employee, never Available.

**Done when**
- The repository/mapper test passes: each backend value maps to its status, and missing or unknown values map to `unknown`.
- The widget test passes: each status renders its label, and tapping the chip still opens the grouped workload.
- When the workload request fails, no employee is shown as Available.

## WP3: Remove the dead fake data (§13)

**Problem:** nothing imports `domain/usecase/new_activities/fake/*`. The comment at `di/use_case_injector.dart:805`, "fake until the backend is ready", is stale because DI wires the real `NewActivityRepositoryImplementation`.

**Decision:** delete the fakes and fix the comment. The backend is live, so the fakes have no caller. If test fixtures are needed, build them in `test/` (WP5) and keep them out of `lib/`.

**Done when** `fake/` no longer exists, the analyzer is clean, and the comment reads "New activities".

## WP4: Permission gating from backend flags (Q9). Blocked on B2.

**Current gating:** whether the screen opens as master or assignee is decided by `NewActivityDetailsArgs.isMaster`. Action availability depends on status, through `NewActivityStatusIds`, and is applied in `new_activity_edits_mixin.dart`, `new_activity_progress_mixin.dart` and the bottom-bar / master-actions widgets.

**Change (after B2)**
- Add the flags to `NewRemoteActivityDetails` and map them into `NewActivityDetails`, e.g. a `Set<NewActivityAction> allowedActions`.
- Each action shows only when the role/route allows it **and** the backend flag allows it **and** the status allows it.
- Keep the role check (`isMaster`) as the screen-level gate.

**Done when** a cubit/widget test confirms that an action with its flag set to false is hidden even when the role and status would allow it.

## WP5: Tests (§16)

There are no `new_activit*` tests yet. Put them under `test/` and mirror the `lib/src` layer paths. Use the existing `test/helpers` and JSON fixtures (`json_reader`).

Priority order:
1. **Domain:** `NewActivitiesTimeScope` (WP1), `NewActivitiesFilterData.scopeIds` (All / my team / mine / private → IDs), and the `NewActivitiesFilter` dependent-clear rules.
2. **Data:** list request mapping (`NewActivitiesListRequest` JSON, including `null` dates, `onlyMe` and `direction`), the dashboard and page mappers, and the workload mapper (WP2).
3. **Cubit:** `NewActivitiesCubit` covering dashboard load and error, first page, next page with no duplicates, no concurrent page loads, reset on filter/search/sort change, and dismissing the filter sheet keeping the applied filters.
4. **Widget:** the dashboard summaries, the list empty and error states, hiding Visit-only filters when the type is Task, and the availability chip.

If the project doesn't have `bloc_test` / `mocktail` yet, add them as dev dependencies. Check `pubspec.yaml` first.

## Already aligned (verification only, no work)

- **All filters (Q5):** `NewActivitiesFilterData.scopeIds` sends every allowed company and employee ID for All or My team, and the user's own IDs for Mine or Private. Covered by the WP5 domain tests.
- The endpoints (Q1), status IDs (Q3), create form (Q6), `int` progress from 0 to 100 (Q7), scheduled-start sorting (Q8), dashboard metrics (Q10) and quick-filter chips (Q11) match the code.

## Order

WP1 → WP3 → WP5 (domain and data first) → WP2 once B1 arrives → WP4 once B2 arrives → WP5 (cubit and widget).
