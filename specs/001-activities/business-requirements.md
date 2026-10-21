# 001 New Activities: Business Requirements

**Product:** TalentLink360 HR  
**Module:** New Activities — Visits & Tasks  
**Version:** 1.1 — Approved  
**Status:** Product questions resolved on 2026-10-18. Three backend questions are pending: Q12 workload status field, Q13 permission flags and Q14 `endDateTime` bounds (see [open-questions.md](open-questions.md)). No app code has changed for the v1.1 gaps yet.  
**Last updated:** 2026-10-21 (consolidated from six files; no requirement changed, see [changelog.md](changelog.md))  
**App repo:** `~/StudioProjects/talentlink`. Code paths below are relative to `lib/src/`.

Related: [api-contracts.md](api-contracts.md) (endpoints and data contracts) · [changelog.md](changelog.md) (history)

How to read the markers in this document:
- **Confirmed:** approved by the product owner or already verified in code.
- **Assumed in code:** the code already uses this answer. It still needs confirming.
- **Open:** no answer yet. Don't guess. Track it in [open-questions.md](open-questions.md).

---

## 1. Overview and business objective

The New Activities module lets managers and employees view, search, filter, assign and track Visits and Tasks.

The module opens on an Activities Dashboard. From there the user can go to the activity lists, filters, activity creation, employee assignment and progress tracking.

The new implementation must be isolated from the existing Visit/Task module.

Much of the feature is already built. The remaining work is the gap against spec v1.1 (§12), not a rewrite.

## 2. Scope

### In scope

- Activities Dashboard
- Visit Summary and Tasks Summary
- Activity overview chart
- Activities list and pagination
- Search, sorting and filtering
- Visit-specific and Task-specific filters
- Activity creation entry point
- Assigned-to employee picker
- Employee workload and availability
- Department hierarchy
- Activity progress updates
- API integration (and, originally, fake implementations during development; see §9.3)
- Loading, empty, success and error states
- Unit and widget tests

### Out of scope

- Modifying or replacing the existing Visit/Task implementation
- Changing unrelated application modules
- Inventing or changing backend API behavior without confirmation
- Implementing backend endpoints as part of the Flutter task

## 3. User roles and permissions

### Manager
- Views activities within their permitted scope.
- Assigns activities to employees.
- Filters by employee, department, status, priority and date.
- Monitors employee workload.
- Views activity progress.

### Employee
- Views the activities they can access.
- Searches and filters activities.
- Views activity details and progress.
- Performs the activity actions they are permitted to perform.

### Permission rule (Confirmed, Q9)

Both layers apply:
- The user's **role** (Manager or Employee, through the existing app permissions) decides which screens they can access.
- **Flags returned by the backend for each activity** decide which actions are shown (create, assign, progress update, status change and so on).

The app never shows an action the backend has not allowed.

**Current gating in code (gap):**
- Whether the details screen opens as master or assignee is decided by `NewActivityDetailsArgs.isMaster` from the route args.
- Action availability depends on status, through `NewActivityStatusIds.open` / `nonEditable`. It is applied in `new_activity_edits_mixin.dart`, `new_activity_progress_mixin.dart` and the bottom-bar / master-actions widgets.
- The backend per-action flags this rule needs are not available yet. That is backend question Q13, which blocks WP4.

## 4. Current implementation and reusable components

Snapshot: 2026-10-18, branch `testflight` @ `da099fd5`. Rechecked on 2026-10-21 against `testflight` @ `a01b46459`: the gaps in §12.1 are still open.

### 4.1 Architecture as built

The repo is organized **by layer, not by feature**. The new module is isolated by `new_` prefixes and its own folders in each layer. There is no `features/activities/` folder.

