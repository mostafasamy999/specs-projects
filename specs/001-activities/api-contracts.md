# 001 New Activities: API Contracts

**Version:** 1.2 (matches [business-requirements.md](business-requirements.md))  
**Last updated:** 2026-10-21  
**Evidence:** the previous spec docs, plus the app code at `~/StudioProjects/talentlink`, `testflight` @ `a01b46459`:
- `lib/src/data/sources/remote/api_keys.dart` (paths)
- `lib/src/data/sources/remote/talent_link_hr/new_visit/` (Retrofit service and DTOs)
- `lib/src/data/repositories/new_visit/new_activity_repository_implementation.dart` (what is actually sent)
- the shared classes under `talent_link_hr/` and `talent_link_hr/visit/model/`

**About the examples:** no captured request or response exists in either repo. The JSON blocks below are **shapes taken from the DTOs**. Their values are type placeholders, not real data. Anything the code doesn't show is marked **TBD**. Open items refer to the question numbers in [open-questions.md](open-questions.md).

---

## 1. Conventions shared by every endpoint

### 1.1 Method and path

- Every endpoint is `POST`.
- The path in code is `Mobile/VisitAndTask/<Name>`, relative to the Dio base URL. The base URL comes from the saved setting or `Flavor.baseUrl` (`di/data_layer_injector.dart`). The commented-out base URLs in that file end in `api/v2/`, so the docs refer to these endpoints as `v2/Mobile/VisitAndTask/<Name>`. **TBD (Q22):** the real prefix for each flavor.
- All endpoints go through `NewActivityApiService` (Retrofit), which DI registers at `di/data_layer_injector.dart:222`.

### 1.2 Request envelope (`TalentLinkHrRequest`)

Every JSON request wraps its body in `data`. The app fills the other fields from shared preferences and the device:

```json
{
  "userId": "<int, default 0>",
  "subscriberId": "<int, default 0>",
  "companyId": "<int, the logged-in company, default 0>",
  "langId": "<string, default \"en\">",
  "deviceTypeCode": "<int, default 1>",
  "deviceToken": "<string, the Firebase token, default \"\">",
  "deviceSerial": "<string, default \"\">",
  "appVersion": "<string, default \"\">",
  "oSVersion": "<string, default \"\">",
  "data": "<the endpoint's body, described below>"
}
```

### 1.3 Multipart endpoints

`InsertVisitOrTask`, `CheckInOutWithLongitudeLatitude`, `startTaskWithLongitudeLatitude` and `CompletedTask` are `multipart/form-data`:
- `requestbody` is a JSON-encoded string of the full envelope (§1.2), with the endpoint body in `data`.
- Each file goes in a separate `file` part.

### 1.4 Response envelope (`TalentLinkResponse<T>`)

```json
{
  "statusCode": "<int>",
  "requestId": "<string>",
  "error": ["<string>"],
  "success": "<bool>",
  "responseMessage": "<string>",
  "result": "<T, described per endpoint>"
}
```

### 1.5 Error handling (as implemented)

- **Success** means `success == true` **and** `statusCode == 200`. Then `result` is mapped, and `responseMessage` is passed along as the message.
- Any other response becomes `DataFailed(message: responseMessage)`. The `error` array is not read.
- A `DioException` becomes `DataFailed(error, message: e.message)`. Any other exception becomes `DataFailed(message: e.toString())`.
- The interceptors are `ChuckerDioInterceptor`, `AuthInterceptor` and `NetworkExceptionInterceptor`.
- **TBD (Q24):** the backend's failure `statusCode` values and `error` contents.

### 1.6 Formats and IDs

