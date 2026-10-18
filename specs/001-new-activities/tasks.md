# 001 New Activities: Tasks

Derived from [plan.md](plan.md). Work top to bottom, one commit per task (or per small group). Tick a box only when its **Verify** step passes.

Legend: 🔒 blocked on a backend dependency (B1/B2 in the plan).

## Backend requests (send now)

- [ ] **T0.1** Ask the backend for B1: a workload status field on `GetEmployeeTasksORVisits`, with its name and value set.
- [ ] **T0.2** Ask the backend for B2: per-activity permission flags on `GetVisitOrTaskDetails` / `GetVisitOrTaskMasterData`.
- [ ] **T0.3** Ask the backend whether `endDateTime` is inclusive or exclusive. This is needed for T1.1.

## WP1: Previous range

- [ ] **T1.1** In `new_activities_time_scope.dart`, make Previous end at today 00:00, adjusted by T0.3.
  **Verify:** a unit test shows that yesterday 10:00 falls under Previous, today 00:00 falls under Current, and no instant falls under both or neither.
- [ ] **T1.2** Check that the quick-filter chip still highlights Previous after it is applied.
  **Verify:** manual run, or a widget test on `new_activities_quick_filters_bar_widget.dart`.

## WP3: Dead fake data

- [ ] **T3.1** Delete `domain/usecase/new_activities/fake/` and change the comment at `di/use_case_injector.dart:805` to `// New activities`.
  **Verify:** `flutter analyze` is clean and the app builds.

## WP5a: Domain and data tests

- [ ] **T5.1** Check `pubspec.yaml` for `bloc_test` and `mocktail`, and add them as dev dependencies if missing.
- [ ] **T5.2** Write a test for `NewActivitiesTimeScope` (this can be the T1.1 test).
- [ ] **T5.3** Write tests for `NewActivitiesFilterData.scopeIds` covering All, My team, Mine, Private, and a picked company or employee.
  **Verify:** All and My team send every allowed ID, and Mine and Private send the user's own IDs.
- [ ] **T5.4** Write tests for the `NewActivitiesFilter` dependent-clear rules: Visit → Task clears execution type and category, and a company change clears employees.
- [ ] **T5.5** Write `NewActivitiesListRequest` JSON tests covering `null` dates, `onlyMe`, `direction` asc/desc, `skip`/`pageSize`, and empty lists.
- [ ] **T5.6** Write mapper tests for the dashboard and activities page using JSON fixtures in `test/` via `json_reader`.

## WP2: Workload status 🔒 B1

- [ ] **T2.1** 🔒 Add `NewWorkloadStatus` (including `unknown`) and the `NewEmployeeWorkload` entity.
- [ ] **T2.2** 🔒 Add the B1 field to `NewRemoteEmployeeActivities`, map it (unknown or missing → `unknown`), and run the full `build_runner`.
  **Verify:** a mapper test covers every value plus missing.
- [ ] **T2.3** 🔒 Update the repository contract and implementation and `NewGetEmployeesWorkloadUseCase` to return `Map<int, NewEmployeeWorkload>`.
- [ ] **T2.4** 🔒 Add the `newActivitiesVeryBusy`, `newActivitiesOverloaded` and unknown labels to both ARB files and regenerate.
- [ ] **T2.5** 🔒 Update `NewEmployeeAvailabilityChipWidget`, the tree row and the picker sheet to show the 4 statuses plus unknown.
  **Verify:** a widget test shows each status's label and color, and that tapping still opens the grouped workload.
- [ ] **T2.6** 🔒 Make sure a failed workload request never shows Available.
  **Verify:** a cubit or widget test with the request failing.

## WP4: Permission flags 🔒 B2

- [ ] **T4.1** 🔒 Add the flags to `NewRemoteActivityDetails`, map them to `NewActivityDetails.allowedActions`, and run the full `build_runner`.
- [ ] **T4.2** 🔒 Gate each action on role (`isMaster`) and the backend flag and the status, in the edits/progress mixins and the bottom-bar / master-actions widgets.
  **Verify:** a test shows that a flag set to false hides the action even when the role and status allow it.

## WP5b: Cubit and widget tests

- [ ] **T5.7** Write `NewActivitiesCubit` tests:
  - dashboard load and error
  - first page
  - next page with no duplicates
  - no concurrent page loads
  - reset on filter, search or sort change
  - dismissing the filter sheet keeps the applied filters
- [ ] **T5.8** Write widget tests:
  - dashboard summaries
  - list empty and error states
  - Visit-only filters hidden when the type is Task

## Close-out

- [ ] **T9.1** Refresh `current-state.md` (new snapshot date and commit), and mark the gaps closed.
- [ ] **T9.2** Bump `spec.md` to v1.2 if anything changed during implementation.