| Layer | Folder(s) |
|---|---|
| API service | `data/sources/remote/talent_link_hr/new_visit/new_activity_api_service.dart` (Retrofit) |
| Request/response DTOs and mappers | `data/sources/remote/talent_link_hr/new_visit/model/{request,response}/` |
| Repository impl | `data/repositories/new_visit/new_activity_repository_implementation.dart` |
| Repository contract | `domain/repositories/new_visit/new_activity_repository.dart` |
| Entities | `domain/entities/new_activities/`, `new_activity_create/`, `new_activity_details/`, `new_activity_timeline/` |
| Use cases | `domain/usecase/new_activities/`, `new_activity_create/`, `new_activity_details/`, `new_activity_timeline/` |
| Cubits | `presentation/blocs/new_activities/` (dashboard and list in one cubit, split into mixins), `new_activity_create/`, `new_activity_details/`, `new_activity_timeline/` |
| Screens | `presentation/screens/new_activities/` (dashboard, list, filter, fab), `new_activity_create/`, `new_activity_details/`, `new_activity_timeline/` |
| Shared picker widgets | `presentation/widgets/new_companies_employees_picker/` (availability chip, tree row, picker sheet) |
| DI | `di/data_layer_injector.dart:222`, `di/repository_injector.dart:157`, `di/use_case_injector.dart:805` |

The old module is separate and must not be touched: `visit/`, `visit_and_task/`, `add_visit/`, `add_task/`, `visit_detail/`, `visit_timeline/` and `visit_assigned_to_logged_in/`.

Shared pieces the new module reuses through their public interfaces: the request/response envelopes, `RemoteLookUp`, `RemoteStatus`, `RemoteAssignedTo`, `RemoteDynamicForm`, the v1 step/status/reschedule/comment request classes, and `RemoteVisitAndTask` for reading the Main list. Details are in [api-contracts.md](api-contracts.md).

### 4.2 Decisions already encoded in code

| Topic | As implemented | Where | Status |
|---|---|---|---|
| Activity type IDs | Task = 1, Visit = 2. An unknown ID falls back to Task. | `domain/entities/new_activities/new_activity_type.dart` | Assumed in code (not covered by a product question) |
| Status IDs | Pending 1, In Progress 2, Cancelled 3, Completed 4, Rejected 5, Partially Completed 7. Open = {1,2}. Non-editable = {3,4,5}. | `new_activity_status_ids.dart` | IDs Confirmed (Q3). The Open and Non-editable groupings are Assumed in code. |
| Current / Previous | Current = from today 00:00 with no end. Previous = no start, up to **yesterday** 00:00. | `new_activities_time_scope.dart` | **Wrong vs Q2.** Fixed by WP1. |
| Sorting | By scheduled start: `newestFirst` / `oldestFirst` | `new_activities_sort.dart` | Confirmed (Q8) |
| Quick-filter chips | current, previous, main, type, scope, status, priority, department | `new_quick_filter.dart` | Confirmed (Q11) |
| Workload | Map of employeeId to activities for **today** (`day: DateTime.now()`) | `new_get_employees_workload_use_case.dart` | The "today" window is Assumed in code. The status is missing (Q4, Q12). |
| Progress value | `int` in the repository contract | `new_activity_repository.dart:85` | Confirmed (Q7) |
| Search | One `searchValue` string sent to the backend | repository implementation | Assumed in code. See §6.6. |

## 5. Functional requirements and user workflows

### 5.1 Activities Dashboard

The dashboard is the default entry screen.

**App bar:** Back button, the title "Activities", an Add action and a Filter action.

**Content:**
1. An activity overview chart showing the ratio of Visits to Tasks.
2. A Visit Summary section.
3. A Tasks Summary section.
4. Quick filters for common activity views (§6.1).

Visit Summary and Tasks Summary must have distinct designs that suit their activity types.

**Approved metrics (Confirmed, Q10):** a Visits-vs-Tasks donut chart, a stacked status bar and per-status progress rows. All of them are fed by `GetTaskAndVisitDashboard`.

### 5.2 Activities List

The list shows activities for the selected view and the applied filters.

Each item shows the information its model provides, such as:
- Activity title
- Activity type: Visit or Task
- Status
- Priority
- Assigned employee
- Creator
- Relevant date and time
- Progress, where applicable
- Privacy indicator, where applicable