| Item | Value | Source |
|---|---|---|
| Filter date-times (list, Main list, dashboard, workload) | `yyyy-MM-ddTHH:mm:ss` (for example `2026-10-14T11:00:00`). `null` leaves that end open. | Repository `_formatDateTime`. The dashboard/workload DTO comment says `yyyy-MM-dd`. **TBD (Q23).** |
| `endDateTime` bound | Inclusive or exclusive: **TBD (Q14)** | — |
| Create dates | `fromDate` / `toDate` as `yyyy-MM-ddT00:00:00`. `fromTime` / `toTime` as `HH:mm:ss`. | Insert DTO and repository |
| Reschedule | `newDate` as `yyyy-MM-dd`. Times as `HH:mm:ss`. `startDateTime` / `endDateTime` as `yyyy-MM-ddTHH:mm:ss`. | Repository |
| Activity type (`typeId`) | 1 = Task, 2 = Visit | DTO comments, `new_activity_type.dart` |
| Status IDs | 1 Pending, 2 In Progress, 3 Cancelled, 4 Completed, 5 Rejected, 7 Partially Completed. 6 is not used. | Confirmed (Q3) |
| Sort `direction` | `desc` (newest first, the default) or `asc` (oldest first), by scheduled start | Confirmed (Q8) |
| Step / timeline `actionId` | 0 added, 1 check in, 2 check out, 3 start, 4 complete | `new_remote_timeline_entry.dart`, `new_remote_action_form.dart` |
| Weekly days | 1 = Saturday … 7 = Friday | `new_remote_activity_details.dart` |
| Monthly days | 1 … 31 | `new_remote_activity_details.dart` |
| IDs | **Master ID** = the activity. **Details/occurrence ID** = one activity assigned to one employee. | DTO comments |

