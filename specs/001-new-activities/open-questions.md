# 001 New Activities: Open Questions

Status values:
- **Open:** no answer yet.
- **Assumed in code:** the code already uses an answer. Confirm it or change the code.
- **Resolved:** the answer is confirmed and folded into `spec.md`.

All questions were answered by the product owner on 2026-10-18 and folded into spec v1.1.

| # | Question | Status | Answer | Code impact |
|---|---|---|---|---|
| 1 | Dashboard and list endpoints | Resolved | Dashboard: `v2/Mobile/VisitAndTask/GetTaskAndVisitDashboard`. List: `v2/Mobile/VisitAndTask/GetVisitAndTaskAssignedToLoggedInUser`. Request/response shapes as implemented. | None |
| 2 | Current / Previous | Resolved | Current = scheduled start at or after today 00:00. Previous = scheduled start before today 00:00. | **Change:** Previous currently ends at yesterday 00:00, so yesterday's activities are dropped. |
| 3 | Statuses and priorities | Resolved | Statuses: 1 Pending, 2 In Progress, 3 Cancelled, 4 Completed, 5 Rejected, 7 Partially Completed. ID 6 is not used. Priorities come from `GetPriorityList`. | None |
| 4 | Workload status | Resolved | **The backend returns the workload status.** The app displays it and computes no thresholds. | **Change:** map the status from the `GetEmployeeTasksORVisits` response and add it to the entity. |
| 5 | Company, department, employee and privacy filters | Resolved | No selection means "All", which can be sent as `null`. Company defaults to All and sends the list of **all allowed company IDs**. Department and employee follow the same pattern using the allowed department and employee IDs. Private defaults to `isPrivate = true`. | Verify that the request builder sends the allowed IDs when "All" is selected. |
| 6 | Required create fields | Resolved | The current `new_activity_create` form and validation are the approved baseline. | None |
| 7 | Progress | Resolved | `int` from 0 to 100, for both Visits and Tasks. | None (the spec changes from `double` to `int`) |
| 8 | Sort date | Resolved | Scheduled start, newest or oldest first. | None |
| 9 | Permissions | Resolved | Both: the user's role decides screen access, and backend flags on each activity decide which actions are available. | Verify that the details screen gates actions on the backend flags. |
| 10 | Dashboard metrics | Resolved | The current UI is approved: a Visits-vs-Tasks donut, a stacked status bar and per-status progress rows. | None |
| 11 | Extra quick-filter chips | Resolved | Keep `main`, `scope`, `status` and `priority`. The spec is updated. | None |

## Needs clarification
- **Q5 privacy:** confirm what `isPrivate = true` means as a default. Does it mean "include private activities" or "show only private ones"?
