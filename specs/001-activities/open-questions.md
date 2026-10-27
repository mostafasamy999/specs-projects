# 001 New Activities: Open Questions

This is the single place for every business and API question in this module. [business-requirements.md](business-requirements.md) and [api-contracts.md](api-contracts.md) refer to these numbers and don't repeat them.

Status values:
- **Open:** no answer yet.
- **Assumed in code:** the code already uses an answer. Confirm it or change the code.
- **Waiting on backend:** the question was sent, and the answer will unblock tasks.
- **Resolved:** the answer is confirmed and folded into `business-requirements.md` (or `api-contracts.md` for a contract detail).

The product questions (Q1–Q11) were answered by the product owner on 2026-10-18 and folded into spec v1.1. The backend questions (Q12–Q14) were sent on 2026-10-18 and are still waiting for answers. Q15–Q24 were found on 2026-10-21 while consolidating the specs, by comparing the docs with the app code at `testflight` @ `a01b46459`. None of them has been sent yet. Q25–Q28 were found on 2026-10-27 during QA review v1.3 and haven't been sent yet either.

## Product questions (answered 2026-10-18)

| # | Question | Status | Answer | Code impact |
|---|---|---|---|---|
| 1 | Dashboard and list endpoints | Resolved | Dashboard: `v2/Mobile/VisitAndTask/GetTaskAndVisitDashboard`. List: `v2/Mobile/VisitAndTask/GetVisitAndTaskAssignedToLoggedInUser`. Request/response shapes as implemented. | None |
| 2 | Current / Previous | Resolved | Current = scheduled start at or after today 00:00. Previous = scheduled start before today 00:00. | **Change:** Previous currently ends at yesterday 00:00, so yesterday's activities are dropped. |
| 3 | Statuses and priorities | Resolved | Statuses: 1 Pending, 2 In Progress, 3 Cancelled, 4 Completed, 5 Rejected, 7 Partially Completed. ID 6 is not used. Priorities come from `GetPriorityList`. | None |
| 4 | Workload status | Resolved | **The backend returns the workload status.** The app displays it and computes no thresholds. | **Change:** map the status from the `GetEmployeeTasksORVisits` response and add it to the entity. |
| 5 | Company, department, employee and privacy filters | Resolved | No selection means "All", which can be sent as `null`. Company defaults to All and sends the list of **all allowed company IDs**. Department and employee follow the same pattern using the allowed department and employee IDs. Private defaults to `isPrivate = true`, which means private activities are included along with public ones. | Verify that the request builder sends the allowed IDs when "All" is selected. See also Q15 and Q16. |
| 6 | Required create fields | Resolved | The current `new_activity_create` form and validation are the approved baseline. | None |
| 7 | Progress | Resolved | `int` from 0 to 100, for both Visits and Tasks. | None (the spec changed from `double` to `int`) |
| 8 | Sort date | Resolved | Scheduled start, newest or oldest first. | None |
| 9 | Permissions | Resolved | Both: the user's role decides screen access, and backend flags on each activity decide which actions are available. | Verify that the details screen gates actions on the backend flags. |
| 10 | Dashboard metrics | Resolved | The current UI is approved: a Visits-vs-Tasks donut, a stacked status bar and per-status progress rows. | None |
| 11 | Extra quick-filter chips | Resolved | Keep `main`, `scope`, `status` and `priority`. The spec is updated. | None |

## Backend questions (sent 2026-10-18)

| # | Question | Status | Answer | Unblocks |
|---|---|---|---|---|
| 12 | Workload status on `GetEmployeeTasksORVisits`: field name, type (enum ID or string), and the value set Available / Busy / Very Busy / Overloaded | Waiting on backend | | WP2 (T2.1–T2.6) |
| 13 | Per-activity permission flags on `GetVisitOrTaskDetails` / `GetVisitOrTaskMasterData` (`canChangeStatus`, `canReschedule`, `canUpdateProgress`, `canToggleEnabled`, and start/complete/check-in-out/add-note if they are permission-based) | Waiting on backend | | WP4 (T4.1–T4.2) |
| 14 | Is `endDateTime` inclusive or exclusive on the list and dashboard requests? | Waiting on backend | | T1.1 (fallback: assume inclusive and send today 00:00 − 1s) |