**Backend spellings the code depends on (don't "fix" them client-side):** `detailsid` (list item), `addressTest` (list item), `longtitude`, `modifiedByNAme`, `assinToId` / `assinToName` / `assinById` / `assinByName`, `DaynamicScreen`, `lable`, `controleWidth` and `islookup`.

### 1.7 Scope → request fields (as implemented)

`onlyMe` and the company/employee lists come from the selected scope. **TBD (Q15, Q16).**

| Scope | `onlyMe` | `companyId` / `employeeId` |
|---|---|---|
| All | `true` | The picked companies/employees, or else every company and employee in the user's tree |
| My team | `false` | Same as All |
| My activities | `false` | The user's allowed companies and employees |
| Private | `true` | The user's allowed companies and employees |

Source: `_onlyMe()` in the repository, `NewActivitiesFilterData.scopeIds`. The business rule is in [business-requirements.md §7.3](business-requirements.md#73-filter-rules-confirmed-q5).

---

## 2. Endpoint summary

| # | Endpoint (`Mobile/VisitAndTask/…`) | Repository method | Body (`data`) | Result |
|---|---|---|---|---|
| 3.1 | `GetTaskAndVisitDashboard` | `getDashboard` | `NewActivitiesFilterRequest` | `NewRemoteActivitiesDashboard` |
| 3.2 | `GetVisitAndTaskAssignedToLoggedInUser` | `getActivities` | `NewActivitiesListRequest` | `NewRemoteActivitiesPage` |
| 3.3 | `GetVisitAndTaskList` (Main list, shared with the old module) | `getMainActivities` | `NewMainActivitiesRequest` | Undocumented (`dynamic`) |
| 3.4 | `GetPriorityList` | `getPriorities` | `{}` | `List<RemoteLookUp>` |
| 3.5 | `GetTaskExecutionTypeList` | `getExecutionTypes` | `{ "id": categoryId }` | `List<RemoteLookUp>` |
| 3.6 | `GetEmployeeTasksORVisits` | `getEmployeesWorkload` | `NewActivitiesFilterRequest` | `List<NewRemoteEmployeeActivities>` |
| 3.7 | `GetVisitOrTaskDetails` | `getActivityDetails` | `{ "id": <occurrence id> }` | `NewRemoteActivityDetails` |
| 3.8 | `GetVisitOrTaskMasterData` | `getActivityMasterDetails`, `getActivityForEdit` | `{ "id": <master id> }` | `NewRemoteActivityDetails` |
| 3.9 | `GetTaskHistoryTimeline` | `getActivityTimeline` | `{ "id": … }` | `List<NewRemoteTimelineEntry>` |
| 3.10 | `InsertVisitOrTask` (multipart) | `createActivity` | `NewInsertActivityRequest` | `int?` |
| 3.11 | `GetTaskDynamicQuestion` | `getStepForm` | `{ "id": masterId, "actionId": … }` | `RemoteDynamicForm` |
| 3.12 | `CheckInOutWithLongitudeLatitude` (multipart) | `checkInOut` | Step submission | `int?` |
| 3.13 | `startTaskWithLongitudeLatitude` (multipart) | `startActivity` | Step submission | `int?` |
| 3.14 | `CompletedTask` (multipart) | `completeActivity` | Step submission | `int?` |
| 3.15 | `ChangeStatusWithReason` | `changeStatus` | `ChangeStatusForVisitOrTaskRequest` | `int?` |
| 3.16 | `RescheduleTask` | `reschedule` | `RescheduleVisitOrTaskRequest` | `int?` |
| 3.17 | `AddComment` | `addNote` | `AddCommentToVisitOrTaskRequest` | `int?` |
| 3.18 | `ActiveDesactiveVisitOrTask` | `setEnabled` | `ActiveInActiveRequest` | `int?` |
| 3.19 | `UpdateTaskProgress` | `updateProgress(int activityId, int progress)` | `NewActivityProgressRequest` | `NewRemoteActivityProgress` |

For every `int?` result, **TBD:** what the integer means. The code ignores it, except for create, which returns it to the caller.

---

## 3. Endpoints

### 3.1 Dashboard: `GetTaskAndVisitDashboard`

**Purpose:** the Visit and Task summaries, the Visits-vs-Tasks chart and the per-status counts for the Activities Dashboard (approved metrics, Q10).

**Request `data`** (`NewActivitiesFilterRequest`, sent with `includeIfNull`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `typeId` | int? | no | 1 Task, 2 Visit. `null` = both. |
| `statusId` | int? | no | `null` = any |
| `fromDateTime` | string? | no | §1.6. `null` = open. |
| `endDateTime` | string? | no | §1.6. `null` = open (Q14). |
| `employeeId` | int[] | yes (may be empty) | §1.7 |
| `companyId` | int[] | yes (may be empty) | §1.7 |
| `categoryId` | int[] | yes (may be empty) | Visit category. At most one ID is sent. |
| `onlyMe` | bool | yes | §1.7 |
| `executionTypeId` | int? | no | Visit execution type |

**Response `result`:**

```json
{
  "taskCount": "<int>",
  "visitCount": "<int>",
  "taskStatusList": [{ "statusId": "<int>", "statusName": "<string>", "count": "<int>" }],
  "visitStatusList": [{ "statusId": "<int>", "statusName": "<string>", "count": "<int>" }],
  "taskSummary": { "totalTasksToday": "<int>", "totalTasksCurrent": "<int>", "totalTasksPrevious": "<int>" },
  "visitSummary": { "totalVisitsToday": "<int>", "totalVisitsCurrent": "<int>", "totalVisitsPrevious": "<int>" },
  "tasksLate": "<int>",
  "visitsLate": "<int>"
}
```

**Mapping:** completed, in-progress and pending counts are summed from the status lists by status ID (4, 2, 1). Missing numbers become 0. The visit summary's today/current/previous counts are parsed but not mapped into the domain.

**TBD:** the status-list item field names (Q20). The saved Postman example had empty lists.

### 3.2 Activities list: `GetVisitAndTaskAssignedToLoggedInUser`

**Purpose:** a paginated list of activity occurrences for the Current and Previous views and the filters.

**Request `data`** (`NewActivitiesListRequest`, sent with `includeIfNull`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `typeId` | int? | no | 1 Task, 2 Visit, `null` = both |
| `fromDateTime` | string? | no | §1.6. Current = today 00:00. Previous = `null`. |
| `endDateTime` | string? | no | Current = `null`. Previous = today 00:00, or 00:00 − 1s if inclusive (Q14). The code still sends yesterday 00:00 until WP1. |
| `statusId` | int? | no | |
| `priorityId` | int? | no | A single ID (unlike the Main list) |
| `categoryId` | int[] | yes (may be empty) | Visit category, at most one |
| `employeeId` | int[] | yes (may be empty) | §1.7 |
| `companyId` | int[] | yes (may be empty) | §1.7 |
| `onlyMe` | bool? | no | §1.7. The code always sends true or false. |
| `executionTypeId` | int? | no | |
| `skip` | int | yes | `(page − 1) × pageSize` |
| `pageSize` | int | yes | |
| `direction` | string | yes | `desc` / `asc` |
| `searchValue` | string | yes | Default `""`. What it matches is TBD (Q19). |

There is no department field. **TBD (Q15).**

**Response `result`:**

```json
{
  "totalCount": "<int>",
  "items": ["<NewRemoteActivity, §4.1>"]
}
```

**Pagination:** `skip` / `pageSize` in, `totalCount` out. A missing `totalCount` maps to 0. The paging rules are in [business-requirements.md §8.1](business-requirements.md#81-pagination-and-data-refresh).

### 3.3 Main list: `GetVisitAndTaskList`

**Purpose:** master (main) activities for the Main quick filter. The endpoint is shared with the old module (`APIKeys.getVisitAndTask`).

**Request `data`** (`NewMainActivitiesRequest`, sent with `includeIfNull`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `typeId` | int | yes | 0 = any, 1 Task, 2 Visit |
| `statusId` | int | yes | 0 = any |
| `priorityId` | int[] | yes | **A list.** Empty = any. A plain `0` makes the backend fail with 500. |
| `categoryId` | int | yes | A single ID. 0 = any. |
| `currentOrOld` | int | yes | 0 all, 1 current, 2 previous. The code always sends 0. |
| `fromDateTime` / `endDateTime` | string? | no | From the filter sheet's range only |
| `employeeId` / `companyId` | int[] | yes | §1.7 |
| `onlyMe` | bool? | no | §1.7 |
| `skip` / `pageSize` | int | yes | |
| `direction` | string | yes | `desc` / `asc` |
| `searchValue` | string | yes | Default `""` |

**Response `result`:** **TBD (Q18).** The code (`mapMainActivitiesPage`) accepts either:
- a map with `items` (or `data`) and an optional `totalCount`, or
- a plain list.

Each item is read with the old module's `RemoteVisitAndTask`, plus `onlyMe` (or `masterData.onlyMe`), `priorityId` / `priorityName`, `startDateTime` and `endDateTime`. Without a total, a full page means "there may be more".

### 3.4 Priorities: `GetPriorityList`

**Purpose:** the priority lookup for the filters and the create form.

**Request `data`:** `{}`

**Response `result`:** `[{ "id": "<int>", "name": "<string>" }]` (`RemoteLookUp`)

The original spec expected Arabic and English labels where supported. The code reads only `name`, and the request carries `langId`. **TBD:** whether `name` is already localized by `langId`.

### 3.5 Visit execution types: `GetTaskExecutionTypeList`

**Purpose:** execution types for one visit category (a Visit-only filter and create field).

**Request `data`:** `{ "id": "<int, the category ID from GetCategoryList>" }`

**Response `result`:** `[{ "id": "<int>", "name": "<string>" }]`

**TBD:** which service provides `GetCategoryList`. It is not in `NewActivityApiService`.

### 3.6 Employee workload: `GetEmployeeTasksORVisits`

**Purpose:** each employee's activities, used for the workload status in the assigned-to picker.

**Request `data`** (`NewActivitiesFilterRequest`, §3.1): only `fromDateTime` and `endDateTime` (both set to the current instant, Q17) and `onlyMe: false`. Everything else is `null` or empty.

**Response `result`:** one group per employee, type and day:

```json
[
  {
    "employeeId": "<int>",
    "employeeName": "<string>",
    "typeId": "<int>",
    "typeName": "<string>",
    "createdDate": "<string, parsed with DateTime.tryParse>",
    "count": "<int>",
    "items": [{ "id": "<int>", "name": "<string>" }]
  }
]
```

**Mapping:** the groups are merged by `employeeId` into `Map<int, List<NewWorkloadItem>>`. Groups with no `employeeId` are skipped.

**Missing (Q12, blocks WP2):** the workload status field. Its name, type and values (Available / Busy / Very Busy / Overloaded) are TBD. Business rule: show the backend value, and map a missing or unknown value to `unknown`, never to Available.

### 3.7 Activity details: `GetVisitOrTaskDetails`

**Purpose:** an activity, together with the occurrence the user opened.

**Request `data`:** `{ "id": "<int, occurrence (details) ID>" }`

**Response `result`:** `NewRemoteActivityDetails` (§4.2).

**Permission flags (Q13, blocks WP4):** none yet beyond the per-assignee `canEdit` in `assignedTo`.

### 3.8 Activity master data: `GetVisitOrTaskMasterData`

**Purpose:** the master activity. It is used for the master view of the details screen and to fill the edit form, because Edit opens from the Main list, whose IDs are master IDs.

**Request `data`:** `{ "id": "<int, master ID>" }`

**Response `result`:** `NewRemoteActivityDetails` (§4.2). This endpoint sends the weekly and monthly days as `weeklyData` / `monthlyData`. The code also accepts `weeklyDays` / `monthlyDays`.

### 3.9 Timeline: `GetTaskHistoryTimeline`

**Purpose:** the activity's history.

**Request `data`:** `{ "id": "<int>" }`. **TBD:** whether this is the master ID or the occurrence ID. The repository passes its `activityId` through.

**Response `result`:**

```json
[
  {
    "id": "<int>",
    "dynamicForm": "<int>",
    "actionId": "<int, 0 added | 1 check in | 2 check out | 3 start | 4 complete>",
    "actionName": "<string>",
    "modifiedBy": "<int>",
    "modifiedByNAme": "<string>",
    "modifiedAt": "<string, M/d/yyyy h:mm:ss a>"
  }
]
```

### 3.10 Create or update: `InsertVisitOrTask` (multipart)

**Purpose:** create a Visit or Task, or update one. This is the approved create baseline (Q6).

**Parts:** `requestbody` (the envelope with `data` below, JSON-encoded) and one `file` part for each new attachment.

**`data`** (`NewInsertActivityRequest`, sent with `includeIfNull`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | int | yes | 0 = new. An update sends the activity's ID. |
| `typeId` | int | yes | 1 Task, 2 Visit |
| `title` | string | yes | Trimmed |
| `fromDate` / `toDate` | string | yes | `yyyy-MM-ddT00:00:00` |
| `fromTime` / `toTime` | string | yes | `HH:mm:ss` |
| `assignTo` | int[] | yes | Employee IDs |
| `description` | string | yes | Trimmed |
| `visitCategory` | int? | Visit only | `null` for a Task |
| `taskExecutionType` | int? | Visit only | `null` for a Task |
| `weeklyDays` | int[] | yes | Set only when the schedule is weekly (1 Saturday … 7 Friday) |
| `monthlyDays` | int[] | yes | Set only when the schedule is monthly (1 … 31) |
| `addressText` | string? | no | The repository doesn't set it, so it is always `null` |
| `longitude` / `latitude` | string? | Visit only | From the picked location |
| `companyContactId` / `companyContactEmail` | int? / string? | no | Not set by the repository, so always `null` |
| `companyContactName` / `companyContactMobile` | string? | Visit only | `null` when blank |
| `statusId` | int | yes | Default 1. An update sends the current status. |
| `isEnabled` | bool | yes | Default `true` |
| `companyId` | int | yes | The logged-in company |
| `attachments` | int[] | yes | IDs of already-uploaded attachments. The repository doesn't set it, so it is always `[]`. |
| `translate` | int[] | yes | Always `[]`. **TBD:** its purpose. |
| `priorityId` | int? | no | |
| `onlyMe` | bool | yes | The draft's `isPrivate`: only the creator sees it (Q16) |

**Response `result`:** `int?`, returned to the caller. **TBD:** whether it is the new master ID.

### 3.11 Step form: `GetTaskDynamicQuestion`

**Purpose:** the dynamic form (questions) a step asks before it is submitted.

**Request `data`:** `{ "id": "<int, master ID>", "actionId": "<int, the step's actionId 1..4>" }`

**Response `result`:** `RemoteDynamicForm` (shared with the old module). **TBD:** its shape is not documented here.

Which form each step asks comes from the visit category's `visitCategoryActionDynamicFormList` (§4.2). A step without a form asks no questions.

### 3.12–3.14 Steps: `CheckInOutWithLongitudeLatitude`, `startTaskWithLongitudeLatitude`, `CompletedTask` (multipart)

**Purpose:** check in or out, start, and complete an occurrence.

**Parts:** `requestbody` (the envelope with `data` below, JSON-encoded), plus one `file` part for each file answer.

**`data`** (`VisitOrTaskSubmitActionRequest`):

```json
{
  "dataDetails": {
    "detailsId": "<int, occurrence ID>",
    "dynamicFormId": "<int>",
    "longitude": "<string>",
    "latitude": "<string>",
    "isCheckin": "<bool, true only for the check-in step>"
  },
  "DaynamicScreen": [
    {
      "controlID": "…", "lable": "…", "controlType": "…", "isRequired": "…",
      "sortNo": "…", "dynamicFormId": "…", "controleWidth": "…", "fileType": "…",
      "lookupId": "…", "islookup": "…",
      "responseValue": "<the answer. For a file control: the file names, comma-separated>",
      "dynamicControlsData": [{ "id": "…", "controlID": "…", "value": "…", "relatedRowID": "…" }],
      "dynamicControlsAttachments": []
    }
  ]
}
```

The `DaynamicScreen` control fields are copied from the `RemoteDynamicForm` controls. **TBD:** their types.

Whether a visit category has check-in and check-out steps, and whether steps send the GPS position, comes from `hasCheckIn`, `hasCheckOut` and `locationRequired` on the visit category (§4.2). Missing means no.

**Response `result`:** `int?` (ignored).

### 3.15 Change status: `ChangeStatusWithReason`

**Request `data`:** `{ "detailsId": "<int, occurrence ID>", "statusId": "<string, the status ID as text>", "statusReason": "<string, default \"\">" }`

Note that `statusId` is sent as a **string** here.

**Response `result`:** `int?` (ignored).

### 3.16 Reschedule: `RescheduleTask`

**Request `data`:**

```json
{
  "detailsId": "<int, occurrence ID>",
  "newDate": "<yyyy-MM-dd>",
  "newFromTime": "<HH:mm:ss>",
  "newToTime": "<HH:mm:ss>",
  "remarks": "<string, default \"\">",
  "startDateTime": "<yyyy-MM-ddTHH:mm:ss, v2 only>",
  "endDateTime": "<yyyy-MM-ddTHH:mm:ss, v2 only>"
}
```

The shared class leaves out null v2 fields, so the old module keeps sending what it always did. The new module always sends both.

**Response `result`:** `int?` (ignored).

### 3.17 Add note: `AddComment`

**Request `data`:** `{ "detailsId": "<int, occurrence ID>", "comment": "<string>" }`

**Response `result`:** `int?` (ignored). How comments come back on the details result is TBD (Q21).

### 3.18 Enable or disable: `ActiveDesactiveVisitOrTask`

**Request `data`:** `{ "id": "<int, master ID>", "isEnabled": "<bool>" }`

**Response `result`:** `int?` (ignored).

### 3.19 Update progress: `UpdateTaskProgress`

**Purpose:** set an occurrence's progress (Confirmed, Q7: an `int` from 0 to 100, for Visits and Tasks).

**Request `data`:** `{ "detailsId": "<int, occurrence ID>", "progress": "<int 0..100>" }`

**Response `result`:** `{ "detailsId": "<int>", "progress": "<num>" }`

**Mapping:** the saved progress is rounded and clamped to 0..100. If `result` has no progress, the value that was sent is used. Who may update progress follows the backend flags (Q9, Q13).

---

## 4. Shared response types

### 4.1 `NewRemoteActivity` (list item)

One occurrence (`detailsid`) of an activity (`masterId`) assigned to one employee (`userId`).

```json
{
  "priorityId": "<int>", "priorityName": "<string>",
  "assignByName": "<string>",
  "masterId": "<int>", "masterName": "<string>",
  "detailsid": "<int>",
  "userId": "<int>", "userName": "<string>",
  "dateStr": "<string>",
  "actionId": "<int>", "actionName": "<string>",
  "status": "<RemoteStatus, §4.5>",
  "statusReason": "<string>",
  "typeId": "<int>", "typeName": "<string>",
  "taskExecutionId": "<int>", "taskExecutionName": "<string>",
  "addressTest": "<string>",
  "longtitude": "<string>", "latitude": "<string>",
  "createdAt": "<string>", "createdAtStr": "<string>",
  "isEnabled": "<bool>",
  "canEdit": "<bool, fallback; the per-assignee value in masterData.assignedTo wins>",
  "onlyMe": "<bool, private: only the creator sees it; also read from masterData>",
  "masterData": "<NewRemoteActivityMaster, §4.3>"
}
```

### 4.2 `NewRemoteActivityDetails` (details and master data)

```json
{
  "id": "<int, master ID>",
  "name": "<string>",
  "priorityId": "<int>", "priorityName": "<string>",
  "companyId": "<int>", "companyName": "<string>",
  "typeId": "<int>", "typeName": "<string>",
  "taskExecutionTypeId": "<int>", "taskExecutionTypeName": "<string>",
  "weeklyData": [{ "id": "<int>", "name": "<string>" }],
  "monthlyData": [{ "id": "<int>", "name": "<string>" }],
  "fromDateTime": "<string>", "endDateTime": "<string>",
  "addressText": "<string>", "longtitude": "<string>", "latitude": "<string>",
  "description": "<string>",
  "companyContactName": "<string>", "companyContactMobile": "<string>",
  "status": "<RemoteStatus>",
  "attachments": ["<RemoteAttachmentFile, same shape as the v1 visit attachments>"],
  "visitCategory": {
    "id": "<int, 0 for a task>",
    "name": "<string>",
    "hasCheckIn": "<bool>", "hasCheckOut": "<bool>", "locationRequired": "<bool>",
    "visitCategoryActionDynamicFormList": [
      { "actionId": "<int 1..4>", "actionName": "<string>", "dynamicFormId": "<int>" }
    ]
  },
  "isEnabled": "<bool>",
  "onlyMe": "<bool>",
  "assignedTo": ["<RemoteAssignedTo, §4.4>"],
  "details": {
    "id": "<int, occurrence ID>",
    "progress": "<num 0..100, null before any update>",
    "date": "<M/d/yyyy>",
    "fromTime": "<string>", "toTime": "<string>",
    "userId": "<int>", "userName": "<string>",
    "status": "<RemoteStatus>", "statusReason": "<string>",
    "addressText": "<string>", "longtitude": "<string>", "latitude": "<string>",
    "isCheckedIn": "<bool>", "isCheckedOut": "<bool>",
    "comments": ["<TBD, Q21>"]
  }
}
```

### 4.3 `NewRemoteActivityMaster` (`masterData` on a list item)

```json
{
  "id": "<int>",
  "companyId": "<int>",
  "description": "<string>",
  "visitCategoryId": "<int, 0 for a task>",
  "onlyMe": "<bool>",
  "fromDateTime": "<yyyy-MM-ddTHH:mm:ss, the only dates a list card shows>",
  "endDateTime": "<yyyy-MM-ddTHH:mm:ss>",
  "assignedTo": ["<RemoteAssignedTo>"]
}
```

### 4.4 `RemoteAssignedTo`

```json
{ "assinToId": "<int>", "assinToName": "<string>", "assinById": "<int>", "assinByName": "<string>", "canEdit": "<bool, whether the logged-in user may edit>" }
```

### 4.5 `RemoteStatus` and `RemoteLookUp`

```json
{ "id": "<int, status ID>", "name": "<string>", "color": "<string>" }
```

```json
{ "id": "<int>", "name": "<string>" }
```

---

## 5. Supporting lookups (API F)

Reuse the existing APIs for companies, employees, teams and departments whenever their response contracts meet this feature's needs. Don't duplicate lookup implementations without a technical reason. The company/employee tree used by the filters and the picker comes from the existing use cases (`new_build_company_employee_tree_use_case.dart`, `new_get_current_user_company_and_employee_use_case.dart`). Those endpoints are outside `NewActivityApiService` and are not documented here (**TBD**).

## 6. Open API questions

All of them are tracked in [open-questions.md](open-questions.md):

| # | Topic | Section |
|---|---|---|
| Q12 | Workload status field | §3.6 |
| Q13 | Per-activity permission flags | §3.7, §4.4 |
| Q14 | `endDateTime` inclusive or exclusive | §1.6, §3.2 |
| Q15 | No department field in the requests | §3.2 |
| Q16 | `onlyMe` meaning | §1.7, §3.10 |
| Q17 | Workload date window | §3.6 |
| Q18 | Main list response shape | §3.3 |
| Q19 | What `searchValue` matches | §3.2 |
| Q20 | Dashboard status-list field names | §3.1 |
| Q21 | `details.comments` shape | §4.2 |
| Q22 | Path prefix and the Main list's version | §1.1 |
| Q23 | Filter date format | §1.6 |
| Q24 | Failure codes and the `error` array | §1.5 |

Smaller TBDs that are not numbered questions yet: the meaning of the `int?` results (§2), whether the timeline ID is a master or occurrence ID (§3.9), `translate` (§3.10), whether priority names are localized (§3.4), the source of `GetCategoryList` (§3.5), and the `RemoteDynamicForm` shape (§3.11).