Do not display unavailable fields as if they were real data.

### 5.3 Add Activity

The Add action opens the existing or approved creation flow for a Visit or a Task.

The creation flow must distinguish Visit-specific fields from Task-specific fields.

**Approved baseline (Confirmed, Q6):** the existing `new_activity_create` form and its validation, submitted through `InsertVisitOrTask`.

### 5.4 Activity details and actions

From the list, the user opens an activity's details. The available actions are check-in/out, start, complete, change status, reschedule, add a note, enable/disable and update progress. Each one is gated by the rule in §3. The endpoints behind them are listed in [api-contracts.md](api-contracts.md).

### 5.5 Filter Sheet

The filter sheet lets the user select and apply several criteria.

Actions: **Apply**, **Reset** and **Dismiss**.
- **Dismiss** must not overwrite the previously applied filters.
- **Reset** clears the draft selections back to the defined defaults.
- **Apply** commits the selected values and refreshes the results.

## 6. Screens, filters and user interactions

### 6.1 Quick filters (Confirmed, Q2 and Q11)

| Quick filter | Expected behavior |
|---|---|
| Current | Activities with a scheduled start at or after today 00:00 (no end bound) |
| Previous | Activities with a scheduled start before today 00:00 (no start bound) |
| Department | Filter activities by the selected department scope |
| Tasks | Restrict results to Tasks |
| Visits | Restrict results to Visits |
| Main | Show master (main) activities |
| Scope | All (team + mine + private), My team, My activities, or Private only |
| Status | Filter by status |
| Priority | Filter by priority |

- Current and Previous never overlap and leave no gap. Together they cover every activity.
- Quick filters must stay consistent with the active list filters and the dashboard state.

### 6.2 Filter dimensions

Support these filter dimensions where they apply:

- Activity type: All, Visits, Tasks
- Status
- Priority
- Department
- Employee
- Start date and time
- End date and time
- Visit execution type
- Visit category
- Privacy (`isPrivate`)

Visit execution type and Visit category are available only when the selected activity type is Visits.

### 6.3 Company selection

- Reuse the existing company model and selection conventions.
- Use the current company as the fallback when the company list is empty, where that is permitted.
- Changing the company clears the selected employees and any dependent department selections that are no longer valid.

### 6.4 Department and employee selection

**Department:**
- Support the department tree.
- Respect the available company and department scope.
- Make sure employee selections remain valid for the selected department.

**Employee:**
- Reuse the existing employee/team models and data retrieval where possible.
- Do not display the employee picker until a company has been selected.
- Use the current user or company defaults only where appropriate and supported by existing behavior.
- Provide a reusable employee picker widget instead of duplicating selection logic.

### 6.5 Assigned-to employee picker and workload

The employee picker must help the manager select an appropriate employee.

Workload statuses: **Available**, **Busy**, **Very Busy** and **Overloaded**.

**Confirmed (Q4):** the backend returns each employee's workload status in the `GetEmployeeTasksORVisits` response. The app displays it and does not calculate thresholds.

**Open (Q12):** the field name, its type and its value set. This blocks WP2.

Tapping a workload status shows the employee's grouped workload, including the relevant Visits and Tasks when the API returns them.

The picker supports:
- Employee search and selection
- Employee identification
- Workload status
- Summaries of the relevant assigned activities
- Loading, empty and error states

If the status is missing or the request fails, show an unknown or error state. **Never default to Available.**

**Current behavior in code (gap):** `NewEmployeeAvailabilityChipWidget` shows only Busy or Available, based on `items.isNotEmpty`.

### 6.6 Search

Search by:
- Activity title
- Assigned employee
- Creator

Search must be debounced to avoid excessive API requests.

The original spec left it to the backend contract whether these are separate parameters or one shared query. The code sends one shared `searchValue` string. Which fields the backend matches against is still **Open** (Q19 in [open-questions.md](open-questions.md)).

