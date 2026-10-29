# 001 New Activities — Current state: codebase, logic, tech (LOW-LEVEL)

> **Doc v2.0 · 2026-10-27 · synced to changelog CL-10**
> Code read from `~/StudioProjects/talentlink`, branch `enhance/activities` @ `425fc38f`, plus uncommitted UI changes in the working tree on that date (none touch data or domain).
> Audience: an AI or dev changing this module cold. This file says **what the code does and where**, and nothing about why. Product rules: [user-scenarios-rules.md](user-scenarios-rules.md). Endpoint decisions: [api-contracts.md](api-contracts.md). Open items: [next-tasks-open-questions.md](next-tasks-open-questions.md).

All paths are relative to `lib/src/` unless they start with `lib/`. Every class in this module has the `New` prefix, which keeps it apart from the old `visit/` module. The two modules share a few DTOs and use cases (see §3.3).

---

## 1. File map

### 1.1 Data layer

| Piece | Path |
|---|---|
| Retrofit service | `data/sources/remote/talent_link_hr/new_visit/new_activity_api_service.dart` (+ `.g.dart`) |
| Endpoint paths | `data/sources/remote/api_keys.dart:191` (`getVisitAndTask`, used for the Main list), `:265–299` (`new*`) |
| Common request envelope | `data/sources/remote/talent_link_hr/talent_link_hr_request.dart:61` `createRequest()`: appVersion, companyId, deviceSerial, deviceToken, deviceTypeCode, langId, oSVersion, subscriberId, userId, `data` |
| Request DTOs (new) | `…/new_visit/model/request/`: `new_activities_list_request.dart`, `new_main_activities_request.dart`, `new_activities_filter_request.dart`, `new_activity_id_request.dart`, `new_activity_progress_request.dart`, `new_execution_type_request.dart`, `new_insert_activity_request.dart` |
| Request DTOs (shared with old `visit/`) | `…/visit/model/request/`: `change_status_for_visit_or_task_request.dart`, `reschedule_visit_or_task_request.dart`, `add_comment_to_visit_or_task.dart`, `active_inactive_request.dart`, `task_dynamic_question_request.dart`, `visit_or_task_submit_action_request.dart`, `data_details_request.dart`, `dynamic_screen_request.dart` |
| Response DTOs | `…/new_visit/model/response/`: `new_remote_activities_page`, `new_remote_activity`, `new_remote_activity_master`, `new_remote_activity_details`, `new_remote_activities_dashboard`, `new_remote_status_count`, `new_remote_task_summary`, `new_remote_visit_summary`, `new_remote_employee_activities`, `new_remote_employee_activity_item`, `new_remote_timeline_entry`, `new_remote_activity_progress`, `new_remote_action_form` |
| Response DTOs (shared) | `…/visit/model/response/remote_look_up.dart` (priority / execution type lists), `remote_dynamic_form.dart` (step forms), `RemoteVisitAndTask` (Main list items) |
| Mappers | `…/new_visit/model/response/new_remote_activity_mapper.dart`, `new_remote_main_activities_mapper.dart`, `new_remote_activity_details_mapper.dart`, `new_remote_timeline_entry_mapper.dart`. `mapToDomain()` is also defined inside `new_remote_activities_page.dart`, `new_remote_activities_dashboard.dart` and `new_remote_employee_activities.dart` |
| Repository impl | `data/repositories/new_visit/new_activity_repository_implementation.dart` |

### 1.2 Domain layer

| Piece | Path |
|---|---|
| Repository contract | `domain/repositories/new_visit/new_activity_repository.dart` |
| List / filter entities | `domain/entities/new_activities/`: `new_activity.dart`, `new_activities_page.dart`, `new_activities_query.dart`, `new_activities_filter.dart`, `new_activities_filter_updates.dart` (`withType`/`withScope`/`withMain`/`withTimeScope`/… extension), `new_activities_filter_data.dart`, `new_activities_dashboard.dart`, `new_company_node.dart` (tree), `new_employee_workload.dart`, `new_priority_option.dart`, `new_execution_type.dart`, `new_quick_filter.dart` |
| Enums / ID constants | `new_activity_type.dart`, `new_activity_priority.dart`, `new_activity_status_ids.dart`, `new_activity_execution_type_ids.dart`, `new_activities_scope.dart`, `new_activities_time_scope.dart`, `new_activities_sort.dart`, `new_activities_view.dart` |
| Create / edit | `domain/entities/new_activity_create/`: `new_activity_selection.dart` (the draft + validation), `new_activity_location.dart`, `new_activity_attachment.dart` |
| Details | `domain/entities/new_activity_details/`: `new_activity_details.dart`, `new_activity_step.dart`, `new_activity_action.dart`, `new_activity_step_questions.dart`, `new_activity_step_submission.dart`, `new_activity_assignee_stats.dart` |
| Timeline | `domain/entities/new_activity_timeline/new_activity_timeline_event.dart` |
| Use cases: list | `domain/usecase/new_activities/`: `new_get_activities_list_use_case`, `new_get_main_activities_use_case`, `new_get_activities_dashboard_use_case`, `new_get_activities_filter_data_use_case`, `new_get_activity_priorities_use_case`, `new_get_activity_execution_types_use_case`, `new_get_employees_workload_use_case`, `new_get_current_user_company_and_employee_use_case`, `new_build_company_employee_tree_use_case` |
| Use cases: create | `domain/usecase/new_activity_create/`: `new_create_activity_use_case`, `new_get_activity_for_edit_use_case` |
| Use cases: details | `domain/usecase/new_activity_details/`: `new_get_activity_details_use_case`, `new_get_activity_master_details_use_case`, `new_get_activity_step_form_use_case`, `new_activity_step_request_builder`, `new_start_activity_use_case`, `new_complete_activity_use_case`, `new_check_in_out_activity_use_case`, `new_change_activity_status_use_case`, `new_reschedule_activity_use_case`, `new_add_activity_note_use_case`, `new_update_activity_progress_use_case`, `new_set_activity_enabled_use_case` |
| Use cases: timeline | `domain/usecase/new_activity_timeline/new_get_activity_timeline_use_case` |
| Dead code | `domain/usecase/new_activities/fake/` (3 files). See §9 |
| GPS service | `core/services/location/current_location_service.dart` |

