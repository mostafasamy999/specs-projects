# 001 New Activities — API contracts (HIGH-LEVEL)

> **Doc v2.0 · 2026-10-27 · synced to changelog CL-10**
> Checked against the code on `enhance/activities` @ `425fc38f`. This replaces API contracts v1.2 (in git history, commit `9beba0d`), which had the full JSON shapes.
> Use this file to answer **"which endpoint / field do I touch for X, and what value goes in it?"** Field-by-field DTOs, mappers and fallbacks are in [current-state-codebase-logic-tech.md](current-state-codebase-logic-tech.md) §3–§5. Open API questions (Qn) are in [next-tasks-open-questions.md](next-tasks-open-questions.md).

## 1. Conventions (all endpoints)

- `POST Mobile/VisitAndTask/<Name>`, relative to the flavor's base URL. The real prefix (`v2/`?) is unconfirmed (Q22).
- JSON bodies sit in the common envelope's `data` (user, company, device and language are filled in by the app). The multipart endpoints send that envelope as the `requestbody` part and each file as a `file` part.
- Success = `success == true` **and** `statusCode == 200`. Anything else fails with `responseMessage`. The failure codes aren't documented (Q24).
- All dates use English digits. The formats are in §4.

## 2. Endpoints

| # | Endpoint | Purpose | Request DTO | Response type |
|---|---|---|---|---|
| E1 | `GetTaskAndVisitDashboard` | Dashboard counts (totals, per status, late, today/current/previous for tasks) | `NewActivitiesFilterRequest` | `NewRemoteActivitiesDashboard` |
| E2 | `GetVisitAndTaskAssignedToLoggedInUser` | List: activity **occurrences** (default, Current, Previous), paged | `NewActivitiesListRequest` | `NewRemoteActivitiesPage` |
| E3 | `GetVisitAndTaskList` | **Main** list: the activities themselves (masters), paged | `NewMainActivitiesRequest` | untyped. Page or plain list (Q18) |
| E4 | `GetPriorityList` | Priority lookup | `{}` | `List<RemoteLookUp>` |
| E5 | `GetTaskExecutionTypeList` | Execution types offered by one visit category | `NewExecutionTypeRequest` | `List<RemoteLookUp>` |
| E6 | `GetEmployeeTasksORVisits` | Employee workload for the people picker (busy/available) | `NewActivitiesFilterRequest` | `List<NewRemoteEmployeeActivities>` |
| E7 | `GetVisitOrTaskDetails` | One occurrence, for the **Detail** screen | `NewActivityIdRequest` | `NewRemoteActivityDetails` |
| E8 | `GetVisitOrTaskMasterData` | One master, for the **Master** screen **and** the edit form | `NewActivityIdRequest` | `NewRemoteActivityDetails` |
| E9 | `GetTaskHistoryTimeline` | History of one occurrence | `NewActivityIdRequest` | `List<NewRemoteTimelineEntry>` |
| E10 | `InsertVisitOrTask` (multipart) | Create, or update when `id ≠ 0` | `NewInsertActivityRequest` + files | `int?` |
| E11 | `GetTaskDynamicQuestion` | The question form for one step (check-in/out, start, complete) | `TaskDynamicQuestionRequest` | `RemoteDynamicForm` |
| E12 | `CheckInOutWithLongitudeLatitude` (multipart) | Check in or out (visits) | `VisitOrTaskSubmitActionRequest` + files | `int?` |
| E13 | `startTaskWithLongitudeLatitude` (multipart) | Start | same as E12 | `int?` |
| E14 | `CompletedTask` (multipart) | Complete ("End") | same as E12 | `int?` |
| E15 | `ChangeStatusWithReason` | Change status with a note | `ChangeStatusForVisitOrTaskRequest` | `int?` |
| E16 | `RescheduleTask` | New start/end | `RescheduleVisitOrTaskRequest` | `int?` |
| E17 | `AddComment` | Add a note | `AddCommentToVisitOrTaskRequest` | `int?` |
| E18 | `ActiveDesactiveVisitOrTask` | Enable/disable a master | `ActiveInActiveRequest` | `int?` |
| E19 | `UpdateTaskProgress` | Save progress 0–100 | `NewActivityProgressRequest` | `NewRemoteActivityProgress` |

Endpoints from other modules that this one also calls: `GetTaskStatusList` (statuses), `GetCategoryList` (visit categories), `MyTeamRequests/GetCompaniesAndEmployeesList` (department/employee tree), plus the old visit endpoints for saved contacts and adding a contact.

## 3. Lookups: local constant or fetched?