### 6.7 Sorting (Confirmed, Q8)

- Sort field: the activity's **scheduled start**.
- Directions: newest first (the default) and oldest first.
- Keep the selected sort field and direction when the list refreshes, unless the user changes them.

## 7. Business rules and validations

### 7.1 Activity statuses (Confirmed, Q3)

| ID | Status |
|---|---|
| 1 | Pending |
| 2 | In Progress |
| 3 | Cancelled |
| 4 | Completed |
| 5 | Rejected |
| 7 | Partially Completed |

ID 6 is not used. Priorities come from `GetPriorityList`.

### 7.2 Current and Previous (Confirmed, Q2)

- **Current:** scheduled start at or after today 00:00.
- **Previous:** scheduled start before today 00:00.
- No activity falls in both ranges or in neither.
- **Open (Q14):** whether `endDateTime` is inclusive. If it is (the fallback assumption), Previous must send today 00:00 − 1s.

### 7.3 Filter rules (Confirmed, Q5)

- Start date/time must not be later than end date/time.
- Invalid dependent selections must not be submitted.
- An empty selection means **All** and may be sent as `null`.
- **Company:** defaults to All, which sends the list of every company ID the user is allowed to see.
- **Department:** follows the same pattern, so All sends every allowed department ID.
- **Employee:** follows the same pattern, so All sends every allowed employee ID.
- **Privacy:** defaults to `isPrivate = true`. This means private activities are **included along with** public ones, not shown on their own.

### 7.4 Dependent clear rules

When a parent selection changes, dependent values that are no longer valid must be cleared:
- Switching from Visits to Tasks clears the Visit-only values (execution type and category).
- Changing the company clears the selected employees.
- Changing the department hierarchy clears the dependent selections that fall outside the new scope.

### 7.5 Progress (Confirmed, Q7)

Progress is an `int` from 0 to 100 and applies to both Visits and Tasks. Who may update it follows the backend flags on each activity (§3).

## 8. State management and UI behavior

### 8.1 Pagination and data refresh

- Load the first page when the list opens.
- Load the next page when the user reaches the end of the list.
- Stop requesting pages once every available item has been loaded.
- Use the backend total count or pagination metadata to decide when the list is complete.
- Reset pagination when the search, filters, quick filters or sorting change.
- Prevent duplicate concurrent page requests.
- Handle refresh errors and pagination errors independently where appropriate.
- Avoid duplicate activity records when appending pages.
- When the filters change, the new list request must use the complete applied filter state.

### 8.2 UI states

Each asynchronous operation must handle the relevant states.

**Dashboard:** initial loading, loaded, empty summary and error.

**Activities list:** initial loading, loaded with items, empty results, pagination loading, initial-load error, pagination error and refreshing.

**Filter and employee picker:** lookup loading, loaded, no available options, lookup error and invalid dependent selection.

Use the existing app error-handling and localization conventions. Never leave a loading indicator running after a request fails.

## 9. Architecture and coding constraints

### 9.1 Conventions

Follow the existing project conventions:
- Flutter and Dart
- Clean Architecture
- Cubit for state management, with a single Cubit responsible for the dashboard and list state
- Equatable for state equality
- A single state model with a suitable status enum
- GetIt for dependency injection
- Use cases for domain operations
- Repository abstractions
- Retrofit/Dio for remote requests
- The existing `DataState` and error-handling conventions
- The existing response envelopes and DTO mapping conventions

Do not introduce Riverpod, Provider, GetX, Freezed or a second state-management approach.

The original spec suggested organizing the code by feature (`data/`, `domain/`, `presentation/`). The repo is actually organized by layer (§4.1), and the plan follows it. The rule is to follow the existing repository conventions.

### 9.2 Implementation constraints