### 1.3 Presentation layer

| Piece | Path |
|---|---|
| Main cubit + mixins | `presentation/blocs/new_activities/`: `new_activities_cubit.dart`, `new_activities_list_mixin.dart`, `new_activities_search_mixin.dart`, `new_activities_summary_mixin.dart`, `new_activities_state.dart`, `new_activities_state_copy.dart` |
| Details cubit + mixins | `presentation/blocs/new_activity_details/`: `new_activity_details_cubit.dart`, `new_activity_action_runner_mixin.dart`, `new_activity_steps_mixin.dart`, `new_activity_edits_mixin.dart`, `new_activity_progress_mixin.dart`, `new_activity_details_state.dart` |
| Create cubit | `presentation/blocs/new_activity_create/new_activity_create_cubit.dart`, `…_state.dart` |
| Timeline cubit | `presentation/blocs/new_activity_timeline/new_activity_timeline_cubit.dart`, `…_state.dart` |
| Screens | `presentation/screens/new_activities/new_activities_screen.dart` (+ `_content.dart`), `new_activity_details/new_activity_details_screen.dart` (+ `_content`, `_actions`, `_args`), `new_activity_create/new_activity_create_screen.dart` (+ `_content`, `_actions`), `new_activity_timeline/new_activity_timeline_screen.dart` (+ `_content`) |
| Widgets | `screens/new_activities/widgets/{common,dashboard,fab,filter,list}/`, `screens/new_activity_details/{widgets,sheets}/`, `screens/new_activity_create/{widgets,sheets}/`, `screens/new_activity_timeline/widgets/` |
| Shared widgets | `presentation/widgets/new_companies_employees_picker/` (department/employee tree picker sheet + tree dialog), `presentation/widgets/options_bottom_sheet/options_bottom_sheet_widget.dart` (single-choice sheet) |
| Reused from other modules | `screens/add_visit/widget/show_img_camera_bottom_sheet.dart` (attachment source sheet), the `Routes.locationPickerScreen` screen (map), the `Routes.filePreview` screen |
| Routes | `lib/src/config/routes/routes_manager.dart:132–135` (names), `:321–355` (builders) |
| Entry from bottom nav | `presentation/screens/bottom_navigation_bar/bottom_navigation_bar_screen.dart:52, 74–76` (`GlobalKey<NewActivitiesScreenState>` so the tab can call `scrollUp()`) |
| Test IDs | `lib/src/core/utils/semantics_ids.dart` (`SemanticsIds.activities*`, used by Maestro) |
| Strings | `lib/l10n/intl_*.arb` → `lib/generated/l10n.dart` (`S.of(context)`) |

---

## 2. Packages: native vs third-party