**Note on Q13 (2026-10-21):** the code already reads one per-user flag. Each entry of `assignedTo` (on the details result and on a list item's `masterData`) has a `canEdit` boolean, and a list item also has a top-level `canEdit` kept as a fallback. Ask the backend whether `canEdit` covers some of the Q13 actions, or whether separate flags are coming.

## Found while consolidating (2026-10-21, not sent yet)

| # | Question | Status | What the code does now | Affects |
|---|---|---|---|---|
| 15 | Q5 says department "All" sends every allowed department ID. The list, Main list and dashboard requests have no department field. Are departments filtered only through the employee IDs they resolve to? | Assumed in code | The department picker resolves to `companyId` / `employeeId` lists (`new_activities_query.dart`). | Department filter, T5.3 |
| 16 | What does `onlyMe` mean on the list and dashboard requests, compared with create? The spec calls the filter `isPrivate`. | Assumed in code | The list and dashboard send `onlyMe = true` for the All and Private scopes and `false` for My team and My activities. Create sends `onlyMe = isPrivate` ("only the creator sees it"). The DTO comment says "Null: no only-me filter (the All scope)", but the code never sends null. | Scope filter, T5.5 |
| 17 | What date window should the workload request use? | Assumed in code | `fromDateTime` and `endDateTime` are both the current instant, with its time (`yyyy-MM-ddTHH:mm:ss`), not today's start and end. Related to Q14. | Workload picker, WP2 |
| 18 | What is the response shape of `GetVisitAndTaskList` (the Main list)? | Open | The code accepts either a page (`items` or `data`, with `totalCount`) or a plain list. Without a total, a full page means "there may be more". | Main list pagination |
| 19 | Which fields does `searchValue` match: title, assigned employee, creator? | Open | One `searchValue` string is sent on the list and Main list requests. | Search, acceptance criteria |
| 20 | Are the dashboard `taskStatusList` / `visitStatusList` entries really `statusId`, `statusName` and `count`? | Open | A code TODO says the saved Postman example had empty lists, so these names are unconfirmed. | Dashboard status bar and rows |
| 21 | What is the shape of `details.comments` on `GetVisitOrTaskDetails`? | Open | It is read as a raw list. It was empty in the sample. | Notes on the details screen |
| 22 | What is the real path prefix? The docs say `v2/Mobile/VisitAndTask/…`. Is the Main list v1 or v2? | Open | Every endpoint, including the Main list, uses `Mobile/VisitAndTask/<Name>` relative to the flavor's base URL. The commented-out base URLs end in `api/v2/`. The old current-state doc called the Main list "v1"; its request DTO calls it "v2". | API documentation only |
| 23 | Which date format do the filter requests expect: `yyyy-MM-dd` or `yyyy-MM-ddTHH:mm:ss`? | Assumed in code | The DTO comments say `yyyy-MM-dd` for the dashboard and workload requests, but the repository sends `yyyy-MM-ddTHH:mm:ss` for the list, Main list, dashboard and workload. | Q14, WP1 |
| 24 | Which `statusCode` values and `error` contents does the backend return on failure? | Open | Any response without `success == true` and `statusCode == 200` fails with `responseMessage`. Dio errors fail with the exception's message. | Error states |

## Found in QA review v1.3 (2026-10-27, not sent yet)

| # | Question | Status | What the code does now | Affects |
|---|---|---|---|---|
| 25 | When the user selects the Main chip in the list and goes to the dashboard, must the dashboard counts match the Main list? Today they can't: Main shows master activities from `GetVisitAndTaskList`, while the dashboard always calls `GetTaskAndVisitDashboard`, which has no Main (`isMain`) field and likely counts occurrences. This contradicts BR §6.1 ("quick filters must stay consistent with … the dashboard state"). Options: (a) the backend adds a Main flag or master-level counts to the dashboard, (b) the dashboard ignores Main and says what it counts, (c) Main is cleared when the user returns to the dashboard. | Open (product, then backend if (a)) | Per [api-contracts.md](api-contracts.md) §3.1 and §3.3: Main switches only the list endpoint. The dashboard request has no Main field, so its numbers don't change. | Dashboard (BR §5.1, §6.1), Main quick filter, QA G-50, DSH-15, QF-16 |
| 26 | Same as Q25 for Priority and Search: must the dashboard counts follow them? The list request has `priorityId` and `searchValue`; the dashboard request has neither, so the dashboard keeps counting every priority and title while the list is filtered. | Open (product, then backend) | Per api-contracts §3.1 and §3.2: Priority and Search are sent only to the list and Main list. | Dashboard, Priority chip, search, QA G-51, DSH-16, DSH-17 |
| 27 | Must the Main list filter by Visit execution type? `GetVisitAndTaskList` has no `executionTypeId`, so Main ignores that filter while the sheet still shows it as applied. | Open (product, then backend) | Per api-contracts §3.3: the Main request has no execution-type field. | Main quick filter, Visit filters, QA G-52, QF-17 |
| 28 | Does `GetVisitAndTaskAssignedToLoggedInUser` return other employees' activities when the app sends the team's `employeeId` list (All and My team scopes), or only the logged-in user's, as its name says? | Open (backend) | Per api-contracts §1.7 and §3.2: the app uses this endpoint for every scope and sends the team's IDs. | Scope chip, list vs dashboard totals, QA G-55, QF-18 |

## When an answer arrives

1. Fill in the **Answer** column (or the "What the code does now" column for Q15–Q24) and set the status to Resolved.
2. Fold the answer into [business-requirements.md](business-requirements.md) (§6.5 workload, §3 permissions, §7.2 Previous, §7.3 filters) or [api-contracts.md](api-contracts.md) (fields and formats), and bump the version.
3. Remove the 🔒 from the matching tasks in [business-requirements.md §12.3](business-requirements.md#123-task-checklist).
4. Add an entry to [changelog.md](changelog.md).