- Follow the existing per-layer `new_*` convention: a Retrofit service, a `DataState` repository, use cases, a Cubit with mixins and GetIt.
- **Isolation:** all new Activities functionality lives in the new implementation. Do not modify the old Visit/Task module (§4.1) to make the new screen work. Reuse shared models and services through their public interfaces.
- After changing DTOs, run the **full** `build_runner` with no `--build-filter`, and keep the regenerated `.g.dart` files.
- Don't invent backend fields. If a change needs a field the backend doesn't send yet, it stays blocked until its question in [open-questions.md](open-questions.md) is answered.

### 9.3 Fake data and development strategy

**Original requirement (spec §13):** before the backend integration is ready:
- Define repository contracts and use cases.
- Provide fake implementations for the dashboard, list, priorities, workload and progress updates.
- Use deterministic sample data for Visits and Tasks.
- Support enough pagination and filtering in the fakes to test the UI.
- Keep the fake data isolated from production implementations.
- Make it possible to swap the fake repository for the real one through dependency injection.
- The fakes must reproduce the agreed behavior instead of bypassing business rules.

**Decision (plan WP3, 2026-10-18):** the backend is live and DI already wires the real `NewActivityRepositoryImplementation`. Nothing imports `domain/usecase/new_activities/fake/*`, and the comment at `di/use_case_injector.dart:805` ("fake until the backend is ready") is stale.
- Delete `fake/` and change the comment to `// New activities`.
- Any test fixtures needed are built under `test/` (WP5) and kept out of `lib/`.

This decision replaces the in-app fakes. The acceptance criterion in §10 about testing without live APIs is met with test fixtures instead.

## 10. Acceptance criteria

### Dashboard
- Given the user opens Activities, when the dashboard request succeeds, then the Visit Summary, Tasks Summary and overview chart display the returned data.
- Given the dashboard request fails, then an appropriate error state is shown.
- Given the user selects the Tasks quick filter, then the activity view is restricted to Tasks.

### List and pagination
- Given the list has more than one page, when the user reaches the end, then the next page loads without duplicating existing items.
- Given the user changes a filter, then pagination restarts from the first page.
- Given no activities match the criteria, then an empty state is displayed.

### Filtering and search
- Given the user selects a status and a priority, when they apply the filter, then the list request uses both selections.
- Given the user changes the activity type to Tasks, then the Visit-only filters are cleared and hidden.
- Given the user searches for a title or an employee, then matching results are returned according to the agreed search contract.
- Given the user dismisses the filter sheet, then the previously applied filters remain unchanged.

### Employee assignment
- Given no company is selected, then the employee picker is unavailable.
- Given the selected company changes, then invalid employee selections are cleared.
- Given workload data is available, then the employee's workload status shows the value returned by the backend.
- Given an employee workload request fails, then the failure is handled without marking the employee Available.

### Progress and errors
- Given a valid progress update is submitted, then the UI reflects the confirmed result.
- Given the update fails, then the user gets appropriate feedback, and the displayed state stays consistent with the confirmed server state.

### Architecture
- Given the new feature is implemented, then the existing Visit/Task module remains unchanged.
- Given fakes or test fixtures are used, then the dashboard, list, filters and pagination can be tested without live backend APIs (see §9.3).

### Definition of Done

The feature is implemented in isolation, follows the existing architecture, meets the approved acceptance criteria, passes the agreed tests and uses verified API contracts. Every unresolved business rule is documented, not guessed.

## 11. Testing strategy

- Unit tests for use cases, repositories, filtering, sorting, pagination and workload classification.
- Cubit tests for dashboard loading, list loading, filter changes, search, pagination and errors.
- Widget tests for the dashboard summaries, list states, filter sheet and employee picker.
- API mapping tests for request parameters, response DTOs and error responses.
- Regression tests confirming that the existing Visit/Task module is unaffected.

Put tests under `test/`, mirroring the `lib/src` layer paths. The plan says to use the existing `test/helpers` and JSON fixtures (`json_reader`).

**Note (checked 2026-10-21):** at `testflight` @ `a01b46459` there is no `test/` folder in the app repo at all. The helpers and `json_reader` may need to be created. T5.1 should check this together with `pubspec.yaml`.

