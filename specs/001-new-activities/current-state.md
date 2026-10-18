# 001 New Activities: Current State in Code

**Snapshot:** 2026-10-18, branch `testflight` @ `da099fd5`  
**Repo:** `~/StudioProjects/talentlink` (paths below are relative to `lib/src/`)

Much of the feature is already built. This file maps [spec.md](spec.md) to what exists, so the remaining work is the gap and not a rewrite.

## Architecture as built

The repo is organized **by layer, not by feature**. The new module is isolated by `new_` prefixes and its own folders in each layer, not by a `features/activities/` folder.

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
| DI | `di/data_layer_injector.dart:222`, `di/repository_injector.dart:157`, `di/use_case_injector.dart:805` |

The old module (`visit/`, `visit_and_task/`, `add_visit/`, `add_task/`, `visit_detail/`, `visit_timeline/`, `visit_assigned_to_logged_in/`) is separate.

## Endpoints (all `POST`, `v2/Mobile/VisitAndTask/…`)

| Spec API | Endpoint | Repository method |
|---|---|---|
| A — Dashboard | `GetTaskAndVisitDashboard` | `getDashboard` |
| B — List | `GetVisitAndTaskAssignedToLoggedInUser` | `getActivities` |
| B — List (main/master) | `Mobile/VisitAndTask/GetVisitAndTaskList` (v1, shared with old module) | `getMainActivities` |
| C — Priorities | `GetPriorityList` | `getPriorities` |
| Visit execution types | `GetTaskExecutionTypeList` | `getExecutionTypes` |
| D — Workload | `GetEmployeeTasksORVisits` | `getEmployeesWorkload` |
| Details | `GetVisitOrTaskDetails`, `GetVisitOrTaskMasterData` | `getActivityDetails`, `getActivityMasterDetails` |
| Timeline | `GetTaskHistoryTimeline` | `getActivityTimeline` |
| Create/edit | `InsertVisitOrTask` | `createActivity`, `getActivityForEdit` |
| Step form | `GetTaskDynamicQuestion` | `getStepForm` |
| Check-in/out | `CheckInOutWithLongitudeLatitude` | `checkInOut` |
| Start | `startTaskWithLongitudeLatitude` | `startActivity` |
| Complete | `CompletedTask` | `completeActivity` |
| Change status | `ChangeStatusWithReason` | `changeStatus` |
| Reschedule | `RescheduleTask` | `reschedule` |
| Comment | `AddComment` | `addNote` |
| Enable/disable | `ActiveDesactiveVisitOrTask` | `setEnabled` |
| E — Progress | `UpdateTaskProgress` | `updateProgress(int activityId, int progress)` |

## Decisions already encoded in code (still need confirmation)

| Topic | As implemented | Where |
|---|---|---|
| Activity type IDs | Task = 1, Visit = 2 (an unknown ID falls back to Task) | `domain/entities/new_activities/new_activity_type.dart` |
| Status IDs | Pending 1, In Progress 2, Cancelled 3, Completed 4, Rejected 5, Partially Completed 7. Open = {1,2}. Non-editable = {3,4,5} | `new_activity_status_ids.dart` |
| Current / Previous | Current = from today 00:00 with no end. Previous = no start, up to yesterday 00:00 | `new_activities_time_scope.dart` |
| Sorting | By scheduled start: `newestFirst` / `oldestFirst` | `new_activities_sort.dart` |
| Quick-filter chips | current, previous, main, type, scope, status, priority, department | `new_quick_filter.dart` |
| Workload | Map of employeeId to activities for **today** (`day: DateTime.now()`) | `new_get_employees_workload_use_case.dart` |
| Progress value | `int` in the repository contract | `new_activity_repository.dart:85` |

## Gaps vs spec v1.1 (after the 2026-10-18 answers)

Code changes needed:
- **Previous range (Q2):** `NewActivitiesTimeScope.previous` ends at yesterday 00:00. It must end at today 00:00 so yesterday's activities are no longer dropped.
- **Workload status (Q4):** read the backend-provided status from `GetEmployeeTasksORVisits`, add it to the entity, and show it in the picker. Never default to Available.
- **Fake data (§13):** `domain/usecase/new_activities/fake/*` is unused, and the DI comment at `di/use_case_injector.dart:805` is stale. Delete both or wire them up.
- **Tests (§16):** there are no `new_activit*` tests in `test/`.

To verify:
- **"All" filters (Q5):** check that the list request sends all allowed company, department and employee IDs when "All" is selected, and that `isPrivate` defaults to true.
- **Permissions (Q9):** check that the details actions are gated on the backend flags as well as the user's role.

Already aligned: the endpoints (Q1), status IDs (Q3), create form (Q6), `int` progress from 0 to 100 (Q7), sorting (Q8), dashboard metrics (Q10) and quick-filter chips (Q11).