| Concern | Provided by | Role in this module |
|---|---|---|
| UI, `CustomPainter`, `Timer`, `DateTime` | Flutter / Dart SDK | Every widget. The dashboard donut is hand-drawn (`dashboard/new_activities_donut_painter.dart`, `canvas.drawArc`). **No charting package.** Debounce timers use `dart:async` |
| HTTP | `dio` ^5.7 | Transport, `MultipartFile` for attachments and step files |
| REST client codegen | `retrofit` ^4.4 + `retrofit_generator` ^10.2 | `NewActivityApiService` → `.g.dart` |
| JSON codegen | `json_annotation` ^4.9 + `json_serializable` ^6.9 + `build_runner` | Every DTO `fromJson`/`toJson` |
| DI | `get_it` ^9.2 | `injector` in `lib/src/di/*` |
| State | `flutter_bloc` ^9.1 | Cubits, `BlocSelector`, `BlocProvider` |
| Value equality | `equatable` ^2.0 | States, `NewActivitySelection` |
| Dates / l10n formats | `intl` ^0.20 | `DateFormat` in the repo and mappers. Always `'en'` locale for wire formats |
| ARB → `S` class | `intl_utils` ^2.8 (`flutter_intl: enabled: true` in `pubspec.yaml:133`) + `flutter_localizations` | All UI strings |
| Shimmer placeholders | `shimmer` ^3.0 | `*_shimmer_widget.dart`, `new_activities_skeleton_box_widget.dart` |
| Toast | `fluttertoast` ^9.0 | "Can't edit" toast in `new_activities_screen.dart` `_onEditTap` |
| **GPS (platform-native)** | `geolocator` ^14.0 | `CurrentLocationService.current()`: high accuracy, 15 s timeout, returns `('', '')` on any error |
| **Runtime permissions (native)** | `permission_handler` ^12.0 (through the app's `PermissionServiceHandler`) | Location before GPS. Camera/photos in the shared attachment sheet |
| **Map (native view)** | `google_maps_flutter` ^2.10 | `LatLng` returned by `Routes.locationPickerScreen`, read in `new_activity_create_screen.dart:262` `_pickLocation` |
| Google Play Services check | `gms_check` ^1.0 | Only in `bottom_navigation_bar_screen.dart`, not in the module itself |
| **Files (native)** | `file_picker` ^10.3 | Step-question file answers (`sheets/new_activity_step_question_field_widget.dart:134`) and the "Files" option of the shared sheet |
| **Camera / gallery (native)** | `image_picker` ^1.1 | Inside the shared `showImgCameraBottomSheet` (create form attachments) |

---

## 3. Data layer

### 3.1 Request pipeline (`_call<D, R, T>` in the repository, lines 425–446)

1. `TalentLinkHrRequest<D>().createRequest(data)` wraps the DTO in the common envelope (§1.1).
2. Calls the Retrofit method.
3. Success = `response.success == true && response.statusCode == 200` → `DataSuccess(map(result), message)`.
4. Anything else → `DataFailed(message: responseMessage)`. A `DioException` → `DataFailed(error, e.message)`. Any other exception → `DataFailed(e.toString())`. **Nothing throws upward.**

Multipart calls (`insertVisitOrTask`, `checkInOut`, `startTask`, `completeTask`) send the envelope JSON-encoded as the `requestbody` part and each file as a `file` part.

### 3.2 Repository method → endpoint → request → mapper

| Repo method | Endpoint (Retrofit method) | Request built | Result mapper |
|---|---|---|---|
| `getActivities(query)` | `GetVisitAndTaskAssignedToLoggedInUser` | `NewActivitiesListRequest` (lines 67–90) | `NewRemoteActivitiesPage.mapToDomain` → `NewRemoteActivityMapper.mapToDomain` |
| `getMainActivities(query)` | `GetVisitAndTaskList` (typed `dynamic`) | `NewMainActivitiesRequest` (96–120) | `mapMainActivitiesPage` (hand-parsed, §4.2) |
| `getDashboard(query)` | `GetTaskAndVisitDashboard` | `NewActivitiesFilterRequest` (130–148) | `NewRemoteActivitiesDashboard.mapToDomain` |
| `getPriorities()` | `GetPriorityList` | `{}` | inline → `NewPriorityOption(id ?? 0, name ?? '')` |
| `getExecutionTypes(categoryId)` | `GetTaskExecutionTypeList` | `NewExecutionTypeRequest` (`{"id": categoryId}`) | inline → `NewExecutionType` |
| `getEmployeesWorkload(from,to)` | `GetEmployeeTasksORVisits` | `NewActivitiesFilterRequest(from, to, onlyMe: false)` | `mapWorkloadsToDomain` (by employeeId) |
| `getActivityDetails(id)` | `GetVisitOrTaskDetails` | `NewActivityIdRequest(id)`: **occurrence id** | `NewRemoteActivityDetailsMapper.mapToDomain(id)` |
| `getActivityMasterDetails(id)` | `GetVisitOrTaskMasterData` | `NewActivityIdRequest(id)`: **master id** | same mapper |
| `getActivityForEdit(id)` | `GetVisitOrTaskMasterData` | `NewActivityIdRequest(id)`: master id | `mapToSelection()` |
| `getActivityTimeline(id)` | `GetTaskHistoryTimeline` | `NewActivityIdRequest(id)` | `NewRemoteTimelineMapper.mapToDomain` |
| `createActivity(draft)` | `InsertVisitOrTask` (multipart) | `NewInsertActivityRequest` via `_insertRequest` (243–273) | `int?` id |
| `getStepForm(masterId, step)` | `GetTaskDynamicQuestion` | `TaskDynamicQuestionRequest(id: masterId, actionId: step.actionId)` | `RemoteDynamicForm.toDomain` |
| `checkInOut / startActivity / completeActivity` | `CheckInOutWithLongitudeLatitude` / `startTaskWithLongitudeLatitude` / `CompletedTask` (multipart) | `_submitStep` (355–383): `VisitOrTaskSubmitActionRequest{dataDetails, daynamicScreen[]}` | void |
| `changeStatus(id, statusId, note)` | `ChangeStatusWithReason` | `ChangeStatusForVisitOrTaskRequest(detailsId, statusId.toString(), statusReason)` | void |
| `reschedule(id, start, end, note)` | `RescheduleTask` | `RescheduleVisitOrTaskRequest(detailsId, newDate, newFromTime, newToTime, remarks, startDateTime, endDateTime)` | void |
| `addNote(id, note)` | `AddComment` | `AddCommentToVisitOrTaskRequest(detailsId, comment)` | void |
| `setEnabled(masterId, isEnabled)` | `ActiveDesactiveVisitOrTask` | `ActiveInActiveRequest(id: masterId, isEnabled)` | void |
| `updateProgress(id, progress)` | `UpdateTaskProgress` | `NewActivityProgressRequest(detailsId, progress)` | `progress.round().clamp(0,100)`, or the sent value if null |

### 3.3 Lookups loaded outside this repository

`NewGetActivitiesFilterDataUseCase` also calls old-module use cases:

| Data | Use case (old module) | Endpoint |
|---|---|---|
| Statuses | `GetTaskStatusUseCase` (`domain/usecase/visit/get_task_status_use_case.dart`) | `GetTaskStatusList` (`api_keys.dart:196`) |
| Visit categories (with `hasCheckIn`, `categoryTaskExecutionTypeList`, …) | `GetVisitCategoryUseCase` | `GetCategoryList` (`:201`) |
| Department / employee lists | `GetCompaniesAndEmployeesListUseCase` (`domain/usecase/my_team_request/`) | `Mobile/MyTeamRequests/GetCompaniesAndEmployeesList` (`:78`) |
| Contacts (create form) | `GetMyContactsMyTeamContactsUseCase`, `AddNewCompanyContactUseCase` | old visit endpoints |
| Current user / company | `GetCompanyIdUseCase`, `GetCompanyNameUseCase`, `GetEmployeeIdUseCase`, `GetUserNameUseCase` | SharedPreferences, no network |

### 3.4 Wire formats (DateFormat, all `'en'`)

| Field(s) | Format | Where |
|---|---|---|
| List / Main / dashboard / workload `fromDateTime`, `endDateTime` | `yyyy-MM-ddTHH:mm:ss` (`_formatDateTime`) | repo 420 |
| Insert `fromDate` / `toDate` | `yyyy-MM-ddT00:00:00` (`_dayStart` / `_dayEnd`, which are identical) | repo 61–62 |
| Insert `fromTime` / `toTime`, reschedule times | `HH:mm:ss` | repo 63 |
| Reschedule `newDate` | `yyyy-MM-dd` | repo 60 |
| Reschedule `startDateTime` / `endDateTime` | `yyyy-MM-ddTHH:mm:ss` | repo 64 |
| `direction` | `'desc'` for `newestFirst`, else `'asc'` | repo 84, 113 |
| `skip` | `(page - 1) * pageSize`, pageSize 10 | repo 82, 99 |

### 3.5 Hardcoded request values

| Value | Code |
|---|---|
| `onlyMe` from scope | `_onlyMe` (repo 123–127): `private → true`, **`all → true`**, `myTeam / myActivities → false`. The comment above it ("all: no only-me filter") and the `NewActivitiesScope.all` doc disagree with the code. See §9 |
| Main list "any" | `typeId 0`, `statusId 0`, `categoryId 0`, `currentOrOld 0`. `priorityId` is a **list**: `[]` = any (sending `0` gives a 500, per the DTO comment) |
| Assigned list / dashboard category | sent as a one-item list `[categoryId]` or `[]` |
| Insert, new activity | `id 0`, `statusId 1` and `isEnabled true` (DTO defaults). Edit sends the master `id` and the loaded `statusId` |
| Insert, visit-only fields | `visitCategory`, `taskExecutionType`, lat/lng, `companyContactName/Mobile` are null for tasks (`isVisit` checks in `_insertRequest`) |
| Insert, never sent | `addressText`, `companyContactId`, `companyContactEmail` (always null), `attachments` / `translate` (always `[]`). Even on edit, existing attachment ids are not sent back |
| Insert `companyId` | the envelope's logged-in `companyId`, not the picked department |
| Insert `onlyMe` | `draft.isPrivate` |
| Step submit, no form | `_noForm`: `DynamicQuestionForm(id: 0, …)` with no answers (`new_activity_steps_mixin.dart`) |
| Step `isCheckin` | `step == NewActivityStep.checkIn` |
| Step file answer `responseValue` | comma-joined file **names**. Files go as `file` parts. `dynamicControlsAttachments: []` |
| Step lat/lng | `''` unless the category's `locationRequired`. Also `''` if permission is denied or GPS fails |

---

## 4. Mapping: backend field → domain field

### 4.1 Assigned list item: `NewRemoteActivityMapper.mapToDomain()` (`new_remote_activity_mapper.dart`)

| Domain `NewActivity` | Source | Fallback |
|---|---|---|
| `id` | `detailsId` (occurrence) | `0` |
| `code` | `'#' + masterId` | `#0` |
| `type` | `NewActivityType.fromId(typeId)` | **unknown/missing → `task`** |
| `title` | `masterName` | `''` |
| `description` | `masterData.description` | `''` |
| `executionTypeId / Name` | `taskExecutionId / taskExecutionName` | null |
| `categoryId` | `masterData.visitCategoryId` if > 0 | null |
| `fromDateTime / endDateTime` | `masterData.fromDateTime / endDateTime` (ISO) | null (hidden in UI) |
| `addressText, latitude, longitude` | same-named fields | `''` |
| `status` | `status{id,name,color}` → `StatusVisit` | `0 / '' / ''` |
| `priority` | `priorityId > 0 → fromId`, else `fromName(priorityName)` | `fromId` unknown → **`low`**. `fromName` unknown → null |
| `isPrivate` | `onlyMe ?? masterData.onlyMe` | `false` |
| `companyId` | `masterData.companyId` | `0` |
| `assignedTo[0]` | `userId/userName`, `assignByName`. `assignById` and `canEdit` come from the matching `masterData.assignedTo` entry (by `assignToId == userId`, else the first) | `canEdit`: that entry's value, else the root `canEdit`, else `false` |
| `createdAt` | `createdAt` | start, then `DateTime.now()` |

### 4.2 Main list item: `mapMainActivitiesPage` (`new_remote_main_activities_mapper.dart`)

- The result is untyped. A `List` is used as-is with no total. A `Map` reads `items ?? data` and `totalCount`.
- Each item goes through the **old** `RemoteVisitAndTask.fromJson(...).mapToDomain()` and then `VisitAndTaskToNewActivity.mapToNewActivity`.
- `id = item.id` (**master id**). `code = '#id'`. `type` defaults to task as above. Execution type / category `0 → null`. `companyId` is always `0`.
- `isPrivate = json.onlyMe ?? json.masterData.onlyMe == true`. Priority works as in §4.1, read from the raw JSON.
- Dates: `startDateTime` / `endDateTime` (ISO or `M/d/yyyy[ h:mm:ss a | HH:mm:ss | HH:mm]`). Otherwise `fromDate` + `fromTime` (and `toDate` + `toTime`, where `toDate` falls back to `fromDate`).
- Total when none is sent: `skip + items.length + (items.length == pageSize ? 1 : 0)`. A full page means "maybe more".

### 4.3 Details / master: `NewRemoteActivityDetailsMapper.mapToDomain(activityId)`

| Domain | Source | Fallback / rule |
|---|---|---|
| `activity.id` | `details.id` (occurrence) | the `activityId` that was opened |
| `activity.code` | `'#' + id` (master) | |
| `status` | `details.status` (occurrence) | root `status` |
| `addressText / lat / lng` | occurrence value if non-empty | root value |
| `priority` | `priorityId == null ? fromName : fromId` | (no `> 0` guard here, unlike §4.1) |
| `categoryId / categoryName` | `visitCategory.id` (0 → null) / `.name` | |
| `isPrivate` | `onlyMe` | `false` |
| `companyId` | always `0` | |
| `assignedTo[0]` | occurrence `userId/userName`, else the matching `assignedTo` entry. `assignBy*` and `canEdit` come from that entry | `canEdit false` |
| `createdAt` | start | `now` |
| `progress` | `details.progress.round().clamp(0,100)` | `0` |
| `departmentName` | `companyName` | `''` |
| `isCheckedIn / isCheckedOut` | `details.*` | `false` |
| `hasCheckIn / hasCheckOut / locationRequired` | `visitCategory.*` | `false` |
| `masterId / masterStatusId` | root `id` / root `status.id` | `0` |
| `isEnabled` | `isEnabled` | **`true`** |
| `stepFormIds` | `visitCategory.actionForms` → `{actionId: dynamicFormId}`, only when `formId > 0` | `{}` |
| `attachments` | entries with a non-empty `documentFilePath` | |
| `notes` | `details.comments`: a string, or a map's `comment ?? text ?? note` | (the shape is not known yet) |
| `startedAt / endedAt / checkedInAt / checkedOutAt / progressUpdatedAt` | **not mapped**. Set only locally after a step (§6.2) | null |

### 4.4 Edit form: `mapToSelection()` (same file, line 106)

`id = master id`, `statusId = status.id ?? pending(1)`, `employeeIds` = `assignedTo[].assignToId > 0`, **or `[details.userId]` when that is empty**. `companyIds = [companyId]` only if private. Week/month days come from `weeklyDays[].id` / `monthlyDays[].id`. Location is set only if both lat and lng parse. Attachments become `NewActivityAttachment(name: fileName + id, path: filePath)`, with the remote path, not a local file.

### 4.5 Dashboard: `NewRemoteActivitiesDashboard.mapToDomain()`

`total = taskCount / visitCount`. `completed / inProgress / pending` = the count with that status id in `taskStatusList` / `visitStatusList`. `late = tasksLate / visitsLate`. Tasks only: `today / current / previous` from `taskSummary.totalTasks*`. Every null becomes `0`.

### 4.6 Timeline: `NewRemoteTimelineMapper.mapToDomain()`

`modifiedAt` is parsed as `M/d/yyyy h:mm:ss a`. **Entries that fail to parse are dropped.** Sorted oldest first. `actionId 0 → created`, `1 → checkedIn`, `2 → checkedOut`, anything else `other` (shown by `actionName`).

### 4.7 Workload: `mapWorkloadsToDomain()`

Grouped by `employeeId` (null groups are skipped). Every item in a group gets the group's `typeId` (unknown → task) and `createdDate` as `startAt` (fallback `now`).

---

## 5. Domain constants (hardcoded, local)

| Constant | Values | File |
|---|---|---|
| `NewActivityType` | task 1, visit 2. `fromId` unknown → task | `new_activity_type.dart` |
| `NewActivityPriority` | low 1, medium 2, high 3. `fromId` unknown → low. `fromName` matches the lower-cased enum name, else null | `new_activity_priority.dart` |
| `NewActivityStatusIds` | pending 1, inProgress 2, cancelled 3, completed 4, rejected 5, partiallyCompleted 7. `open = {1,2}`, `nonEditable = {3,4,5}` | `new_activity_status_ids.dart` |
| `NewActivityExecutionTypeIds` | oneTime 1, daily 2, weekly 3, monthly 4 | `new_activity_execution_type_ids.dart` |
| `NewActivityStep.actionId` | checkIn 1, checkOut 2, start 3, complete 4 | `new_activity_step.dart` |
| Week days | 1 = Saturday … 7 = Friday | `new_activity_selection.dart` doc |
| Default filter dates | `lastSevenDays`: today−6 at 00:00 → today 23:59 | `new_activities_filter.dart` |
| Time scope | current = (today 00:00, null). previous = (null, yesterday 00:00) | `new_activities_time_scope.dart` |
| Page size | 10 | `NewActivitiesQuery`, `NewActivitiesState` |
| Debounces | search 400 ms, progress 600 ms | search / progress mixins |
| Infinite scroll trigger | 200 px before the end | `new_activities_screen.dart` `_onScroll` |

Display names of statuses, priorities, categories and execution types come from the backend lookups. Only the **IDs** above are hardcoded.

---

## 6. Cubits and mixins

### 6.1 `NewActivitiesCubit` (list + dashboard)

Public entry points: `init`, `changeSelection({filter, sort, search})`, `resetFilter`, `changeView(view, {type})`, plus `refreshList`, `loadNextPage`, `loadDashboard`, `loadListAndDashboard` from the mixins.

| Method | Behaviour |
|---|---|
| `init()` | `await filterDataUseCase()` (never fails; failed parts are empty) → `filter = _defaultFilter` → list + dashboard |
| `_defaultFilter` | Employee with no team (`tree.isEmpty`) → `NewActivitiesFilter.initial()`. Otherwise `initial(companyIds: all tree companies, employeeIds: all tree employees)`. Scope `all`, last 7 days |
| `changeSelection` | Emits the new state. **Search only** → `debounceSearch()` (400 ms → `refreshList`). Otherwise cancels the search, `refreshList()`, and `loadDashboard()` if `filter != null` |
| `resetFilter` | Default filter → list + dashboard |
| `changeView` | Clears search. With `type` (summary-card tap) → `filter.withType(type)`. Switching to the list → `refreshList()`. **The dashboard is not reloaded** |
| `NewActivitiesListMixin.refreshList` | `++_listRequestKey`. Emits `loading, items: [], currentPage 1, hasMoreData true`. Loads page 1. Drops the result if the key changed |
| `loadNextPage` | Guard: `status == success && !isLoadingMore && hasMoreData`. Loads `state.currentPage`. Same key check |
| `_loadPage` | `filter.isMain ? mainListUseCase : listUseCase` |
| `_onPageLoaded` | Failure: `failure` only if there are no items yet (otherwise the items stay, and `errorMessage` is set). Success: append, `currentPage + 1`, `hasMoreData = items.length < totalCount` |
| `NewActivitiesSummaryMixin.loadDashboard` | Own request key. Query has `search ''` and `type null`, so the dashboard always counts both types |
| Query building | `NewActivitiesState.query(page)` → `filterData.scopeIds(filter)`: `myActivities / private` → the current user's company + self. Otherwise the picked `filter.companyIds / employeeIds`, or, if none are picked, **every tree company and employee** |

### 6.2 `NewActivityDetailsCubit`

`init(activityId, isMaster)`. `fetchDetails()` = `isMaster ? masterDetails : details`. `load()` runs the details and `filterDataUseCase()` **in parallel** (filter data supplies the statuses for the change-status sheet).

| Mixin | Methods | Notes |
|---|---|---|
| `NewActivityActionRunnerMixin` | `runAction(action, send, {expected, local})` | Ignored while an action is loading. Failure → `actionStatus failure` + `actionError`. Success → `hasChanges = true`, refetch. If the refetch fails, `expected(current)` is used. `local` stamps the times (`startedAt`, …) the backend doesn't return. `withStampsOf` keeps earlier stamps |
| `NewActivityStepsMixin` | `runStep(step)`, `submitStep(step, form)` | If `stepFormIds` has no form for `step.actionId` → submit `_noForm` straight away. Otherwise `GetTaskDynamicQuestion(masterId, actionId)`. If the form has questions → `state.stepQuestions` (the screen opens the sheet, then calls `submitStep`). The `expected` fallback: start → inProgress, complete → completed + progress 100 |
| `NewActivityEditsMixin` | `addNote`, `changeStatus(status, note)`, `reschedule(start, end)`, `toggleEnabled()` | `toggleEnabled` uses `masterId`. The rest use the opened `activityId`. `reschedule` sends no note |
| `NewActivityProgressMixin` | `updateProgress(int)`, `flushProgress()` | Moves at once, saves after 600 ms, rolls back to `_savedProgress` on failure. `flushProgress` runs on pop |

### 6.3 `NewActivityCreateCubit`

| Method | Behaviour |
|---|---|
| `init({activityId})` | Starts `_loadContacts()` without waiting. Runs `filterData` and (if editing) `getActivityForEdit(masterId)` in parallel. Edit failure → `loadFailure`. Employee with no team, or private → `_withFixedPeople` (company + self). Stores `initialSelection` (used by `hasChanges`). `_loadWorkload()` |
| `update(edit)` | The only way to edit the draft. Rules run in order: the type is locked when editing → `_updateExecutionTypeListOnCategoryChange` (drop the execution type if the new category doesn't offer it) → `_clearDaysOfOldExecutionType` → `_clearEndBeforeStart`. A type change → a fresh `NewActivitySelection(type)`. Private toggled on → fixed people. Toggled off → clears people (unless the user has no team). A date change → `_loadWorkload()` |
| `_loadWorkload` | Only when both dates are set. Drops stale replies. On failure the tree gets `null` workloads (no busy/available chip) |
| `addContact(name, phone)` | Old visit add-contact endpoint, then reloads the contacts |
| `submit()` | Guard: `!isSubmitting && hasChanges && canCreate`. → `created` or (`failure` then `editing`) |
| Validation (`NewActivitySelection.missingFields`) | title. Both dates. People (`companyIds` if private, else `employeeIds`). Visits also need: category, execution type, week days if weekly, month days if monthly, location |

### 6.4 `NewActivityTimelineCubit`

`init(activityId)` → `load()` → `loading → success(events) / failure`. It is created inside `NewActivityTimelineScreen` (the route passes a `NewActivity`, not a cubit).

---

## 7. Screens: triggers, states, pagination, filter flow

### 7.1 `NewActivitiesScreen` (tab + `/newActivities`)

| UI event | Cubit call → API |
|---|---|
| `initState` | `init()` → status, priority, category, N× execution type (one per category, de-duplicated), workload (now..now), companies/employees → list + dashboard |
| Search typing | `changeSelection(search)` → debounce → list only |
| Quick chip Current / Previous | `withTimeScope` (tap again → `withoutListChip`) → list + dashboard |
| Quick chip Main | `withMain` / `withoutListChip` → **Main endpoint** for the list + dashboard |
| Quick chip Department | `NewCompanyEmployeePickerSheet` → `withPeople(companyIds, employeeIds)`. Does nothing for an employee with no team |
| Quick chip Type / Scope / Status / Priority | `OptionsBottomSheetWidget` → `withType / withScope / withStatus / withPriority` |
| Sort | options sheet → `changeSelection(sort)` → list only |
| Filter sheet Apply / Reset | `changeSelection(filter)` / `resetFilter()` |
| Summary card tap | `changeView(list, type)` |
| Scroll within 200 px of the end | `loadNextPage()` |
| Pull to refresh (list) | `refreshList` |
| Card tap | push `/newActivityDetails` with `NewActivityDetailsArgs(activity.id, isMaster: filter.isMain)`. If it returns `true` → `loadListAndDashboard()` |
| Edit (pencil, Main cards only) | `activity.canEdit` false → toast (text depends on status). Otherwise push `/newActivityCreate` with `activity.id`. If it returns `true` → list + dashboard |
| FAB add | push `/newActivityCreate`. If it returns `true` → list + dashboard |

**Filter flow:** UI → `NewActivitiesFilter` (immutable, edited by the `with*` extension in `new_activities_filter_updates.dart`) → `state.filter` → `state.query()` adds `scopeIds` → `NewActivitiesQuery` → the repository builds `NewActivitiesListRequest` / `NewMainActivitiesRequest` / `NewActivitiesFilterRequest`.

Filter sheet sections (`filter/new_activities_filter_chip_sections_widget.dart`): Type only on the dashboard (`isDashboardOpened`). Status if the lookup isn't empty. Priority only on the dashboard. Category and execution type only on the list **and** when type == visit. Any section whose lookup is empty is hidden.

**States:**
- Whole screen: `isFilterDataLoading` → shimmer only (`common/new_activities_loading_gate_widget.dart`).
- List (`list/new_activities_results_widget.dart`): `initial/loading` → list shimmer. `failure` → `NewActivitiesMessageWidget(somethingWentWrong, onRetry: refreshList)`. `success` + empty → `newActivitiesEmpty` message. Otherwise a `SliverList`, plus one card shimmer at the end while `isLoadingMore`. A next-page failure keeps the items and shows nothing.
- Dashboard (`dashboard/new_activities_dashboard_view.dart`): `failure` → message + retry (`loadDashboard`). `dashboard == null` → shimmer. Otherwise the content (the donut + Tasks/Visits summary cards, and the date range from the filter).

### 7.2 `NewActivityDetailsScreen` (`/newActivityDetails`, args `NewActivityDetailsArgs{activityId, isMaster}`)

- States: `loading` → `NewActivityDetailsShimmerWidget`. `failure` → message + retry (`load`). `success` → body + bottom bar (Detail actions, or Master actions).
- Action results are handled in a listener: loader during `actionStatus loading`, error from `actionError`. `stepQuestions` opens `NewActivityStepQuestionsSheetWidget`.
- On pop, `flushProgress()` runs, then it returns `state.hasChanges`.
- **Detail** (not master) body: status pill. Reschedule and change status only when status ∈ open. Timeline link. Progress slider enabled only when inProgress. Bottom bar (`widgets/new_activity_details_actions_widget.dart`): Add note (open only). For visits, Check-in (if `hasCheckIn` and not checked in) → else Check-out (enabled if `hasCheckOut` and not checked out). Both disabled once completed. Start when pending → otherwise End (enabled only when inProgress → `runStep(complete)`).
- **Master** body: no progress, timeline, reschedule or notes. A single Enable/Disable button, disabled when `masterStatusId ∈ nonEditable` (`widgets/new_activity_details_master_actions_widget.dart`).
- Sheets (`sheets/`): add note, change status (statuses from `filterData`), change schedule (start/end pickers), step questions (dynamic fields, with files through `file_picker`).

### 7.3 `NewActivityCreateScreen` (`/newActivityCreate`, args `int? activityId` = master id)

- States (`NewActivityCreateStatus`): `isFilterDataLoading` → form shimmer. `submitting` → loader. `created` → success dialog, then `pop(true)`. `failure` → failure dialog, stays on the form. `loadFailure` → failure dialog, then pop.
- Pickers: type switch (Visit is the default) · priority · private toggle · dates · people (`NewCompanyEmployeePickerSheet`, with busy/available chips from the workload) · category → execution type (only the types `categoryTaskExecutionTypeList` offers, not deleted) · week/month days · location (`Routes.locationPickerScreen` → `LatLng`) · contact sheet (saved contacts or add a new one) · description · attachments (`showImgCameraBottomSheet`: camera, gallery, files).
- Create tap with fields missing → `showMissingFields()` outlines them, and the screen scrolls to `firstMissingField`.

### 7.4 `NewActivityTimelineScreen` (`/newActivityTimeline`, args `NewActivity`)

`loading / failure (retry) / success`. Events are grouped by day, with a summary card.

---

## 8. DI wiring (GetIt `injector`, all `registerFactory`)

| File | Lines | Registers |
|---|---|---|
| `lib/src/di/data_layer_injector.dart` | 222–223 | `NewActivityApiService(dio)` |
| `lib/src/di/repository_injector.dart` | 157–158 | `NewActivityRepository → NewActivityRepositoryImplementation` |
| `lib/src/di/use_case_injector.dart` | 713–714 | `NewGetMainActivitiesUseCase` |
| `lib/src/di/use_case_injector.dart` | 806–856 | every other `New*UseCase`, `CurrentLocationService`, `NewActivityStepRequestBuilder`, `NewBuildCompanyEmployeeTreeUseCase`, `NewGetActivitiesFilterDataUseCase` (9 deps) |
| `lib/src/di/bloc_injector.dart` | 440–468 | `NewActivitiesCubit`, `NewActivityDetailsCubit`, `NewActivityTimelineCubit`, `NewActivityCreateCubit` |

Cubits are provided in `routes_manager.dart:321–355`, and for the tab in `bottom_navigation_bar_screen.dart:74`.

---

## 9. Code smells, stale comments, dead code (current status)

| # | Where | Status today |
|---|---|---|
| S1 | `domain/usecase/new_activities/fake/` (3 files: fake activities, companies, lookups) | **Dead code.** Nothing references `NewActivitiesFake*` outside the folder. Safe to delete. The DI comment at `use_case_injector.dart:805` still says "fake until the backend is ready", but every use case uses the real repository |
| S2 | `_onlyMe` (repo 123–127) | Code sends `onlyMe: true` for scope **All**. The comment on the method and the `NewActivitiesScope.all` doc both say All sends no only-me filter |
| S3 | `NewActivitiesFilterRequest.onlyMe` | A non-null `bool`, with a stale doc saying "Null: no only-me filter" |
| S4 | Leftover `print` calls | repo :68, `new_remote_activity_mapper.dart:16`, `new_activity_create_cubit.dart:50` (marked "TEMP debug") and :208, `new_activities_screen.dart:209–211`, `new_activity_details_content.dart:28–30`, `new_activity_create_screen.dart:167–168` |
| S5 | Repo `setEnabled` (338) | Has the doc comment that belongs to `updateProgress` ("Resolves to the progress…") |
| S6 | `_dayStart` / `_dayEnd` | Identical formats (`T00:00:00`). `_dayEnd` adds nothing |
| S7 | Main list `getVisitAndTaskList` | Typed `dynamic` and parsed by hand. It supports both list and page shapes because the response shape isn't documented. Items go through the old `RemoteVisitAndTask` model |
| S8 | `_commentText` in the details mapper | Guesses the comment shape (string, or a map with `comment/text/note`) |
| S9 | Detail timestamps (`startedAt`, `checkedInAt`, …) | Never mapped from the backend. Set locally only after the user taps a step, so they are lost on reload |
| S10 | Insert request | Never sends `addressText`, `companyContactEmail/Id`, or existing `attachments` ids. Edit re-sends no attachments |
| S11 | `companyId` on `NewActivity` | Always `0` from the Main list and details mappers. Only the assigned list fills it |
| S12 | Priority mapping is inconsistent | Assigned list guards `priorityId > 0`. Details doesn't, so `priorityId 0` maps to `low` there |
| S13 | `NewActivitiesScope.myTeam` doc | Says "every company and employee id", which matches `scopeIds`, but `_onlyMe` sends `false` for both myTeam and myActivities. So the two differ only in the ids sent |
| S14 | Folder naming | Data/repo folders are `new_visit/`, while domain/presentation folders are `new_activit*/` |