If the project doesn't have `bloc_test` / `mocktail` yet, add them as dev dependencies (check `pubspec.yaml` first).

## 12. Implementation plan and task checklist

### 12.1 Gaps against spec v1.1

Code changes needed:
- **Previous range (Q2):** `NewActivitiesTimeScope.previous` ends at yesterday 00:00. It must end at today 00:00, so yesterday's activities are no longer dropped. (WP1)
- **Workload status (Q4):** read the backend status from `GetEmployeeTasksORVisits`, add it to the entity and show it in the picker. Never default to Available. (WP2, blocked on Q12)
- **Fake data (§9.3):** delete the unused `fake/` folder and fix the stale DI comment. (WP3)
- **Permission gating (Q9):** gate actions on the backend flags. (WP4, blocked on Q13)
- **Tests (§11):** there are no `new_activit*` tests. (WP5)

To verify (no work expected):
- **"All" filters (Q5):** `NewActivitiesFilterData.scopeIds` sends every allowed company and employee ID for All or My team, and the user's own IDs for Mine or Private. It is covered by the WP5 domain tests. See also Q15 (department filter) in [open-questions.md](open-questions.md).
- **Permissions (Q9):** check that the details actions are gated on the backend flags as well as the role (after WP4).

Already aligned: the endpoints (Q1), status IDs (Q3), create form (Q6), `int` progress from 0 to 100 (Q7), scheduled-start sorting (Q8), dashboard metrics (Q10) and quick-filter chips (Q11).

### 12.2 Work packages

**WP1: Fix the Previous range (Q2)**
- Problem: `NewActivitiesTimeScope.previous.range` returns `(null, yesterday 00:00)`, so activities scheduled yesterday fall into neither Current nor Previous.
- Change `domain/entities/new_activities/new_activities_time_scope.dart` so Previous becomes `(null, today 00:00)`.
- Check how the repository formats `endDateTime`. If the backend treats it as inclusive, sending today 00:00 would also match an activity at exactly 00:00 today, which belongs to Current. In that case send `today 00:00 − 1s` (Q14).
- `NewActivitiesTimeScope.of(from, to)` matches presets by equality, so it keeps working once `range` changes. Make sure no persisted or saved filter holds the old value.
- Done when: a unit test shows that Current and Previous together cover every activity with no gap or overlap, and the quick-filter bar still highlights the right chip (`new_activities_quick_filters_bar_widget.dart`).

**WP2: Workload status from the backend (Q4). Blocked on Q12.**
- Problem: the chip shows only Busy or Available. The spec requires the four statuses the backend returns.
- Domain: add `enum NewWorkloadStatus { available, busy, veryBusy, overloaded, unknown }` and a new `NewEmployeeWorkload { status, items }` entity in `domain/entities/new_activities/new_employee_workload.dart`. Change `getEmployeesWorkload` to return `Map<int, NewEmployeeWorkload>` instead of `Map<int, List<NewWorkloadItem>>`.
- Data: add the Q12 field to `NewRemoteEmployeeActivities` and map it in `mapWorkloadsToDomain()`. An unknown or missing value maps to `unknown`, never to `available`.
- Use case: update the return type of `NewGetEmployeesWorkloadUseCase`.
- Presentation (`presentation/widgets/new_companies_employees_picker/`): the chip renders the four statuses plus `unknown`, each with its own color. The tree row (where null currently means "not loaded") and the picker sheet pass the new entity through.
- l10n: add `newActivitiesVeryBusy`, `newActivitiesOverloaded` and an unknown label to both ARB files, then regenerate.
- Error path: if the workload request fails, show no chip or an "unknown" chip for every employee, never Available.
- Done when: the mapper test passes for every backend value plus missing/unknown → `unknown`. The widget test passes for each status's label, and tapping the chip still opens the grouped workload. A failed request shows no employee as Available.