| Lookup | Source | IDs hardcoded in the app? |
|---|---|---|
| Type (Task / Visit) | **Local only.** No endpoint | Yes: task 1, visit 2 |
| Status | Fetched: `GetTaskStatusList` (names, colors) | Yes, for logic: 1 Pending, 2 In progress, 3 Cancelled, 4 Completed, 5 Rejected, 7 Partially completed |
| Priority | Fetched: E4 (names) | Yes, for mapping: 1 low, 2 medium, 3 high |
| Visit category | Fetched: `GetCategoryList` (also carries check-in/out flags, location-required flag, step forms, allowed execution types) | No |
| Execution type | Fetched: E5, once per category (filter sheet merges them; create form uses the category's own list) | Yes, for logic: 1 one-time, 2 daily, 3 weekly, 4 monthly |
| Step / action | **Local only** | Yes: check-in 1, check-out 2, start 3, complete 4 |
| Week days / month days | **Local only** | 1 = Saturday … 7 = Friday. Month days 1–31 |
| Departments / employees | Fetched (other module) | No |
| Scope (All / My team / My activities / Private) | **Local only.** Turned into `onlyMe` + ID lists (§4) | n/a |

## 4. Value rules: decisions you need to know

| Question | Rule (as the code does it today) |
|---|---|
| **Is `typeId` a constant or a lookup?** | A local constant: 1 task, 2 visit. An unknown `typeId` coming back is shown as a **Task** |
| **Scope → `onlyMe` (E1, E2, E3)** | All → `true` · Private → `true` · My team → `false` · My activities → `false`. ⚠ The code comments say All should send *no* only-me filter. Unconfirmed (Q16) |
| **Scope → company/employee IDs (E1, E2, E3)** | My activities / Private → the user's own company + self. All / My team → the picked departments/employees, or **every** allowed department and employee when nothing is picked. There is no separate department field: departments travel as `companyId[]` (Q15) |
| **Create `onlyMe` (E10)** | `onlyMe` = the Private toggle. A private activity's people are fixed to the creator |
| **Master ID or occurrence ID?** | **Occurrence** (`detailsId`): E7, E9, E12–E17, E19. **Master**: E8, E10 (update), E11, E18. E2 list items carry the occurrence ID. E3 (Main) items carry the master ID |
| **Which screen calls which details endpoint** | Card from E2 → Detail screen → E7. Card from E3 (Main) → Master screen → E8. Edit (Main cards only) → E8 → E10 with that master ID |
| **"Any" / no filter** | E1/E2: `null` for single IDs, `[]` for lists. E3: `0` for single IDs, `[]` for lists |
| **Category: single or list?** | E1/E2 send `categoryId` as a one-item list. E3 sends a single int |
| **Priority: single or list?** | E2 single `priorityId`. E3 **list** `priorityId[]` (sending a plain `0` gives a 500). E1 doesn't send priority |
| **`currentOrOld` (E3)** | Always `0` (all). Current/Previous are sent as date ranges on E2 instead. Main ignores them |
| **Date ranges (E1, E2, E3, E6)** | `fromDateTime` / `endDateTime` as `yyyy-MM-ddTHH:mm:ss`. Either end can be `null` (open). Default is today−6 00:00 → today 23:59. Current = today 00:00 → open. Previous = open → yesterday 00:00. Inclusive or exclusive end? (Q14). The format itself is unconfirmed (Q23) |
| **Workload window (E6)** | Filter screens: now → now. Create form: the picked start → end. `onlyMe` is always `false` (Q17) |
| **Create/update dates (E10)** | `fromDate` / `toDate` = the day at `T00:00:00`. `fromTime` / `toTime` = `HH:mm:ss` |
| **Create vs update (E10)** | `id = 0` creates (status 1, enabled). `id = masterId` updates and sends back the loaded `statusId`. `companyId` is always the logged-in company |
| **Visit-only fields (E10)** | Category, execution type, lat/lng, contact name/mobile. All `null` for tasks. Week days only if weekly, month days only if monthly |
| **Fields E10 never fills** | `addressText`, `companyContactId`, `companyContactEmail`, `attachments` (IDs of existing files), `translate` |
| **Step form ID (E11 → E12–E14)** | The form is fetched only if the category maps that action to a form ID > 0. Otherwise the step is sent with form `0` and no answers |
| **Step location (E12–E14)** | GPS lat/lng only if the category says location is required. Otherwise `''`. Also `''` when permission is denied or GPS fails |
| **Step file answers** | The answer value is the comma-joined file **names**. The files themselves go as `file` parts |
| **`statusId` on E15** | Sent as a **string** |
| **Progress (E19)** | Integer 0–100. The app shows the value the backend echoes back |
| **Sort** | `direction`: `desc` = newest first, `asc` = oldest first, by scheduled start. E1 has no sort |
| **Paging** | `skip = (page − 1) × 10`, `pageSize = 10`. E2 returns `totalCount`. For E3 without a total, a full page means "maybe more" |

## 5. Which request carries which filter

| Filter | E1 Dashboard | E2 List | E3 Main |
|---|---|---|---|
| Type | — (always both) | ✓ | ✓ |
| Status | ✓ | ✓ | ✓ |
| Priority | — (Q26) | ✓ | ✓ (list) |
| Category | ✓ | ✓ | ✓ (single) |
| Execution type | ✓ | ✓ | — (Q27) |
| Dates | ✓ | ✓ | ✓ |
| Scope (`onlyMe` + IDs) | ✓ | ✓ | ✓ |
| Search | — (Q26) | ✓ | ✓ |
| Sort / paging | — | ✓ | ✓ |
| Main chip | — (Q25) | switches the list from E2 to E3 | |

What `searchValue` matches is unknown (Q19). Whether E2 returns other employees' activities when it's sent team IDs is unknown (Q28).

## 6. Response fields still unconfirmed

Dashboard status-list field names (Q20) · `details.comments` shape (Q21) · Main list shape (Q18) · workload status field (Q12) · per-action permission flags beyond `assignedTo[].canEdit` (Q13) · meaning of the `int?` results · whether priority names are localized.