**WP3: Remove the dead fake data (§9.3)**
- Delete `domain/usecase/new_activities/fake/` and change the comment at `di/use_case_injector.dart:805` to `// New activities`.
- Done when: `fake/` no longer exists, the analyzer is clean and the comment reads "New activities".

**WP4: Permission gating from backend flags (Q9). Blocked on Q13.**
- Add the flags to `NewRemoteActivityDetails` and map them into `NewActivityDetails`, for example a `Set<NewActivityAction> allowedActions`.
- Each action shows only when the role/route allows it **and** the backend flag allows it **and** the status allows it.
- Keep the role check (`isMaster`) as the screen-level gate.
- Done when: a cubit or widget test confirms that an action whose flag is false is hidden even when the role and status would allow it.

**WP5: Tests (§11)**

Priority order:
1. **Domain:** `NewActivitiesTimeScope` (WP1), `NewActivitiesFilterData.scopeIds` (All / My team / Mine / Private → IDs) and the `NewActivitiesFilter` dependent-clear rules.
2. **Data:** list request mapping (`NewActivitiesListRequest` JSON, including `null` dates, `onlyMe` and `direction`), the dashboard and page mappers, and the workload mapper (WP2).
3. **Cubit:** `NewActivitiesCubit` covering dashboard load and error, the first page, the next page with no duplicates, no concurrent page loads, reset on filter/search/sort change, and dismissing the filter sheet keeping the applied filters.
4. **Widget:** the dashboard summaries, the list empty and error states, hiding Visit-only filters when the type is Task, and the availability chip.

**Order:** WP1 → WP3 → WP5 (domain and data first) → WP2 once Q12 is answered → WP4 once Q13 is answered → WP5 (cubit and widget).

### 12.3 Task checklist

Work top to bottom, one commit per task (or per small group). Tick a box only when its **Verify** step passes. 🔒 means blocked on a backend answer.

**Backend requests (sent 2026-10-18)**
- [x] **T0.1** Asked the backend for the workload status field on `GetEmployeeTasksORVisits`, with its name and value set (Q12).
- [x] **T0.2** Asked the backend for per-activity permission flags on `GetVisitOrTaskDetails` / `GetVisitOrTaskMasterData` (Q13).
- [x] **T0.3** Asked the backend whether `endDateTime` is inclusive or exclusive. T1.1 needs it (Q14). *Waiting for all three answers.*

**WP1: Previous range**
- [ ] **T1.1** In `new_activities_time_scope.dart`, make Previous end at today 00:00, adjusted by the Q14 answer.
  **Verify:** a unit test shows that yesterday 10:00 falls under Previous, today 00:00 falls under Current, and no instant falls under both or neither.
- [ ] **T1.2** Check that the quick-filter chip still highlights Previous after it is applied.
  **Verify:** a manual run, or a widget test on `new_activities_quick_filters_bar_widget.dart`.

**WP3: Dead fake data**
- [ ] **T3.1** Delete `domain/usecase/new_activities/fake/` and change the comment at `di/use_case_injector.dart:805` to `// New activities`.
  **Verify:** `flutter analyze` is clean and the app builds.

**WP5a: Domain and data tests**
- [ ] **T5.1** Check `pubspec.yaml` for `bloc_test` and `mocktail`, and add them as dev dependencies if they're missing. Also check whether `test/` and its helpers exist (§11).
- [ ] **T5.2** Write a test for `NewActivitiesTimeScope` (this can be the T1.1 test).
- [ ] **T5.3** Write tests for `NewActivitiesFilterData.scopeIds` covering All, My team, Mine, Private, and a picked company or employee.
  **Verify:** All and My team send every allowed ID, and Mine and Private send the user's own IDs.
- [ ] **T5.4** Write tests for the `NewActivitiesFilter` dependent-clear rules: Visit → Task clears execution type and category, and a company change clears the employees.
- [ ] **T5.5** Write `NewActivitiesListRequest` JSON tests covering `null` dates, `onlyMe`, `direction` asc/desc, `skip`/`pageSize` and empty lists.
- [ ] **T5.6** Write mapper tests for the dashboard and activities page using JSON fixtures in `test/` through `json_reader`.

**WP2: Workload status 🔒 Q12**
- [ ] **T2.1** 🔒 Add `NewWorkloadStatus` (including `unknown`) and the `NewEmployeeWorkload` entity.
- [ ] **T2.2** 🔒 Add the Q12 field to `NewRemoteEmployeeActivities`, map it (unknown or missing → `unknown`) and run the full `build_runner`.
  **Verify:** a mapper test covers every value plus missing.
- [ ] **T2.3** 🔒 Update the repository contract and implementation and `NewGetEmployeesWorkloadUseCase` to return `Map<int, NewEmployeeWorkload>`.
- [ ] **T2.4** 🔒 Add the `newActivitiesVeryBusy`, `newActivitiesOverloaded` and unknown labels to both ARB files and regenerate.
- [ ] **T2.5** 🔒 Update `NewEmployeeAvailabilityChipWidget`, the tree row and the picker sheet to show the 4 statuses plus unknown.
  **Verify:** a widget test shows each status's label and color, and that tapping still opens the grouped workload.
- [ ] **T2.6** 🔒 Make sure a failed workload request never shows Available.
  **Verify:** a cubit or widget test with the request failing.

**WP4: Permission flags 🔒 Q13**
- [ ] **T4.1** 🔒 Add the flags to `NewRemoteActivityDetails`, map them to `NewActivityDetails.allowedActions` and run the full `build_runner`.
- [ ] **T4.2** 🔒 Gate each action on the role (`isMaster`), the backend flag and the status, in the edits/progress mixins and the bottom-bar / master-actions widgets.
  **Verify:** a test shows that a flag set to false hides the action even when the role and status allow it.

**WP5b: Cubit and widget tests**
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

**Close-out**
- [ ] **T9.1** Refresh §4 of this file (new snapshot date and commit) and mark the gaps in §12.1 closed.
- [ ] **T9.2** Bump this file to v1.2 if anything changed during implementation, and add a [changelog.md](changelog.md) entry.

### 12.4 Where we stopped and what's next

**State (2026-10-18):** spec v1.1 is approved and the plan and tasks are written. Q12–Q14 have been sent to the backend. No app code has changed yet.

**1. Check the backend replies first:**

| Reply to | If answered | If not answered yet |
|---|---|---|
| Q12 workload status | Record it in [open-questions.md](open-questions.md) and unblock WP2 | Skip WP2 |
| Q13 permission flags | Record it and unblock WP4 | Skip WP4 |
| Q14 `endDateTime` bounds | Use the answer in T1.1 | Use the fallback: assume inclusive and send today 00:00 − 1s |

**2. Work you can do regardless, in order:**
1. **T1.1 + T1.2:** fix the Previous range in `lib/src/domain/entities/new_activities/new_activities_time_scope.dart`.
2. **T3.1:** delete `lib/src/domain/usecase/new_activities/fake/` and fix the comment at `di/use_case_injector.dart:805`.
3. **T5.1–T5.6:** the domain and data tests (time scope, `scopeIds`, filter clear rules, request JSON, mappers).

Then do WP2 and WP4 if the backend has answered, and the cubit/widget tests (T5.7–T5.8) after that.

## 13. Open questions, assumptions and unresolved decisions

Every question, with its status, answer and code impact, lives in [open-questions.md](open-questions.md). Summary on 2026-10-21:

- **Q1–Q11 (product):** all resolved on 2026-10-18 and folded into this file.
- **Q12–Q14 (backend, sent 2026-10-18):** waiting. Q12 blocks WP2, Q13 blocks WP4, and Q14 affects T1.1 (which has a fallback).
- **Q15–Q24 (found while consolidating, 2026-10-21):** places where the docs and the code disagree, or where the code works from an undocumented contract. None of them is confirmed, and none changes a requirement in this file.

Until a question is resolved, the sections above keep the confirmed rule and mark the open part. Never treat an assumed answer as confirmed.
